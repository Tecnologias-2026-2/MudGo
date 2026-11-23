# MudGo — Entrega de backend PHP y MySQL

## Alcance implementado

Esta entrega incorpora una API HTTP en PHP 8 con persistencia MySQL. El frontend original se conserva. El backend se organiza en configuración, núcleo HTTP, middleware de autenticación, controladores y rutas.

### Módulos

- **Autenticación y usuarios:** registro de clientes y proveedores, inicio/cierre de sesión, consulta del usuario autenticado y control de roles. Los administradores se crean mediante un script de consola, no desde el registro público.
- **Solicitudes:** creación con cotización demostrativa, consulta según rol, confirmación, aceptación/rechazo por proveedor y actualización del estado del servicio.
- **Vehículos:** alta, consulta, edición y eliminación, con propiedad asociada al proveedor.
- **Pagos:** registro de resultados demostrativos, habilitado únicamente después de la aceptación del proveedor. No procesa dinero real.
- **Calificaciones:** calificación de servicios finalizados y actualización del promedio del proveedor.
- **Administración:** indicadores, listado de usuarios y cambio de estado de cuentas.

## Arquitectura

`Navegador (HTML/CSS/JS) → API PHP (JSON) → PDO → MySQL`

Las respuestas de la API siguen el formato `success`, `message`, `data` y, para errores, `errors`. Las consultas a la base de datos utilizan sentencias preparadas. Las contraseñas se almacenan con `password_hash()` y se verifican con `password_verify()`.

## Instalación

1. Instalar PHP 8.1+ con `pdo_mysql` y `json`, MySQL 8+ y Apache con `mod_rewrite` habilitado.
2. Colocar `MudGo-main` dentro del directorio público del servidor web.
3. Crear/importar la base de datos ejecutando `database/mudgo.sql` desde MySQL Workbench o phpMyAdmin.
4. Ajustar `backend/config/config.php` con host, puerto, nombre, usuario y contraseña de MySQL.
5. Habilitar `AllowOverride All` para que Apache aplique `backend/.htaccess`.
6. Abrir `http://localhost/MudGo-main/backend/api/health`. La respuesta debe mostrar `api: online` y `database: connected`.
7. Crear un administrador desde la terminal, dentro de la carpeta del proyecto: `php backend/scripts/create-admin.php "Administrador MudGo" admin@mudgo.local "ClaveSeguraDe12Caracteres"`.

### Ejecución sin Apache (servidor integrado de PHP)

Para pruebas locales, desde la carpeta `MudGo-main`, ejecutar `php -S 127.0.0.1:8000 router.php`. El archivo `router.php` dirige las rutas `/backend/api/...` al controlador frontal de la API.

## API

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/health` | Público | Verifica API y conexión MySQL |
| POST | `/api/auth/register` | Público | Registra cliente o proveedor |
| POST | `/api/auth/login` | Público | Inicia sesión |
| GET | `/api/auth/me` | Sesión | Devuelve usuario actual |
| POST | `/api/auth/logout` | Sesión | Cierra sesión |
| GET/POST | `/api/solicitudes` | Sesión / cliente | Lista o crea solicitudes |
| GET | `/api/solicitudes/{id}` | Participante/admin | Consulta detalle |
| POST | `/api/solicitudes/{id}/confirmar` | Cliente | Envía solicitud |
| POST | `/api/solicitudes/{id}/aceptar` | Proveedor | Acepta solicitud |
| POST | `/api/solicitudes/{id}/rechazar` | Proveedor | Rechaza solicitud |
| PATCH | `/api/solicitudes/{id}/estado` | Proveedor/admin | Actualiza avance |
| GET/POST | `/api/vehiculos` | Sesión / proveedor | Lista o registra vehículos |
| PATCH/DELETE | `/api/vehiculos/{id}` | Propietario/admin | Edita o elimina vehículo |
| GET/POST | `/api/pagos` | Sesión / cliente | Consulta o registra pago de demostración |
| GET/POST | `/api/calificaciones` | Sesión / cliente | Consulta o registra calificación |
| GET | `/api/admin/dashboard` | Admin | Indicadores generales |
| GET | `/api/admin/usuarios` | Admin | Lista usuarios |
| PATCH | `/api/admin/usuarios/{id}/estado` | Admin | Activa/suspende cuenta |

## Modelo de datos

El esquema `database/mudgo.sql` crea ocho tablas: `usuarios`, `clientes`, `proveedores`, `vehiculos`, `solicitudes`, `rechazos_solicitud`, `pagos` y `calificaciones`. Las claves foráneas conectan perfiles, solicitudes, proveedores, vehículos, pagos y calificaciones.

## Pruebas realizadas en esta entrega

- Validación sintáctica de todos los archivos PHP con `php -l`: sin errores de sintaxis.
- Revisión estática de rutas, controladores, esquema SQL y restricciones principales.
- No se declara una prueba de integración contra MySQL ni una prueba integral desde el frontend: deben ejecutarse en el equipo que instala la aplicación, porque dependen del servicio MySQL y de la configuración local.

## Limitaciones conocidas y decisiones

- La cotización utiliza una fórmula académica de demostración; no representa una tarifa comercial validada.
- El pago es simulado. No hay pasarela ni cobro real.
- El seguimiento no obtiene GPS en tiempo real; el proveedor actualiza estados.
- La búsqueda automática de proveedores es básica: expone solicitudes disponibles, registra rechazos y permite detectar cuando no quedan proveedores disponibles. No implementa despacho geográfico ni notificaciones push.
- El frontend original conserva flujos de demostración basados en `localStorage`. La API queda desarrollada, pero el reemplazo integral de todas las pantallas por llamadas API requiere una integración de frontend independiente.
- Las sesiones PHP usan cookie de sesión `MUDGOSESSID`. La compañera que implemente cookies debe coordinarse con esta decisión y no crear una segunda sesión incompatible.

## Recomendaciones de seguridad antes de producción

Configurar HTTPS, restringir el origen permitido, añadir protección CSRF para operaciones autenticadas basadas en cookies, limitar intentos de acceso, validar los datos en servidor, proteger copias de seguridad y utilizar credenciales MySQL de mínimo privilegio. Esta entrega es un backend académico para entorno local, no una plataforma lista para producción pública.
