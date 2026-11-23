<?php
// Router para el servidor integrado de PHP (uso local).
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$file = __DIR__ . $path;
if ($path !== '/' && is_file($file) && !str_starts_with(realpath($file), realpath(__DIR__ . '/backend'))) {
    return false;
}
if (str_starts_with($path, '/backend/api')) {
    $_SERVER['SCRIPT_NAME'] = '/backend/index.php';
    require __DIR__ . '/backend/index.php';
    return true;
}
return false;
