<?php
declare(strict_types=1);

final class AuthController
{
    public static function register(): never
    {
        $data = Request::body();
        Request::requireFields($data, ['nombre', 'correo', 'password', 'rol']);
        $name = trim((string)$data['nombre']); $email = strtolower(trim((string)$data['correo']));
        $role = (string)$data['rol'];
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) Response::error('El correo electrónico no es válido.', 422);
        if (strlen((string)$data['password']) < 8) Response::error('La contraseña debe tener al menos 8 caracteres.', 422);
        if (!in_array($role, ['cliente', 'proveedor'], true)) Response::error('El rol solicitado no está permitido para el registro público.', 422);
        $pdo = Database::connection();
        $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE correo = ?'); $stmt->execute([$email]);
        if ($stmt->fetch()) Response::error('Ya existe una cuenta con ese correo.', 409);
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$name, $email, $data['telefono'] ?? null, password_hash((string)$data['password'], PASSWORD_DEFAULT), $role]);
            $id = (int)$pdo->lastInsertId();
            if ($role === 'proveedor') {
                $p = $pdo->prepare('INSERT INTO proveedores (usuario_id, disponible) VALUES (?, 1)'); $p->execute([$id]);
            } else {
                $c = $pdo->prepare('INSERT INTO clientes (usuario_id) VALUES (?)'); $c->execute([$id]);
            }
            $pdo->commit();
            session_regenerate_id(true); $_SESSION['user_id'] = $id;
            Response::success(Auth::user(), 'Usuario registrado correctamente.', 201);
        } catch (Throwable $e) { $pdo->rollBack(); throw $e; }
    }
    public static function login(): never
    {
        $data = Request::body(); Request::requireFields($data, ['correo', 'password']);
        $stmt = Database::connection()->prepare('SELECT id, password_hash, estado FROM usuarios WHERE correo = ?');
        $stmt->execute([strtolower(trim((string)$data['correo']))]); $user = $stmt->fetch();
        if (!$user || !password_verify((string)$data['password'], $user['password_hash'])) Response::error('Correo o contraseña incorrectos.', 401);
        if ($user['estado'] !== 'activo') Response::error('La cuenta está inactiva o suspendida.', 403);
        session_regenerate_id(true); $_SESSION['user_id'] = (int)$user['id'];
        Response::success(Auth::user(), 'Inicio de sesión exitoso.');
    }
    public static function me(): never { Response::success(Auth::requireUser()); }
    public static function logout(): never
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) { $p = session_get_cookie_params(); setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']); }
        session_destroy(); Response::success(null, 'Sesión cerrada correctamente.');
    }
}
