<?php
declare(strict_types=1);
require_once __DIR__.'/../config/database.php';
if(PHP_SAPI!=='cli'){http_response_code(403);exit("Solo ejecución CLI.\n");}
if($argc<4){fwrite(STDERR,"Uso: php create-admin.php \"Nombre\" correo@dominio.com \"ContraseñaSegura\"\n");exit(1);}
[$script,$name,$email,$password]=$argv;
if(!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($password)<12){fwrite(STDERR,"Correo inválido o contraseña menor a 12 caracteres.\n");exit(1);}
$pdo=Database::connection();$st=$pdo->prepare("INSERT INTO usuarios(nombre,correo,password_hash,rol) VALUES(?,?,?,'admin')");
$st->execute([$name,strtolower($email),password_hash($password,PASSWORD_DEFAULT)]);
echo "Administrador creado correctamente.\n";
