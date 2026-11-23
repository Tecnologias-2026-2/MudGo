<?php
declare(strict_types=1);
final class AdminController
{
    public static function users(): never
    {
        Auth::requireRole(['admin']);$st=Database::connection()->query('SELECT id,nombre,correo,telefono,rol,estado,created_at FROM usuarios ORDER BY created_at DESC');Response::success($st->fetchAll());
    }
    public static function setUserStatus(int $id): never
    {
        Auth::requireRole(['admin']);$d=Request::body();if(!in_array($d['estado']??'', ['activo','inactivo','suspendido'],true))Response::error('Estado no válido.',422);$st=Database::connection()->prepare('UPDATE usuarios SET estado=? WHERE id=? AND rol<>\'admin\'');$st->execute([$d['estado'],$id]);if(!$st->rowCount())Response::error('Usuario no encontrado o no modificable.',404);Response::success(['id'=>$id,'estado'=>$d['estado']]);
    }
    public static function dashboard(): never
    {
        Auth::requireRole(['admin']);$pdo=Database::connection();$data=[];foreach(['usuarios','solicitudes','proveedores','vehiculos','pagos','calificaciones'] as $table)$data[$table]=(int)$pdo->query("SELECT COUNT(*) FROM $table")->fetchColumn();Response::success($data);
    }
}
