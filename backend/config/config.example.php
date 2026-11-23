<?php
declare(strict_types=1);

// Copia este archivo como config.php y configura tus credenciales locales.
return [
    'db' => [
        'host' => '127.0.0.1',
        'port' => '3306',
        'name' => 'mudgo',
        'user' => 'root',
        'password' => '',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        'environment' => 'development',
        'session_name' => 'MUDGOSESSID',
        'allowed_origin' => '*',
    ],
];
