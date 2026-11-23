### MudGo
Plataforma web para la gestión de servicios de mudanza.

MudGo conecta a personas que necesitan realizar una mudanza con proveedores de transporte. La plataforma contempla perfiles diferenciados para clientes, proveedores y administradores, y permite gestionar solicitudes, estados del servicio y la información asociada.
Integrantes
Completar por el grupo:
- Alejandra Chambueta – Código
- Mauricio Berrio – Código
- Sebastian Quevedo – 1202830

### 🎯 1. Objetivo General

Desarrollar una plataforma web que facilite la solicitud y gestión de servicios de mudanza mediante la conexión entre clientes y proveedores de transporte. El sistema busca centralizar el registro de usuarios, la creación y atención de solicitudes, la consulta de estados y la administración de la información relacionada con cada servicio, ofreciendo funcionalidades diferenciadas según el rol de cada usuario.

### 🌍 2. Contexto de Uso

MudGo está dirigido a tres tipos de usuarios:
- Cliente: registra solicitudes de mudanza, consulta su estado, gestiona sus datos personales y consulta la información de sus servicios.
- Proveedor: consulta solicitudes disponibles, acepta o rechaza servicios y administra su perfil y vehículos.
- Administrador: consulta indicadores generales y gestiona el estado de las cuentas de usuario.
El sistema se utiliza desde un navegador web. El acceso a las funcionalidades depende del rol y de la sesión iniciada.

### 📋 3. Requerimientos del Sistema

3.1 Requerimientos funcionales
- RF01: El sistema debe permitir registrar clientes y proveedores.
- RF02: El sistema debe permitir iniciar y cerrar sesión.
- RF03: El sistema debe identificar el rol del usuario autenticado.
- RF04: El cliente debe poder crear y consultar solicitudes de mudanza.
- RF05: El sistema debe permitir confirmar una solicitud para enviarla a los proveedores.
- RF06: El proveedor debe poder aceptar o rechazar solicitudes disponibles.
- RF07: El sistema debe permitir consultar y actualizar el estado de un servicio según los permisos del usuario.
- RF08: El proveedor debe poder registrar, consultar, editar y eliminar sus vehículos.
- RF09: El cliente debe poder consultar y actualizar la información de su perfil.
- RF10: El usuario debe poder cambiar su contraseña mediante la validación de su contraseña actual.
- RF11: El cliente debe poder registrar, consultar y eliminar direcciones.
- RF12: El usuario debe poder consultar y actualizar sus preferencias de notificación.
- RF13: El sistema debe permitir registrar y consultar pagos de demostración asociados a solicitudes aceptadas.
- RF14: El cliente debe poder calificar un servicio finalizado.
- RF15: El administrador debe poder consultar indicadores y usuarios, y cambiar el estado de una cuenta.
3.2 Requerimientos no funcionales
- RNF01: La aplicación debe ofrecer una interfaz comprensible y organizada por roles.
- RNF02: La interfaz debe poder utilizarse desde navegadores web modernos.
- RNF03: La información persistente debe almacenarse en una base de datos relacional MySQL.
- RNF04: Las contraseñas deben almacenarse mediante funciones de hashing y no como texto plano.
- RNF05: Las consultas a la base de datos deben utilizar sentencias preparadas mediante PDO.
- RNF06: El backend debe validar los datos recibidos y controlar el acceso según la sesión, el rol y la propiedad de los recursos.
- RNF07: La comunicación entre la interfaz y el backend debe utilizar respuestas estructuradas en formato JSON.

### 🧠 4. Diagramas UML

### Diagrama de Casos de Uso

Representa las funcionalidades disponibles para los actores
Cliente, Proveedor y Administrador dentro del sistema MudGo.

![Diagrama de casos de uso](docs/diagramas/casos-de-uso.png)

### Diagrama de Secuencia

Representa el proceso de creación y confirmación de una
solicitud, su registro en el backend, la decisión del proveedor
y el flujo de pago de demostración cuando el servicio es aceptado.

![Diagrama de secuencia](docs/diagramas/secuencia.png)

### 🎨 5. URL del Prototipo

https://www.figma.com/design/RNyeGHyT4PpZ0BvEhAxKRD/MudGo


### 🗄️ 6. Diseño de Base de Datos

El backend utiliza MySQL. El esquema inicial se encuentra en database/mudgo.sql y la migración adicional de perfiles en database/migracion_perfiles.sql.

