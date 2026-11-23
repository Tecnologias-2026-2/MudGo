<?php
declare(strict_types=1);

final class ProfileController
{
    public static function profile(): never
    {
        $u = Auth::requireUser();
        $pdo = Database::connection();
        if (Request::method() === 'GET') {
            if ($u['rol'] === 'cliente') {
                $q = $pdo->prepare('SELECT u.id,u.nombre,u.correo,u.telefono,u.created_at,c.ciudad,c.direccion FROM usuarios u LEFT JOIN clientes c ON c.usuario_id=u.id WHERE u.id=?');
            } elseif ($u['rol'] === 'proveedor') {
                $q = $pdo->prepare('SELECT u.id,u.nombre,u.correo,u.telefono,u.created_at,p.descripcion FROM usuarios u LEFT JOIN proveedores p ON p.usuario_id=u.id WHERE u.id=?');
            } else {
                Response::error('Este perfil no está disponible para administradores.', 403);
            }
            $q->execute([$u['id']]);
            Response::success($q->fetch());
        }
        if (Request::method() !== 'PATCH') Response::error('Método no permitido.', 405);
        $d = Request::body();
        $allowed = ['nombre','correo','telefono'];
        if ($u['rol'] === 'cliente') $allowed = [...$allowed, 'ciudad', 'direccion'];
        if ($u['rol'] === 'proveedor') $allowed[] = 'descripcion';
        $sets = []; $values = [];
        foreach ($allowed as $field) {
            if (!array_key_exists($field, $d)) continue;
            $value = trim((string)$d[$field]);
            if ($field === 'correo') $value = strtolower($value);
            if ($field === 'nombre' && strlen($value) < 3) Response::error('El nombre debe tener al menos 3 caracteres.', 422);
            if ($field === 'correo' && !filter_var($value, FILTER_VALIDATE_EMAIL)) Response::error('El correo electrónico no es válido.', 422);
            if ($field === 'telefono' && $value !== '' && !preg_match('/^[0-9+() .-]{7,30}$/', $value)) Response::error('El teléfono no tiene un formato válido.', 422);
            if ($field === 'ciudad' && strlen($value) > 100) Response::error('La ciudad es demasiado larga.', 422);
            if ($field === 'direccion' && strlen($value) > 255) Response::error('La dirección es demasiado larga.', 422);
            if ($field === 'descripcion' && strlen($value) > 2000) Response::error('La descripción es demasiado larga.', 422);
            if (in_array($field, ['nombre','correo','telefono'], true)) { $sets[] = "$field=?"; $values[] = $value === '' && $field === 'telefono' ? null : $value; }
        }
        if (!$sets && !array_key_exists('ciudad', $d) && !array_key_exists('direccion', $d) && !array_key_exists('descripcion', $d)) Response::error('No hay cambios para guardar.', 422);
        if (isset($d['correo'])) {
            $q = $pdo->prepare('SELECT id FROM usuarios WHERE correo=? AND id<>?'); $q->execute([strtolower(trim((string)$d['correo'])), $u['id']]);
            if ($q->fetch()) Response::error('Ese correo ya está asociado a otra cuenta.', 409);
        }
        $pdo->beginTransaction();
        try {
            if ($sets) { $pdo->prepare('UPDATE usuarios SET '.implode(',', $sets).' WHERE id=?')->execute([...$values, $u['id']]); }
            if ($u['rol'] === 'cliente' && (array_key_exists('ciudad',$d) || array_key_exists('direccion',$d))) {
                $pdo->prepare('UPDATE clientes SET ciudad=COALESCE(?,ciudad), direccion=COALESCE(?,direccion) WHERE usuario_id=?')->execute([array_key_exists('ciudad',$d)?trim((string)$d['ciudad']):null,array_key_exists('direccion',$d)?trim((string)$d['direccion']):null,$u['id']]);
            }
            if ($u['rol'] === 'proveedor' && array_key_exists('descripcion',$d)) $pdo->prepare('UPDATE proveedores SET descripcion=? WHERE usuario_id=?')->execute([trim((string)$d['descripcion']),$u['id']]);
            $pdo->commit();
        } catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $e; }
        Response::success(Auth::user(), 'Perfil actualizado correctamente.');
    }

    public static function changePassword(): never
    {
        $u = Auth::requireUser(); $d = Request::body(); Request::requireFields($d, ['actual','nueva','confirmar']);
        $new = (string)$d['nueva'];
        if (strlen($new) < 8 || !preg_match('/[A-Za-z]/', $new) || !preg_match('/[0-9]/', $new)) Response::error('La nueva contraseña debe tener al menos 8 caracteres e incluir letras y números.', 422);
        if (!hash_equals($new, (string)$d['confirmar'])) Response::error('La confirmación no coincide.', 422);
        $pdo = Database::connection(); $q = $pdo->prepare('SELECT password_hash FROM usuarios WHERE id=?'); $q->execute([$u['id']]); $hash = $q->fetchColumn();
        if (!$hash || !password_verify((string)$d['actual'], (string)$hash)) Response::error('La contraseña actual es incorrecta.', 401);
        $pdo->prepare('UPDATE usuarios SET password_hash=? WHERE id=?')->execute([password_hash($new, PASSWORD_DEFAULT), $u['id']]);
        session_regenerate_id(true);
        Response::success(null, 'Contraseña actualizada correctamente.');
    }

    public static function addresses(): never
    {
        $u = Auth::requireRole(['cliente']); $pdo = Database::connection();
        if (Request::method() === 'GET') { $q=$pdo->prepare('SELECT id,alias,direccion,created_at FROM direcciones_cliente WHERE cliente_id=? ORDER BY id DESC');$q->execute([$u['id']]);Response::success($q->fetchAll()); }
        if (Request::method() === 'POST') { $d=Request::body();Request::requireFields($d,['alias','direccion']);$alias=trim((string)$d['alias']);$address=trim((string)$d['direccion']);if(strlen($alias)>80||strlen($address)<6||strlen($address)>255)Response::error('Revisa el nombre y la dirección.',422);$q=$pdo->prepare('INSERT INTO direcciones_cliente (cliente_id,alias,direccion) VALUES (?,?,?)');$q->execute([$u['id'],$alias,$address]);Response::success(['id'=>(int)$pdo->lastInsertId(),'alias'=>$alias,'direccion'=>$address],'Dirección guardada.',201); }
        Response::error('Método no permitido.',405);
    }

    public static function deleteAddress(int $id): never
    {
        $u=Auth::requireRole(['cliente']);$q=Database::connection()->prepare('DELETE FROM direcciones_cliente WHERE id=? AND cliente_id=?');$q->execute([$id,$u['id']]);if(!$q->rowCount())Response::error('Dirección no encontrada.',404);Response::success(null,'Dirección eliminada.');
    }

    public static function preferences(): never
    {
        $u=Auth::requireUser();$pdo=Database::connection();
        if(Request::method()==='GET'){$q=$pdo->prepare('SELECT estado_solicitudes, resumen_correo, promociones FROM preferencias_usuario WHERE usuario_id=?');$q->execute([$u['id']]);$r=$q->fetch();Response::success($r?:['estado_solicitudes'=>1,'resumen_correo'=>0,'promociones'=>0]);}
        $d=Request::body();$map=['estado'=>'estado_solicitudes','correo'=>'resumen_correo','promos'=>'promociones'];$values=[];foreach($map as $key=>$col)if(array_key_exists($key,$d))$values[$col]=(int)(bool)$d[$key];if(!$values)Response::error('No se enviaron preferencias.',422);
        $cols=array_keys($values);$sql='INSERT INTO preferencias_usuario (usuario_id,'.implode(',',$cols).') VALUES (?'.str_repeat(',?',count($cols)).') ON DUPLICATE KEY UPDATE '.implode(',',array_map(fn($c)=>"$c=VALUES($c)",$cols));$pdo->prepare($sql)->execute([$u['id'],...array_values($values)]);Response::success($values,'Preferencias guardadas.');
    }

    public static function documents(): never
    {
        $u=Auth::requireRole(['proveedor']);$pdo=Database::connection();
        if(Request::method()==='GET'){$q=$pdo->prepare('SELECT id,tipo,nombre_original,mime_type,tamano_bytes,estado,created_at FROM documentos_proveedor WHERE proveedor_id=? ORDER BY tipo');$q->execute([$u['id']]);Response::success($q->fetchAll());}
        if(Request::method()!=='POST')Response::error('Método no permitido.',405);
        if(empty($_FILES['archivo'])||$_FILES['archivo']['error']!==UPLOAD_ERR_OK)Response::error('Selecciona un archivo válido.',422);
        $type=(string)($_POST['tipo']??'');if(!in_array($type,['cedula','licencia','soat'],true))Response::error('Tipo de documento no válido.',422);
        $file=$_FILES['archivo'];if($file['size']>5*1024*1024)Response::error('El archivo supera el límite de 5 MB.',413);
        $finfo=new finfo(FILEINFO_MIME_TYPE);$mime=$finfo->file($file['tmp_name']);$allowed=['application/pdf'=>'pdf','image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];if(!isset($allowed[$mime]))Response::error('Solo se permiten PDF, JPG, PNG o WEBP.',415);
        $dir=sys_get_temp_dir().DIRECTORY_SEPARATOR.'mudgo-private-storage'.DIRECTORY_SEPARATOR.'proveedor-docs';if(!is_dir($dir)&&!mkdir($dir,0700,true))Response::error('No se pudo preparar el almacenamiento.',500);
        $name=bin2hex(random_bytes(24)).'.'.$allowed[$mime];$target=$dir.'/'.$name;if(!move_uploaded_file($file['tmp_name'],$target))Response::error('No se pudo guardar el archivo.',500);
        $q=$pdo->prepare('SELECT ruta_archivo FROM documentos_proveedor WHERE proveedor_id=? AND tipo=?');$q->execute([$u['id'],$type]);$old=$q->fetchColumn();
        try{$sql='INSERT INTO documentos_proveedor (proveedor_id,tipo,nombre_original,ruta_archivo,mime_type,tamano_bytes,estado) VALUES (?,?,?,?,?,?,\'pendiente\') ON DUPLICATE KEY UPDATE nombre_original=VALUES(nombre_original),ruta_archivo=VALUES(ruta_archivo),mime_type=VALUES(mime_type),tamano_bytes=VALUES(tamano_bytes),estado=\'pendiente\',created_at=CURRENT_TIMESTAMP';$pdo->prepare($sql)->execute([$u['id'],$type,basename((string)$file['name']),$name,$mime,(int)$file['size']]);if($old&&is_file($dir.'/'.$old))unlink($dir.'/'.$old);}catch(Throwable $e){if(is_file($target))unlink($target);throw $e;}
        Response::success(['tipo'=>$type,'estado'=>'pendiente'],'Documento recibido para revisión.',201);
    }
}
