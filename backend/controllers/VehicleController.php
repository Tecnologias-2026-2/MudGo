<?php
declare(strict_types=1);
final class VehicleController
{
    public static function index(): never
    {
        $u=Auth::requireUser(); $pdo=Database::connection();
        if($u['rol']==='admin') {$st=$pdo->query('SELECT v.*,u.nombre AS proveedor_nombre FROM vehiculos v JOIN usuarios u ON u.id=v.proveedor_id ORDER BY v.created_at DESC');}
        else {$st=$pdo->prepare('SELECT * FROM vehiculos WHERE proveedor_id=? ORDER BY created_at DESC');$st->execute([$u['id']]);}
        Response::success($st->fetchAll());
    }
    public static function create(): never
    {
        $u=Auth::requireRole(['proveedor']);$d=Request::body();Request::requireFields($d,['modelo','placa','tipo','capacidad']);
        $st=Database::connection()->prepare('INSERT INTO vehiculos (proveedor_id,modelo,placa,tipo,capacidad,disponible) VALUES (?,?,?,?,?,?)');
        try{$st->execute([$u['id'],trim($d['modelo']),strtoupper(trim($d['placa'])),trim($d['tipo']),trim($d['capacidad']),!empty($d['disponible'])?1:0]);}
        catch(PDOException $e){if($e->getCode()==='23000')Response::error('La placa ya está registrada.',409);throw $e;}
        Response::success(['id'=>(int)Database::connection()->lastInsertId()],'Vehículo registrado.',201);
    }
    public static function update(int $id): never
    {
        $u=Auth::requireRole(['proveedor']);$d=Request::body();
        $fields=['modelo','placa','tipo','capacidad','disponible'];$sets=[];$values=[];
        foreach($fields as $f) if(array_key_exists($f,$d)){$sets[]="$f=?";$values[]=$f==='disponible'?(int)(bool)$d[$f]:$d[$f];}
        if(!$sets)Response::error('No se enviaron campos para actualizar.',422);
        $values[]=$id;$values[]=$u['id'];$st=Database::connection()->prepare('UPDATE vehiculos SET '.implode(',',$sets).' WHERE id=? AND proveedor_id=?');$st->execute($values);
        if(!$st->rowCount())Response::error('Vehículo no encontrado o sin cambios.',404);Response::success(['id'=>$id]);
    }
    public static function delete(int $id): never
    {
        $u=Auth::requireRole(['proveedor','admin']);$sql=$u['rol']==='admin'?'DELETE FROM vehiculos WHERE id=?':'DELETE FROM vehiculos WHERE id=? AND proveedor_id=?';$args=[$id];if($u['rol']!=='admin')$args[]=$u['id'];
        $st=Database::connection()->prepare($sql);$st->execute($args);if(!$st->rowCount())Response::error('Vehículo no encontrado.',404);Response::success(null,'Vehículo eliminado.');
    }
}