| Tabla | Propósito |
|---|---|
| `usuarios` | Credenciales, datos personales, rol y estado de las cuentas. |
| `clientes` | Información complementaria del perfil de cliente. |
| `proveedores` | Información complementaria y disponibilidad del proveedor. |
| `vehiculos` | Vehículos registrados por proveedores. |
| `solicitudes` | Datos de mudanza, cotización y estado de cada solicitud. |
| `rechazos_solicitud` | Registro de proveedores que rechazaron una solicitud. |
| `pagos` | Resultados de los pagos de demostración. |
| `calificaciones` | Calificaciones asociadas a servicios finalizados. |
| `direcciones_cliente` | Direcciones guardadas por los clientes. |
| `preferencias_usuario` | Preferencias de notificación de cada usuario. |
| `documentos_proveedor` | Metadatos y estado de recepción de documentos del proveedor. |

Modelo entidad-relación: insertar en este apartado la imagen del modelo actualizado del grupo. La descripción de relaciones también está disponible en docs/MODELO_DATOS.md.

### 🧩 7. Documentación del Sistema

Tecnologías
- Frontend: HTML, CSS y JavaScript.
- Backend: PHP 8.1 o superior.
- Acceso a datos: PDO con la extensión pdo_mysql.
- Base de datos: MySQL 8.0 o MariaDB compatible.
- Comunicación: API HTTP con respuestas JSON y sesiones PHP.
- Diseño: Figma.
- Control de versiones: Git y GitHub.

Estructura de Carpetas
```
MudGo-main/
├── index.html                  # Landing page
├── login.html                  # Inicio de sesión
├── registro.html               # Registro
├── dashboard-cliente.html      # Panel del cliente
├── dashboard-proveedor.html    # Panel del proveedor
├── admin-dashboard.html        # Panel administrativo
├── css/
│   ├── app.css                 # Estilos de la aplicación
│   └── landing.css             # Estilos de la landing
├── js/
│   ├── api.js                  # Cliente para consumir la API
│   ├── app.js                  # Funciones compartidas
│   ├── cliente.js              # Interacciones del cliente
│   ├── proveedor.js            # Interacciones del proveedor
│   └── admin.js                # Interacciones administrativas
├── backend/
│   ├── config/
│   │   ├── config.example.php  # Plantilla de configuración local
│   │   └── database.php        # Conexión PDO
│   ├── controllers/            # Controladores de la API
│   ├── core/                   # Clases HTTP de solicitud y respuesta
│   ├── middleware/             # Autenticación y autorización
│   ├── routes/                 # Definición de rutas
│   ├── scripts/                # Scripts administrativos
│   └── index.php               # Punto de entrada de la API
├── database/
│   ├── mudgo.sql               # Esquema inicial
│   ├── migracion_perfiles.sql  # Tablas adicionales de perfiles
│   └── datos_prueba.sql        # Datos de prueba
├── docs/                       # Documentación técnica y pruebas
├── assets/                     # Recursos gráficos e iconos
├── router.php                  # Enrutador para el servidor PHP integrado
├── manifest.json               # Configuración de la PWA
└── sw.js                       # Service Worker
```

Pantallas (código del prototipo → archivo)
| Rol | Pantalla | Archivo |
|---|---|---|
| Público | Landing, login y registro | `index.html`, `login.html`, `registro.html` |
| Cliente | Inicio | `dashboard-cliente.html` |
| Cliente | Solicitud de mudanza | `solicitar-mudanza.html` |
| Cliente | Cotización y confirmación | `cotizacion.html`, `confirmar-solicitud.html` |
| Cliente | Estado de solicitud | `estado-solicitud.html` |
| Cliente | Pago | `pago.html` |
| Cliente | Servicio confirmado y seguimiento | `servicio-confirmado.html`, `seguimiento.html` |
| Cliente | Finalización y calificación | `servicio-finalizado.html`, `calificar.html` |
| Cliente | Historial y perfil | `historial-cliente.html`, `perfil-cliente.html` |
| Proveedor | Inicio y solicitudes | `dashboard-proveedor.html`, `solicitudes-proveedor.html` |
| Proveedor | Solicitud aceptada y servicio | `solicitud-aceptada.html`, `servicio-proveedor.html` |
| Proveedor | Vehículos, historial y perfil | `vehiculos-proveedor.html`, `historial-proveedor.html`, `perfil-proveedor.html` |
| Administrador | Dashboard, usuarios, proveedores y servicios | `admin-dashboard.html`, `admin-usuarios.html`, `admin-proveedores.html`, `admin-servicios.html` |

