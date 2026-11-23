# Estado de implementación del backend

## Implementado en esta entrega
- Conexión MySQL mediante PDO.
- Esquema SQL con usuarios, perfiles de cliente/proveedor, vehículos, solicitudes, rechazos, pagos y calificaciones.
- Registro e inicio/cierre de sesión con hash de contraseña.
- Autorización por rol y propiedad de los recursos.
- Creación, consulta, confirmación y decisión de solicitudes.
- Gestión básica de vehículos.
- Registro de pagos de demostración con restricción de pago posterior a la aceptación.
- Registro de calificaciones únicamente para servicios finalizados.
- Endpoints administrativos básicos.
- Cliente JavaScript reutilizable para consumir la API.

## Pendiente para declarar la aplicación integrada
1. Conectar formularios de registro/login a `MudGoAPI`.
2. Sustituir la persistencia `localStorage` de solicitudes por endpoints.
3. Conectar paneles de proveedor y administrador.
4. Implementar asignación automática evitando proveedores que ya rechazaron.
5. Integrar vehículo elegido y validación de disponibilidad.
6. Coordinar el manejo de cookies/sesiones con el módulo de la compañera.
7. Ejecutar pruebas integrales en XAMPP con la base de datos instalada.

## Restricciones conocidas
- La cotización utiliza tarifas demostrativas; deben acordarse con el equipo.
- No hay pasarela de pago real.
- No existe geolocalización GPS en tiempo real; el seguimiento requiere definir si será actualización manual de estados o integración con mapas.
- El alta pública no permite crear usuarios administradores.
