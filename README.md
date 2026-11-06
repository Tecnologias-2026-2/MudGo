Para Completar por grupo

🌐 Nombre del Proyecto

Escribe aquí una descripción corta del proyecto.

👥 Integrantes

Nombre completo – Código
Nombre completo – Código

🎯 1. Objetivo General

Escribir un solo párrafo donde expliquen:
Qué quieren lograr con el sistema.
Qué problema buscan solucionar.

🌍 2. Contexto de Uso

¿Quién va a usar el sistema?
¿Cómo se va a utilizar el sistema?

📋 3. Requerimientos del Sistema
3.1 Requerimientos Funcionales

Escriban lo que el sistema debe hacer.

Ejemplo:
RF01: El sistema debe permitir registrar usuarios.

3.2 Requerimientos No Funcionales

Escriban cómo debe comportarse el sistema.

Ejemplo:
RNF01: La página debe ser responsive.

🧠 4. Diagramas UML

Diagrama de Casos de Uso

Explicar brevemente qué muestra el diagrama.

Diagrama de Secuencia

Explicar qué proceso representa.

🎨 5. URL del Prototipo

https://www.figma.com/design/RNyeGHyT4PpZ0BvEhAxKRD/MudGo


🗄️ 6. Diseño de Base de Datos

Agregar imagen del modelo.
Tablas principales

🧩 7. Documentación del Sistema
Estructura de Carpetas

```
/                       Páginas HTML (una por pantalla del prototipo)
/css/app.css            Estilos de la aplicación (cliente, proveedor y admin)
/css/landing.css        Estilos de la landing
/styles.css             Estilos base de landing, login y registro
/js/app.js              Núcleo: layout por rol, iconos, utilidades, datos de ejemplo y estado de la solicitud
/js/cliente.js          Lógica de las pantallas del cliente (C01–C19)
/js/proveedor.js        Lógica de las pantallas del proveedor (P01–P07)
/js/admin.js            Lógica del panel administrativo (AD01–AD04)
/script.js              Interacciones de la landing (navbar, FAQ, animaciones)
/assets                 Íconos de la PWA
/manifest.json, /sw.js  Configuración PWA (Web App Manifest y Service Worker)
```

Pantallas (código del prototipo → archivo)

| Rol | Pantalla | Archivo |
|---|---|---|
| Público | L01 Landing · A01 Login · A02 Registro | index.html · login.html · registro.html |
| Cliente | C01 Inicio | dashboard-cliente.html |
| Cliente | C02 Solicitud (3 pasos) | solicitar-mudanza.html |
| Cliente | C03 Cotización | cotizacion.html |
| Cliente | C04 Confirmación · C05 Solicitud enviada | confirmar-solicitud.html |
| Cliente | C06 Esperando · C07 Aceptada · C08 Rechazada · C09 Buscando · C10 Sin proveedor | estado-solicitud.html |
| Cliente | C11 Pago · C12 Pago exitoso · C13 Pago fallido | pago.html |
| Cliente | C14 Servicio confirmado | servicio-confirmado.html |
| Cliente | C15 Seguimiento en vivo | seguimiento.html |
| Cliente | C16 Servicio finalizado · C17 Calificación | servicio-finalizado.html · calificar.html |
| Cliente | C18 Historial · C19 Perfil | historial-cliente.html · perfil-cliente.html |
| Proveedor | P01 Inicio · P02 Solicitudes · P03 Aceptada | dashboard-proveedor.html · solicitudes-proveedor.html · solicitud-aceptada.html |
| Proveedor | P04 Servicio · P05 Vehículos · P06 Historial · P07 Perfil | servicio-proveedor.html · vehiculos-proveedor.html · historial-proveedor.html · perfil-proveedor.html |
| Admin | AD01 Dashboard · AD02 Usuarios · AD03 Proveedores · AD04 Servicios | admin-dashboard.html · admin-usuarios.html · admin-proveedores.html · admin-servicios.html |

Flujo principal: Solicitud → Cotización → Confirmación → Espera de aceptación → (Aceptada | Rechazada → Buscando otro → Sin proveedor) → Pago (exitoso | fallido) → Servicio confirmado → Seguimiento → Finalizado → Calificación. El pago solo se habilita después de que un proveedor acepta.

Nota: esta versión es solo frontend (HTML, CSS y JavaScript). Lo que en producción vendría de Firebase (usuarios, solicitudes, pagos) está simulado con datos de ejemplo y `localStorage`. En las pantallas de estado y pago hay un panel "DEMO" para simular la respuesta del proveedor y un pago rechazado. Si se abre `solicitudes-proveedor.html` en otra pestaña, el proveedor puede aceptar o rechazar la solicitud del cliente y el cliente lo ve al instante.

Para revisar una pantalla de estado específica se puede usar el parámetro `?estado=`, por ejemplo `estado-solicitud.html?estado=rechazada`, `estado-solicitud.html?estado=sin_proveedor` o `pago.html?estado=pago_fallido`.

🚀 8. Instalación y Ejecución

1. Clonar el repositorio.
2. Servir la carpeta con un servidor local (el Service Worker no funciona abriendo el archivo directamente):
   - VS Code: extensión **Live Server** → clic derecho en `index.html` → *Open with Live Server*.
   - o con Python: `python -m http.server 8000` y abrir http://localhost:8000
3. Entrar por `login.html` y elegir el rol (Cliente, Proveedor o Admin); no se valida la contraseña.
4. Para reiniciar la demo, borrar el almacenamiento del sitio (DevTools → Application → Local Storage).
