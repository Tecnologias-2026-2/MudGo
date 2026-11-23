<?php
declare(strict_types=1);

final class Auth
{
    public static function user(): ?array
    {
        if (empty($_SESSION['user_id'])) return null;
        $stmt = Database::connection()->prepare('SELECT id, nombre, correo, telefono, rol, estado, created_at FROM usuarios WHERE id = ? LIMIT 1');
        $stmt->execute([$_SESSION['user_id']]);
        return $stmt->fetch() ?: null;
    }
    public static function requireUser(): array
    {
        $user = self::user();
        if (!$user) Response::error('Debes iniciar sesión para realizar esta operación.', 401);
        if ($user['estado'] !== 'activo') Response::error('La cuenta no se encuentra activa.', 403);
        return $user;
    }
    public static function requireRole(array $roles): array
    {
        $user = self::requireUser();
        if (!in_array($user['rol'], $roles, true)) Response::error('No tienes permisos para realizar esta operación.', 403);
        return $user;
    }
}
