<?php
declare(strict_types=1);

$method=Request::method();
$path=parse_url($_SERVER['REQUEST_URI']??'/',PHP_URL_PATH) ?: '/';
$base=rtrim(str_replace('\\','/',dirname($_SERVER['SCRIPT_NAME'] ?? '/backend/index.php')), '/');
if(str_starts_with($path,$base))$path=substr($path,strlen($base));
$path=preg_replace('#^/index\.php#','',$path) ?: $path;
$path='/'.trim($path,'/');

if($path==='/api/health' && $method==='GET'){
    try{Database::connection()->query('SELECT 1');Response::success(['api'=>'online','database'=>'connected','version'=>'1.0.0'],'MudGo API disponible.');}
    catch(Throwable $e){Response::error('API disponible, pero no fue posible conectar con MySQL.',503);}
}
if($path==='/api/auth/register'&&$method==='POST')AuthController::register();
if($path==='/api/auth/login'&&$method==='POST')AuthController::login();
if($path==='/api/auth/me'&&$method==='GET')AuthController::me();
if($path==='/api/auth/logout'&&$method==='POST')AuthController::logout();
if($path==='/api/auth/change-password'&&$method==='POST')ProfileController::changePassword();
if($path==='/api/perfil'&&in_array($method,['GET','PATCH'],true))ProfileController::profile();
if($path==='/api/cliente/direcciones'&&in_array($method,['GET','POST'],true))ProfileController::addresses();
if(preg_match('#^/api/cliente/direcciones/(\d+)$#',$path,$m)&&$method==='DELETE')ProfileController::deleteAddress((int)$m[1]);
if($path==='/api/preferencias'&&in_array($method,['GET','PATCH'],true))ProfileController::preferences();
if($path==='/api/proveedor/documentos'&&in_array($method,['GET','POST'],true))ProfileController::documents();
if($path==='/api/solicitudes'&&$method==='GET')RequestController::index();
if($path==='/api/solicitudes'&&$method==='POST')RequestController::create();
if(preg_match('#^/api/solicitudes/(\d+)$#',$path,$m)&&$method==='GET')RequestController::show((int)$m[1]);
if(preg_match('#^/api/solicitudes/(\d+)/confirmar$#',$path,$m)&&$method==='POST')RequestController::confirm((int)$m[1]);
if(preg_match('#^/api/solicitudes/(\d+)/(aceptar|rechazar)$#',$path,$m)&&$method==='POST')RequestController::decision((int)$m[1],$m[2]);
if(preg_match('#^/api/solicitudes/(\d+)/estado$#',$path,$m)&&$method==='PATCH')RequestController::updateStatus((int)$m[1]);
if($path==='/api/proveedor/perfil'&&in_array($method,['GET','PATCH'],true))ProviderController::profile();
if($path==='/api/proveedor/disponibilidad'&&$method==='PATCH')ProviderController::availability();
if($path==='/api/vehiculos'&&$method==='GET')VehicleController::index();
if($path==='/api/vehiculos'&&$method==='POST')VehicleController::create();
if(preg_match('#^/api/vehiculos/(\d+)$#',$path,$m)&&$method==='PATCH')VehicleController::update((int)$m[1]);
if(preg_match('#^/api/vehiculos/(\d+)$#',$path,$m)&&$method==='DELETE')VehicleController::delete((int)$m[1]);
if($path==='/api/pagos'&&$method==='GET')PaymentController::index();
if($path==='/api/pagos'&&$method==='POST')PaymentController::create();
if($path==='/api/calificaciones'&&$method==='GET')RatingController::index();
if($path==='/api/calificaciones'&&$method==='POST')RatingController::create();
if($path==='/api/admin/dashboard'&&$method==='GET')AdminController::dashboard();
if($path==='/api/admin/usuarios'&&$method==='GET')AdminController::users();
if(preg_match('#^/api/admin/usuarios/(\d+)/estado$#',$path,$m)&&$method==='PATCH')AdminController::setUserStatus((int)$m[1]);
Response::error('Ruta no encontrada.',404);
