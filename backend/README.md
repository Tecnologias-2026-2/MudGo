# Backend MudGo (PHP + MySQL)

Primera implementación del backend sobre el frontend original de MudGo.

## Requisitos
- PHP 8.1 o superior con extensiones `pdo_mysql` y `json`.
- MySQL 8.0 o MariaDB compatible.
- Apache (XAMPP recomendado para el entorno académico).

## Instalación local
1. Copia la carpeta `MudGo-main` dentro de `C:/xampp/htdocs/`.
2. Inicia Apache y MySQL desde XAMPP.
3. Abre `http://localhost/phpmyadmin` e importa `database/mudgo.sql`.
4. Revisa `backend/config/config.php` y ajusta host, puerto, usuario y contraseña.
5. Abre `http://localhost/MudGo-main/backend/api/health`.

El archivo `backend/.htaccess` utiliza `mod_rewrite`; verifica que Apache tenga habilitado `AllowOverride All` para el directorio del proyecto.

## API disponible
Todas las respuestas son JSON con el formato `{ success, message, data }`.

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| GET | `/api/health` | Público | Estado API y MySQL |
| POST | `/api/auth/register` | Público | Registro cliente/proveedor |
| POST | `/api/auth/login` | Público | Inicio de sesión |
| GET | `/api/auth/me` | Autenticado | Usuario actual |
| POST | `/api/auth/logout` | Autenticado | Cierre de sesión |
| GET/POST | `/api/solicitudes` | Autenticado | Listar/crear solicitud |
| GET | `/api/solicitudes/{id}` | Propietario/admin | Consultar detalle |
| POST | `/api/solicitudes/{id}/confirmar` | Cliente | Enviar cotización a proveedores |
| POST | `/api/solicitudes/{id}/aceptar` | Proveedor | Aceptar solicitud |
| POST | `/api/solicitudes/{id}/rechazar` | Proveedor | Rechazar solicitud |
| PATCH | `/api/solicitudes/{id}/estado` | Proveedor/admin | Actualizar avance |
| GET/POST | `/api/vehiculos` | Autenticado/proveedor | Listar/registrar vehículos |
| PATCH/DELETE | `/api/vehiculos/{id}` | Propietario/admin | Editar/eliminar vehículo |
| GET/POST | `/api/pagos` | Autenticado/cliente | Consultar/registrar pago demo |
| GET/POST | `/api/calificaciones` | Autenticado/cliente | Consultar/calificar servicio |
| GET | `/api/admin/dashboard` | Admin | Resumen de indicadores |
| GET | `/api/admin/usuarios` | Admin | Listar usuarios |
| PATCH | `/api/admin/usuarios/{id}/estado` | Admin | Cambiar estado de usuario |

## Ejemplos de solicitudes
Registro:
```json
{
  "nombre": "Ana García",
  "correo": "ana@example.com",
  "telefono": "3001234567",
  "password": "ClaveSegura123",
  "rol": "cliente"
}
```
Crear solicitud (requiere sesión de cliente):
```json
{
  "origen": "Bogotá, Calle 72 #10-45",
  "destino": "Bogotá, Av. El Dorado #68C-61",
  "fecha_servicio": "2026-12-10",
  "hora_servicio": "09:00",
  "tipo_carga": "mediano",
  "tipo_vehiculo": "camion_mediano",
  "ayudantes": 2,
  "distancia_km": 12.5
}
```

## Seguridad y alcance de esta versión
- Consultas preparadas con PDO.
- Contraseñas almacenadas mediante `password_hash()` y verificadas con `password_verify()`.
- Control de acceso por rol y propiedad del recurso.
- Sesiones PHP con regeneración de ID al autenticar.
- El registro público no permite crear administradores.
- Los pagos son simulados; no se conecta una pasarela real.
- La cotización usa tarifas demostrativas inspiradas en los valores del frontend y requiere validación del equipo.
- La asignación automática a proveedores, notificaciones y seguimiento geográfico en tiempo real todavía requieren integración adicional.
- La integración de cookies debe coordinarse con la compañera responsable: esta versión utiliza la sesión estándar de PHP. No se debe implementar un segundo mecanismo de sesión en paralelo.

## Importante
El backend ya tiene endpoints funcionales, pero el frontend original sigue utilizando `localStorage`. La siguiente tarea de integración es reemplazar progresivamente esas lecturas y escrituras por llamadas `fetch()` a esta API. No se debe afirmar que el sistema completo está integrado hasta probar ese flujo desde las pantallas.

## Crear cuenta administradora
Desde una terminal ubicada en la carpeta del proyecto ejecuta:
```bash
php backend/scripts/create-admin.php "Administrador MudGo" admin@mudgo.local "UnaClaveSeguraDe12Caracteres"
```
No se incluye una contraseña predeterminada en el SQL.
