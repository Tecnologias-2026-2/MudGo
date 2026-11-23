<?php
declare(strict_types=1);
final class RatingController
{
    public static function create(): never
    {
        $u=Auth::requireRole(['cliente']);$d=Request::body();Request::requireFields($d,['solicitud_id','puntuacion']);$score=(int)$d['puntuacion'];if($score<1||$score>5)Response::error('La puntuación debe estar entre 1 y 5.',422);
        $pdo=Database::connection();$q=$pdo->prepare("SELECT id,proveedor_id FROM solicitudes WHERE id=? AND cliente_id=? AND estado='finalizada'");$q->execute([(int)$d['solicitud_id'],$u['id']]);$s=$q->fetch();if(!$s||!$s['proveedor_id'])Response::error('Solo puedes calificar un servicio finalizado.',409);
        try{$st=$pdo->prepare('INSERT INTO calificaciones (solicitud_id,cliente_id,proveedor_id,puntuacion,comentario) VALUES (?,?,?,?,?)');$st->execute([$s['id'],$u['id'],$s['proveedor_id'],$score,$d['comentario']??null]);}
        catch(PDOException $e){if($e->getCode()==='23000')Response::error('Esta solicitud ya fue calificada.',409);throw $e;}
        $ratingId=(int)$pdo->lastInsertId();
        $avg=$pdo->prepare('SELECT AVG(puntuacion) promedio, COUNT(*) total FROM calificaciones WHERE proveedor_id=?'); $avg->execute([$s['proveedor_id']]); $stats=$avg->fetch();
        $pdo->prepare('UPDATE proveedores SET calificacion_promedio=?, total_calificaciones=? WHERE usuario_id=?')->execute([$stats['promedio'],$stats['total'],$s['proveedor_id']]);
        Response::success(['id'=>$ratingId],'Calificación registrada.',201);
    }
    public static function index(): never
    {
        $u=Auth::requireUser();$pdo=Database::connection();if($u['rol']==='admin')$st=$pdo->query('SELECT * FROM calificaciones ORDER BY created_at DESC');else{$st=$pdo->prepare('SELECT * FROM calificaciones WHERE cliente_id=? OR proveedor_id=? ORDER BY created_at DESC');$st->execute([$u['id'],$u['id']]);}Response::success($st->fetchAll());
    }
}
