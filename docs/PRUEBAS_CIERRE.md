# MudGo | Cierre técnico de perfiles

## Cambios implementados

- Perfil unificado de cliente y proveedor consultado desde MySQL.
- Edición de nombre, correo y teléfono para ambos roles.
- Edición de ciudad del cliente.
- Cambio de contraseña con verificación de contraseña actual, confirmación, longitud mínima y hash `PASSWORD_DEFAULT`.
- Direcciones de cliente persistidas en MySQL (crear, listar y eliminar).
- Preferencias de notificación persistidas por usuario.
- Carga de documentos del proveedor (cédula, licencia y SOAT), con límite de 5 MB y validación MIME de PDF/JPG/PNG/WEBP. El estado inicial es `pendiente`; no se simula aprobación administrativa.
- Retirada la tarjeta bancaria ficticia y el formulario de datos bancarios. Los pagos siguen siendo simulados y no se almacenan datos financieros reales.
- Dashboard cliente: el resumen de solicitud pendiente/activa se basa en la solicitud más reciente, evitando rescatar solicitudes anteriores que quedaron abiertas.
- Cierre de sesión desde ambos perfiles mantiene la invalidación de sesión en servidor.

## Migración obligatoria

Ejecutar `database/migracion_perfiles.sql` una sola vez sobre la base de datos `mudgo` existente. Es una migración aditiva y no elimina registros previos.

## Validaciones ejecutadas en el entorno de preparación

- `php -l` sobre todos los archivos PHP: correcto.
- `node --check` sobre los archivos JavaScript: correcto.
- Comprobación de ausencia de dependencia `mbstring`: correcta.
- Verificación de rutas de API añadidas y tipos de documento del formulario: correcta.
- Verificación de paquete: no incluye `backend/config/config.php`, `.git`, scripts de diagnóstico ni archivos de respaldo.

## Pendiente de validar en el equipo local

El entorno de preparación no dispone del controlador PDO MySQL (`pdo_mysql`) ni acceso a la base de datos local del usuario. Por ello no se puede certificar desde aquí la ejecución de consultas reales ni la carga HTTP de documentos. Tras ejecutar la migración local, probar:

1. Cliente: editar perfil, cerrar sesión e iniciar sesión, comprobar persistencia.
2. Cliente: crear dos direcciones, recargar, eliminar una y comprobar persistencia.
3. Cliente: cambiar preferencias, recargar y comprobar que se mantienen.
4. Cliente y proveedor: cambiar contraseña con contraseña actual incorrecta (debe rechazar), luego correcta (debe aceptar); verificar login con la nueva.
5. Proveedor: subir un PDF/JPG menor de 5 MB para cada tipo documental; comprobar que aparece `En revisión` después de recargar.
6. Proveedor: subir un archivo mayor de 5 MB o un tipo no permitido; debe rechazarse.
7. Dashboard cliente: comprobar que una solicitud antigua abierta no suplanta el estado de la solicitud más reciente.
8. Repetir una solicitud cliente-proveedor hasta finalizar y revisar historial en ambos roles.

## Alcance deliberado

- Pago: simulación académica, sin pasarela ni cobros reales.
- GPS: visualización simulada, sin geolocalización real.
- Métodos de pago y datos bancarios: no se guardan números reales.
- Documentos: se reciben y quedan pendientes de revisión; no existe un módulo de aprobación administrativa en esta entrega.
- Notificaciones: se guardan preferencias; no se envían correos ni notificaciones push automáticamente.
