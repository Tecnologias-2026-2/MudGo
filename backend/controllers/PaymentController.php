<?php
declare(strict_types=1);
final class PaymentController
{
    public static function create(): never
    {
        $u=Auth::requireRole(['cliente']);$d=Request::body();Request::requireFields($d,['solicitud_id','metodo']);$pdo=Database::connection();
        $pdo->beginTransaction();
        try{
            $q=$pdo->prepare('SELECT * FROM solicitudes WHERE id=? AND cliente_id=? FOR UPDATE');$q->execute([(int)$d['solicitud_id'],$u['id']]);$s=$q->fetch();
            if(!$s)Response::error('Solicitud no encontrada.',404);
            if($s['estado']!=='aceptada')Response::error('El pago solo está habilitado después de la aceptación del proveedor.',409);
            $methods=['efectivo','transferencia','tarjeta','demo'];
            if(!in_array($d['metodo'],$methods,true)) Response::error('Método de pago no válido.',422);
            $existing=$pdo->prepare("SELECT id FROM pagos WHERE solicitud_id=? AND estado='exitoso' LIMIT 1"); $existing->execute([$s['id']]);
            if($existing->fetch()) Response::error('La solicitud ya tiene un pago exitoso.',409);
            if(!in_array($d['resultado_demo']??'exitoso',['exitoso','fallido'],true)) Response::error('Resultado de demostración no válido.',422);
            $status=($d['resultado_demo']??'exitoso')==='fallido'?'fallido':'exitoso';
            $st=$pdo->prepare('INSERT INTO pagos (solicitud_id,cliente_id,monto,metodo,estado,referencia) VALUES (?,?,?,?,?,?)');
            $st->execute([$s['id'],$u['id'],$s['total'],$d['metodo'],$status,bin2hex(random_bytes(8))]);
            if($status==='exitoso')$pdo->prepare("UPDATE solicitudes SET estado='pagada' WHERE id=?")->execute([$s['id']]);
            $pdo->commit();Response::success(['pago_id'=>(int)$pdo->lastInsertId(),'estado'=>$status,'monto'=>(int)$s['total']],$status==='exitoso'?'Pago registrado.':'Pago rechazado en modo demostración.',201);
        }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
    }
    public static function index(): never
    {
        $u=Auth::requireUser();$sql=$u['rol']==='admin'?'SELECT * FROM pagos ORDER BY created_at DESC':'SELECT * FROM pagos WHERE cliente_id=? ORDER BY created_at DESC';$st=Database::connection()->prepare($sql);$st->execute($u['rol']==='admin'?[]:[$u['id']]);Response::success($st->fetchAll());
    }
}