API disponible
Las rutas se sirven bajo el prefijo /backend. Las respuestas utilizan JSON con los campos success, message y data (los errores pueden incluir errors).
| Método | Ruta | Función |
|---|---|---|
| GET | `/backend/api/health` | Comprueba la API y la conexión MySQL. |
| POST | `/backend/api/auth/register` | Registra cliente o proveedor. |
| POST | `/backend/api/auth/login` | Inicia sesión. |
| GET | `/backend/api/auth/me` | Consulta el usuario autenticado. |
| POST | `/backend/api/auth/logout` | Cierra la sesión. |
| POST | `/backend/api/auth/change-password` | Cambia la contraseña. |
| GET, PATCH | `/backend/api/perfil` | Consulta o actualiza el perfil. |
| GET, POST | `/backend/api/cliente/direcciones` | Consulta o registra direcciones. |
| DELETE | `/backend/api/cliente/direcciones/{id}` | Elimina una dirección. |
| GET, PATCH | `/backend/api/preferencias` | Consulta o actualiza preferencias. |
| GET, POST | `/backend/api/proveedor/documentos` | Consulta o recibe documentos del proveedor en el backend. La disponibilidad desde la interfaz debe comprobarse en la versión desplegada. |
| GET, POST | `/backend/api/solicitudes` | Consulta o crea solicitudes. |
| GET | `/backend/api/solicitudes/{id}` | Consulta el detalle de una solicitud. |
| POST | `/backend/api/solicitudes/{id}/confirmar` | Confirma y envía una solicitud. |
| POST | `/backend/api/solicitudes/{id}/aceptar` | Acepta una solicitud como proveedor. |
| POST | `/backend/api/solicitudes/{id}/rechazar` | Rechaza una solicitud como proveedor. |
| PATCH | `/backend/api/solicitudes/{id}/estado` | Actualiza el estado del servicio. |
| GET, PATCH | `/backend/api/proveedor/perfil` | Consulta o actualiza el perfil del proveedor. |
| PATCH | `/backend/api/proveedor/disponibilidad` | Actualiza la disponibilidad del proveedor. |
| GET, POST | `/backend/api/vehiculos` | Consulta o registra vehículos. |
| PATCH, DELETE | `/backend/api/vehiculos/{id}` | Edita o elimina un vehículo. |
| GET, POST | `/backend/api/pagos` | Consulta o registra pagos de demostración. |
| GET, POST | `/backend/api/calificaciones` | Consulta o registra calificaciones. |
| GET | `/backend/api/admin/dashboard` | Consulta indicadores administrativos. |
| GET | `/backend/api/admin/usuarios` | Lista usuarios. |
| PATCH | `/backend/api/admin/usuarios/{id}/estado` | Cambia el estado de una cuenta. |

Flujo principal
Solicitud → Cotización → Confirmación → Espera de aceptación → Aceptación o rechazo → Pago de demostración → Servicio confirmado → Seguimiento → Finalización → Calificación.

El pago de demostración solo se habilita después de que un proveedor acepta la solicitud. La cotización utiliza valores de cálculo demostrativos y no una tarifa comercial validada.

Estado y limitaciones de esta entrega
La integración PHP–MySQL se encuentra implementada parcialmente y fue probada localmente en el entorno de desarrollo del equipo. En las pruebas realizadas se verificaron la conexión con MySQL, el cambio de contraseña (incluida la validación de la contraseña actual), la edición del perfil, el almacenamiento de direcciones y la persistencia de preferencias de notificación.

El backend también contiene módulos para autenticación, solicitudes, vehículos, pagos demostrativos, calificaciones y administración. Estos módulos deben probarse de forma integral en el entorno de instalación antes de considerarlos completamente validados.

Limitaciones conocidas:
- La carga documental del proveedor no quedó verificada desde la interfaz en la versión probada; por tanto, se considera pendiente de conexión o validación para esta entrega.
- Los pagos son simulados. No se conecta una pasarela bancaria ni se procesa dinero real.
- El seguimiento es ilustrativo y no obtiene ubicación GPS en tiempo real.
- Las preferencias se almacenan, pero no implican el envío automático de correos o notificaciones push.

