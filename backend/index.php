<?php
declare(strict_types=1);

$config=require __DIR__.'/config/config.php';
$origin=$config['app']['allowed_origin'];
$requestOrigin=$_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '*' && $requestOrigin === $origin) { header('Access-Control-Allow-Origin: '.$origin); header('Vary: Origin'); }
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('X-Content-Type-Options: nosniff');
if(($_SERVER['REQUEST_METHOD']??'GET')==='OPTIONS'){http_response_code(204);exit;}
ini_set('session.use_strict_mode','1');
session_name($config['app']['session_name']);
session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off','httponly'=>true,'samesite'=>'Lax']);
session_start();
require_once __DIR__.'/config/database.php';
require_once __DIR__.'/core/Response.php';
require_once __DIR__.'/core/Request.php';
require_once __DIR__.'/middleware/Auth.php';
foreach(glob(__DIR__.'/controllers/*.php') as $file) require_once $file;
try{require __DIR__.'/routes/api.php';}
catch(PDOException $e){error_log($e->getMessage());Response::error('Error de base de datos. Verifica la configuración y las tablas.',500);}
catch(Throwable $e){error_log($e->getMessage());Response::error('Error interno del servidor.',500);}
