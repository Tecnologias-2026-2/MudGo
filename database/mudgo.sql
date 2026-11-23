-- MudGo | Esquema relacional inicial para MySQL 8+
CREATE DATABASE IF NOT EXISTS mudgo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mudgo;

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(160) NOT NULL UNIQUE,
  telefono VARCHAR(30) NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('cliente','proveedor','admin') NOT NULL DEFAULT 'cliente',
  estado ENUM('activo','inactivo','suspendido') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clientes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT UNSIGNED NOT NULL UNIQUE,
  direccion VARCHAR(255) NULL,
  ciudad VARCHAR(100) NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS proveedores (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT UNSIGNED NOT NULL UNIQUE,
  disponible BOOLEAN NOT NULL DEFAULT TRUE,
  descripcion TEXT NULL,
  calificacion_promedio DECIMAL(3,2) NOT NULL DEFAULT 0,
  total_calificaciones INT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehiculos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  proveedor_id BIGINT UNSIGNED NOT NULL,
  modelo VARCHAR(120) NOT NULL,
  placa VARCHAR(15) NOT NULL UNIQUE,
  tipo ENUM('van','camion_pequeno','camion_mediano','camion_grande','otro') NOT NULL,
  capacidad VARCHAR(60) NOT NULL,
  disponible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_vehiculos_proveedor (proveedor_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS solicitudes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NULL UNIQUE,
  cliente_id BIGINT UNSIGNED NOT NULL,
  proveedor_id BIGINT UNSIGNED NULL,
  vehiculo_id BIGINT UNSIGNED NULL,
  origen VARCHAR(255) NOT NULL,
  destino VARCHAR(255) NOT NULL,
  fecha_servicio DATE NOT NULL,
  hora_servicio TIME NOT NULL,
  tipo_carga ENUM('pequeno','mediano','grande') NOT NULL,
  tipo_vehiculo VARCHAR(40) NOT NULL,
  ayudantes TINYINT UNSIGNED NOT NULL DEFAULT 0,
  distancia_km DECIMAL(8,2) NOT NULL DEFAULT 1,
  observaciones TEXT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  estado ENUM('cotizada','esperando_proveedor','buscando_proveedor','aceptada','pagada','en_camino','en_curso','finalizada','cancelada','sin_proveedor') NOT NULL DEFAULT 'cotizada',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
  FOREIGN KEY (proveedor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE SET NULL,
  INDEX idx_solicitudes_cliente (cliente_id, created_at),
  INDEX idx_solicitudes_proveedor_estado (proveedor_id, estado),
  INDEX idx_solicitudes_estado_fecha (estado, fecha_servicio)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rechazos_solicitud (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  solicitud_id BIGINT UNSIGNED NOT NULL,
  proveedor_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_rechazo (solicitud_id, proveedor_id),
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
  FOREIGN KEY (proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pagos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  solicitud_id BIGINT UNSIGNED NOT NULL,
  cliente_id BIGINT UNSIGNED NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  metodo ENUM('efectivo','transferencia','tarjeta','demo') NOT NULL,
  estado ENUM('pendiente','exitoso','fallido','reembolsado') NOT NULL DEFAULT 'pendiente',
  referencia VARCHAR(80) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id),
  FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
  INDEX idx_pagos_solicitud (solicitud_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS calificaciones (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  solicitud_id BIGINT UNSIGNED NOT NULL UNIQUE,
  cliente_id BIGINT UNSIGNED NOT NULL,
  proveedor_id BIGINT UNSIGNED NOT NULL,
  puntuacion TINYINT UNSIGNED NOT NULL,
  comentario VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_puntuacion CHECK (puntuacion BETWEEN 1 AND 5),
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id),
  FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
  FOREIGN KEY (proveedor_id) REFERENCES usuarios(id),
  INDEX idx_calificaciones_proveedor (proveedor_id)
) ENGINE=InnoDB;

-- Por seguridad no se inserta una cuenta administrativa con contraseña predeterminada.
-- Crea el administrador mediante el script backend/scripts/create-admin.php.
