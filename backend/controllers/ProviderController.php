<?php
declare(strict_types=1);
final class ProviderController
{
    public static function profile(): never
    {
        $u=Auth::requireRole(['proveedor']); $pdo=Database::connection();
        if(Request::method()==='GET'){
            $q=$pdo->prepare('SELECT u.id,u.nombre,u.correo,u.telefono,u.created_at,p.disponible,p.descripcion,p.calificacion_promedio,p.total_calificaciones,(SELECT COUNT(*) FROM solicitudes s WHERE s.proveedor_id=u.id AND s.estado=\'finalizada\') AS servicios_completados,(SELECT COALESCE(SUM(s.total),0) FROM solicitudes s WHERE s.proveedor_id=u.id AND s.estado IN (\'pagada\',\'en_camino\',\'en_curso\',\'finalizada\')) AS ingresos FROM usuarios u JOIN proveedores p ON p.usuario_id=u.id WHERE u.id=?');
            $q->execute([$u['id']]); Response::success($q->fetch());
        }
        $d=Request::body(); $sets=[];$args=[];
        foreach(['nombre','correo','telefono'] as $f) if(array_key_exists($f,$d)){$v=trim((string)$d[$f]);if($f==='correo'&&!filter_var($v,FILTER_VALIDATE_EMAIL))Response::error('Correo no válido.',422);$sets[]="$f=?";$args[]=$v;}
        if(array_key_exists('descripcion',$d)){$sets[]='descripcion=?';$args[]=trim((string)$d['descripcion']);}
        if(!$sets)Response::error('No hay datos para actualizar.',422);
        $pdo->beginTransaction();try{
            $userFields=array_filter($sets,fn($x)=>!str_contains($x,'descripcion'));
            $providerFields=array_filter($sets,fn($x)=>str_contains($x,'descripcion'));
            if($userFields){$vals=[];foreach($userFields as $x){$idx=array_search($x,$sets,true);$vals[]=$args[$idx];}$pdo->prepare('UPDATE usuarios SET '.implode(',',$userFields).' WHERE id=?')->execute([...$vals,$u['id']]);}
            if($providerFields){$idx=array_search('descripcion=?',$sets,true);$pdo->prepare('UPDATE proveedores SET descripcion=? WHERE usuario_id=?')->execute([$args[$idx],$u['id']]);}
            $pdo->commit();Response::success(Auth::user(),'Perfil actualizado.');
        }catch(Throwable $e){$pdo->rollBack();throw $e;}
    }
    public static function availability(): never
    {
        $u=Auth::requireRole(['proveedor']);$d=Request::body();if(!array_key_exists('disponible',$d))Response::error('Indica la disponibilidad.',422);
        $pdo=Database::connection();
        if((bool)$d['disponible']){$q=$pdo->prepare("SELECT COUNT(*) FROM solicitudes WHERE proveedor_id=? AND estado IN ('aceptada','pagada','en_camino','en_curso')");$q->execute([$u['id']]);if((int)$q->fetchColumn()>0)Response::error('La disponibilidad se restablecerá cuando finalices el servicio activo.',409);}
        if(!(bool)$d['disponible']){$q=$pdo->prepare("SELECT COUNT(*) FROM solicitudes WHERE proveedor_id=? AND estado IN ('aceptada','pagada','en_camino','en_curso')");$q->execute([$u['id']]);if((int)$q->fetchColumn()>0)Response::error('No puedes desactivarte mientras tienes un servicio pendiente o en curso.',409);}
        $pdo->prepare('UPDATE proveedores SET disponible=? WHERE usuario_id=?')->execute([(int)(bool)$d['disponible'],$u['id']]);
        Response::success(['disponible'=>(bool)$d['disponible']]);
    }
}
