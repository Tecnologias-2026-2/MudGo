-- Migración aditiva MudGo: perfiles, direcciones, preferencias y documentos.
-- Ejecutar una sola vez sobre la base de datos mudgo existente.
USE mudgo;

CREATE TABLE IF NOT EXISTS direcciones_cliente (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id BIGINT UNSIGNED NOT NULL,
  alias VARCHAR(80) NOT NULL,
  direccion VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_direcciones_cliente (cliente_id),
  CONSTRAINT fk_direcciones_cliente_usuario FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS preferencias_usuario (
  usuario_id BIGINT UNSIGNED PRIMARY KEY,
  estado_solicitudes TINYINT(1) NOT NULL DEFAULT 1,
  resumen_correo TINYINT(1) NOT NULL DEFAULT 0,
  promociones TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_preferencias_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS documentos_proveedor (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  proveedor_id BIGINT UNSIGNED NOT NULL,
  tipo ENUM('cedula','licencia','soat') NOT NULL,
  nombre_original VARCHAR(255) NOT NULL,
  ruta_archivo VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  tamano_bytes INT UNSIGNED NOT NULL,
  estado ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_documento_proveedor_tipo (proveedor_id,tipo),
  CONSTRAINT fk_documentos_proveedor_usuario FOREIGN KEY (proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Crear preferencia predeterminada para las cuentas existentes.
INSERT IGNORE INTO preferencias_usuario (usuario_id) SELECT id FROM usuarios;
