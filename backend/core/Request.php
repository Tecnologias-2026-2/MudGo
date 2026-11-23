<?php
declare(strict_types=1);

final class Request
{
    public static function body(): array
    {
        $raw = file_get_contents('php://input');
        if (!$raw) return $_POST;
        $data = json_decode($raw, true);
        if (!is_array($data)) Response::error('El cuerpo debe contener JSON válido.', 400);
        return $data;
    }
    public static function method(): string { return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'); }
    public static function input(string $key, mixed $default = null): mixed
    {
        $body = self::body();
        return $body[$key] ?? $_GET[$key] ?? $default;
    }
    public static function requireFields(array $data, array $fields): void
    {
        $missing = [];
        foreach ($fields as $field) if (!isset($data[$field]) || trim((string)$data[$field]) === '') $missing[] = $field;
        if ($missing) Response::error('Faltan campos obligatorios.', 422, ['campos' => $missing]);
    }
}
