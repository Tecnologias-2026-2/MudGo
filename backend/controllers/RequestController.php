<?php
declare(strict_types=1);

final class RequestController
{
    public static function index(): never
    {
        $user = Auth::requireUser(); $pdo = Database::connection();
        if ($user['rol'] === 'cliente') {
            $sql = 'SELECT s.*, p.nombre AS proveedor_nombre FROM solicitudes s LEFT JOIN usuarios p ON p.id=s.proveedor_id WHERE s.cliente_id=? ORDER BY s.created_at DESC'; $args=[$user['id']];
        } elseif ($user['rol'] === 'proveedor') {
            $sql = "SELECT s.*, c.nombre AS cliente_nombre FROM solicitudes s JOIN usuarios c ON c.id=s.cliente_id WHERE s.proveedor_id=? OR (s.proveedor_id IS NULL AND s.estado IN ('esperando_proveedor','buscando_proveedor') AND NOT EXISTS (SELECT 1 FROM rechazos_solicitud r WHERE r.solicitud_id=s.id AND r.proveedor_id=?)) ORDER BY s.created_at DESC";
            $args=[$user['id'],$user['id']];
        } else { $sql='SELECT s.*, c.nombre AS cliente_nombre, p.nombre AS proveedor_nombre FROM solicitudes s JOIN usuarios c ON c.id=s.cliente_id LEFT JOIN usuarios p ON p.id=s.proveedor_id ORDER BY s.created_at DESC'; $args=[]; }
        $stmt=$pdo->prepare($sql); $stmt->execute($args); Response::success($stmt->fetchAll());
    }
    public static function create(): never
    {
        $user=Auth::requireRole(['cliente']); $d=Request::body();
        Request::requireFields($d,['origen','destino','fecha_servicio','hora_servicio','tipo_carga','tipo_vehiculo']);
        if (strtotime((string)$d['fecha_servicio']) === false || $d['fecha_servicio'] < date('Y-m-d')) Response::error('La fecha del servicio no es válida o está en el pasado.',422);
        if (mb_strlen(trim((string)$d['origen'])) > 255 || mb_strlen(trim((string)$d['destino'])) > 255) Response::error('Las direcciones no pueden superar 255 caracteres.',422);
        $distance=max(1,(float)($d['distancia_km']??1)); $volume=(string)$d['tipo_carga'];
        $volumeRates=['pequeno'=>35000,'mediano'=>60000,'grande'=>95000];
        $vehicleRates=['van'=>30000,'camion_pequeno'=>38000,'camion_mediano'=>45000,'camion_grande'=>65000];
        $vehicle=(string)$d['tipo_vehiculo']; $helpers=max(0,(int)($d['ayudantes']??0));
        $subtotal=(int)round($distance*3870+($volumeRates[$volume]??35000)+($vehicleRates[$vehicle]??30000)+$helpers*18000);
        $total=(int)round($subtotal*1.05);
        $stmt=Database::connection()->prepare('INSERT INTO solicitudes (cliente_id, origen, destino, fecha_servicio, hora_servicio, tipo_carga, tipo_vehiculo, ayudantes, distancia_km, observaciones, subtotal, total, estado) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
        $stmt->execute([$user['id'],trim($d['origen']),trim($d['destino']),$d['fecha_servicio'],$d['hora_servicio'],$volume,$vehicle,$helpers,$distance,$d['observaciones']??null,$subtotal,$total,'cotizada']);
        $id=(int)Database::connection()->lastInsertId();
        Response::success(['id'=>$id,'subtotal'=>$subtotal,'total'=>$total,'estado'=>'cotizada'],'Cotización calculada y solicitud creada.',201);
    }
    public static function show(int $id): never
    {
        $u=Auth::requireUser(); $st=Database::connection()->prepare('SELECT * FROM solicitudes WHERE id=?'); $st->execute([$id]); $s=$st->fetch();
        if(!$s) Response::error('Solicitud no encontrada.',404);
        if($u['rol']!=='admin' && (int)$s['cliente_id']!==(int)$u['id'] && (int)($s['proveedor_id']??0)!==(int)$u['id']) Response::error('No tienes acceso a esta solicitud.',403);
        Response::success($s);
    }
    public static function confirm(int $id): never
    {
        $u=Auth::requireRole(['cliente']); $st=Database::connection()->prepare("UPDATE solicitudes SET estado='esperando_proveedor' WHERE id=? AND cliente_id=? AND estado='cotizada'"); $st->execute([$id,$u['id']]);
        if(!$st->rowCount()) Response::error('La solicitud no existe o no se encuentra en estado cotizada.',409);
        Response::success(['id'=>$id,'estado'=>'esperando_proveedor'],'Solicitud enviada a proveedores.');
    }
    public static function decision(int $id, string $decision): never
    {
        $u=Auth::requireRole(['proveedor']); if(!in_array($decision,['aceptar','rechazar'],true)) Response::error('Decisión no válida.',422);
        $pdo=Database::connection(); $pdo->beginTransaction();
        try {
            $q=$pdo->prepare("SELECT * FROM solicitudes WHERE id=? AND estado IN ('esperando_proveedor','buscando_proveedor') FOR UPDATE"); $q->execute([$id]); $s=$q->fetch();
            if(!$s) Response::error('La solicitud ya no está disponible.',409);
            $p=$pdo->prepare('SELECT id, disponible FROM proveedores WHERE usuario_id=? FOR UPDATE'); $p->execute([$u['id']]); $provider=$p->fetch();
            if(!$provider || !(int)$provider['disponible']) Response::error('El proveedor no está disponible.',403);
            if($decision==='aceptar') {
                $up=$pdo->prepare("UPDATE solicitudes SET proveedor_id=?, estado='aceptada' WHERE id=?"); $up->execute([$u['id'],$id]);
            } else {
                $pdo->prepare("INSERT INTO rechazos_solicitud (solicitud_id, proveedor_id) VALUES (?,?) ON DUPLICATE KEY UPDATE created_at=CURRENT_TIMESTAMP")->execute([$id,$u['id']]);
                $up=$pdo->prepare("UPDATE solicitudes SET estado='buscando_proveedor' WHERE id=?"); $up->execute([$id]);
            }
            $pdo->commit(); Response::success(['id'=>$id,'estado'=>$decision==='aceptar'?'aceptada':'buscando_proveedor'],'Respuesta del proveedor registrada.');
        } catch(Throwable $e) { if($pdo->inTransaction())$pdo->rollBack(); throw $e; }
    }
    public static function updateStatus(int $id): never
    {
        $u=Auth::requireRole(['proveedor','admin']); $d=Request::body(); Request::requireFields($d,['estado']);
        $allowed=['en_camino','en_curso','finalizada','cancelada']; if(!in_array($d['estado'],$allowed,true)) Response::error('Estado no permitido.',422);
        $pdo=Database::connection();
        $current=$pdo->prepare('SELECT estado FROM solicitudes WHERE id=?'); $current->execute([$id]); $currentState=$current->fetchColumn();
        if(!$currentState) Response::error('Solicitud no encontrada.',404);
        $transitions=['pagada'=>['en_camino','cancelada'],'en_camino'=>['en_curso','cancelada'],'en_curso'=>['finalizada']];
        if($u['rol']!=='admin' && !in_array($d['estado'],$transitions[$currentState]??[],true)) Response::error('Transición de estado no permitida.',409);
        $sql=$u['rol']==='admin'?'UPDATE solicitudes SET estado=? WHERE id=?':'UPDATE solicitudes SET estado=? WHERE id=? AND proveedor_id=?';
        $st=$pdo->prepare($sql); $args=[$d['estado'],$id]; if($u['rol']!=='admin')$args[]=$u['id']; $st->execute($args);
        if(!$st->rowCount()) Response::error('No se pudo actualizar la solicitud.',404);
        Response::success(['id'=>$id,'estado'=>$d['estado']]);
    }
}