## 🚀 8. Instalación y Ejecución

Requisitos

Antes de instalar el proyecto, verificar que el equipo cuente con los siguientes componentes:

- PHP 8.1 o superior.
- Extensiones PHP `pdo_mysql` y `json` habilitadas.
- MySQL 8.0 o MariaDB compatible.
- Git para clonar el repositorio.
- Navegador web moderno.

**Nota:** No es obligatorio utilizar XAMPP. El proyecto puede ejecutarse con el servidor integrado de PHP y una instalación local de MySQL.

Clonar el repositorio

Clonar el repositorio del grupo:

```bash
git clone URL_DEL_REPOSITORIO
```

Ingresar a la carpeta del proyecto:

```bash
cd MudGo-main
```

Reemplazar `URL_DEL_REPOSITORIO` por la dirección real del repositorio del grupo.

Si se trabaja en una rama de desarrollo, cambiar a ella después de clonar:

```bash
git switch backend-integracion
```

Crear la base de datos

Crear una base de datos llamada `mudgo` en MySQL e importar el esquema inicial del proyecto.

Primero, crear la base de datos:

```bash
mysql -u USUARIO -p -e "CREATE DATABASE mudgo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Después, importar el esquema inicial:

```bash
mysql -u USUARIO -p mudgo < database/mudgo.sql
```

Reemplazar `USUARIO` por el usuario correspondiente de MySQL.

**Importante:** Si ya existe una base de datos `mudgo` con información, no volver a importar el esquema inicial sin revisar previamente su estado. Esto podría afectar los datos existentes.

Configurar la conexión a MySQL

Copiar el archivo de configuración de ejemplo:

```bash
cp backend/config/config.example.php backend/config/config.php
```

En Windows PowerShell, utilizar:

```powershell
Copy-Item backend/config/config.example.php backend/config/config.php
```

Abrir `backend/config/config.php` y completar las credenciales locales de MySQL:

```php
<?php
declare(strict_types=1);

return [
    'db' => [
        'host' => '127.0.0.1',
        'port' => '3306',
        'name' => 'mudgo',
        'user' => 'USUARIO_MYSQL',
        'password' => 'CONTRASEÑA_MYSQL',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        'environment' => 'development',
        'session_name' => 'MUDGOSESSID',
        'allowed_origin' => '*',
    ],
];
```

**Importante:** El archivo `backend/config/config.php` contiene las credenciales locales y no debe subirse a GitHub. Cada integrante debe crear su propia copia a partir del archivo de ejemplo y configurar sus credenciales.

Ejecutar la migración de perfiles

Después de importar el esquema inicial, ejecutar también la migración:

```text
database/migracion_perfiles.sql
```

Este script crea tablas adicionales relacionadas con la gestión de perfiles y complementa la estructura inicial de la base de datos.

Si se instala una base de datos nueva, ejecutar la migración después de importar el esquema inicial.

Si se actualiza una instalación existente:

1. Realizar una copia de seguridad de la base de datos.
2. Verificar si la migración ya fue ejecutada.
3. Ejecutar el script únicamente si todavía no se ha aplicado.

**Importante:** La migración no reemplaza el esquema inicial y debe ejecutarse una sola vez por instalación.

Iniciar el servidor

Desde la carpeta raíz del proyecto, ejecutar:

```bash
php -S localhost:8000 router.php
```

Mantener abierta la terminal mientras se utiliza la aplicación.

Abrir la siguiente dirección en el navegador:

[http://localhost:8000](http://localhost:8000)

Verificar la conexión con el backend

Para comprobar que el backend está disponible y conectado correctamente a MySQL, acceder al siguiente endpoint:

[http://localhost:8000/backend/api/health](http://localhost:8000/backend/api/health)

Cuando ambos servicios funcionan correctamente, la respuesta debe indicar:

```json
{
    "api": "online",
    "database": "connected"
}
```

Crear un administrador

El registro público no permite crear cuentas con rol de administrador.

Para crear una cuenta administrativa, ejecutar desde la raíz del proyecto:

```bash
php backend/scripts/create-admin.php "Administrador MudGo" admin@mudgo.local "UnaClaveSeguraDe12Caracteres"
```

Reemplazar los datos de ejemplo por el nombre, correo y contraseña que se utilizarán localmente.

**Importante:** Utilizar una contraseña segura. No compartirla ni incluirla en el repositorio.
