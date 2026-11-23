# Auditoría de datos de demostración y persistencia MudGo

## Cambios aplicados
- Se retiraron los arreglos de clientes, proveedores, vehículos, servicios e historiales ficticios del núcleo JavaScript.
- Se eliminó la solicitud automática de respaldo MG-043 y el cálculo de distancia determinista basado en direcciones.
- Se retiraron los controles que permitían simular desde el navegador la aceptación, el rechazo y la búsqueda de proveedores. Las decisiones se realizan mediante la API.
- Se retiraron los avatares y el conteo ficticio de proveedores notificados.
- Se conectó la calificación al ID real de la solicitud finalizada y al endpoint de calificaciones.
- Se eliminó la escritura local ficticia de calificaciones e historial.
- Se retiraron los datos estáticos de identidad, ingresos, antigüedad, calificaciones y documentos del perfil del proveedor. Los campos disponibles se rellenan desde la API; documentos no cargados se muestran como no registrados.
- Se corrigió la redirección posterior al envío de una solicitud para conservar su ID de base de datos.
- Se evitó que las pantallas de cotización y confirmación inventen una solicitud si se abren sin un borrador válido.
- Los paneles administrativos ya no recurren a listas locales de demostración. Las estadísticas sin series reales no muestran porcentajes ficticios.
- El perfil del cliente ya no presenta direcciones de muestra. Las direcciones y preferencias locales se identifican como datos del navegador, no como datos sincronizados.
- Se conservó el flujo de pago demostrativo: registra un resultado en MySQL y no procesa dinero real.
- El mapa de seguimiento sigue siendo ilustrativo, sin GPS ni afirmación de ubicación real.

## Validaciones ejecutadas
- `node --check` sobre los archivos JavaScript del proyecto.
- `php -l` sobre los archivos PHP del backend y router.
- Búsqueda de identidades, placas, IDs y montos de muestra conocidos en los archivos ejecutables.

## Limitaciones que siguen pendientes
- El perfil del cliente no tiene todavía un endpoint de actualización de datos personales. El formulario avisa que no persiste cambios.
- Las direcciones, preferencias de notificación y algunos datos de perfil del cliente permanecen en el almacenamiento del navegador, no en MySQL.
- Los documentos del proveedor no tienen carga real al servidor; se muestran como no registrados.
- El panel administrativo tiene endpoints básicos de conteo y usuarios, pero la gestión completa de proveedores, series históricas y cancelaciones no está terminada.
- La disponibilidad de proveedores depende del registro y estado en base de datos; no hay geolocalización ni asignación automática por cercanía.
- El pago es demostrativo. No hay integración bancaria.

## Integridad de datos
No se ejecutaron sentencias SQL de borrado, limpieza, deduplicación ni modificación de registros existentes. Las solicitudes repetidas se conservan. La aplicación debe identificarlas por su ID, no por coincidencia de dirección, fecha o cliente.
