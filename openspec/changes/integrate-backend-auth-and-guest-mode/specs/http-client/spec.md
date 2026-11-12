# Spec Delta

## Purpose

Organizar las peticiones de autenticación con transporte seguro de sesión, protección CSRF y errores previsibles, evitando compartir identidad o respuestas entre usuarios.

## ADDED Requirements

### Requirement: Same-origin authentication transport

Las peticiones del navegador SHALL usar endpoints de autenticación del origen del frontend. La pasarela SHALL reenviar únicamente métodos y operaciones permitidos a un backend configurado en servidor, sin aceptar un destino elegido por el solicitante. SHALL conservar los formatos, estados y respuestas vacías del contrato existente.

#### Scenario: Existing endpoint contracts

- **WHEN** se solicitan CSRF, registro, login, identidad o logout con el método correcto
- **THEN** se mantiene el contrato del backend, incluidos JSON de registro, formulario de login, `201`, `204`, `400`, `401`, `403` y `409`
- **AND** una respuesta `204` no se intenta interpretar como JSON

#### Scenario: Arbitrary upstream destination or method

- **WHEN** se pide una operación desconocida, un método no permitido o se proporciona una URL para elegir el backend
- **THEN** la pasarela rechaza la operación sin contactar ese destino

### Requirement: Cookie lifecycle is preserved

El transporte SHALL conservar creación, rotación y eliminación de la cookie de sesión, con HttpOnly, SameSite y Secure según el entorno. SHALL limitar el reenvío a cookies necesarias de autenticación y excluir credenciales del cuerpo de respuestas, logs y almacenamiento persistente del cliente.

#### Scenario: Session rotates after login

- **WHEN** el backend cambia la cookie al autenticar una sesión anónima
- **THEN** el navegador recibe la cookie nueva y las comprobaciones posteriores del servidor usan esa misma sesión
- **AND** la cookie sigue siendo inaccesible para JavaScript

#### Scenario: Cookie deletion survives the transport

- **WHEN** el backend elimina la cookie al cerrar sesión
- **THEN** el navegador recibe esa eliminación con el alcance correcto y no conserva una cookie anterior equivalente

### Requirement: CSRF tokens follow the session lifecycle

Las mutaciones del backend SHALL enviar el token y encabezado obtenidos de `/api/auth/csrf` con la misma sesión. Tras login o logout exitosos SHALL descartarse el token anterior y obtener uno nuevo antes de la siguiente mutación. Los tokens SHALL permanecer únicamente en memoria transitoria del navegador.

#### Scenario: First mutation establishes a CSRF session

- **WHEN** se realiza el primer login o registro desde un navegador sin sesión
- **THEN** se obtiene primero CSRF, se conserva la cookie correspondiente y después se envía la mutación con el encabezado indicado

#### Scenario: Concurrent token acquisition

- **WHEN** varias operaciones necesitan inicialmente un token en la misma instancia de la aplicación
- **THEN** comparten una adquisición en curso y no crean carreras entre sesiones anónimas distintas

#### Scenario: Logout after login

- **WHEN** se solicita cerrar sesión después de un login exitoso
- **THEN** se usa un token obtenido después del login, sin reutilizar el token anterior

### Requirement: Mutation origin is checked

Las operaciones que cambian sesión o modo invitado SHALL rechazar orígenes ajenos al frontend. Las mutaciones de backend SHALL conservar además su validación CSRF; la pasarela SHALL NOT fabricar un token para una petición de escritura que no lo aporta.

#### Scenario: Cross-origin mutation

- **WHEN** otro origen intenta iniciar sesión, registrarse, cerrar sesión o activar o desactivar invitado
- **THEN** la operación es rechazada sin cambiar el estado de acceso

#### Scenario: Missing or stale CSRF

- **WHEN** se envía una mutación de backend sin token o con uno obsoleto
- **THEN** se conserva el rechazo `403` y no se autentica ni registra al solicitante
- **AND** el cliente descarta el token obsoleto para que un reintento explícito obtenga uno nuevo

### Requirement: Errors preserve their meaning

El cliente SHALL distinguir credenciales rechazadas, sesión expirada, validación, duplicado, CSRF y fallos de disponibilidad. Un `401` de login o de una consulta pública de identidad SHALL NOT desencadenar redirecciones globales. Una sesión privada rechazada SHALL limpiar su estado y requerir acceso nuevamente.

#### Scenario: Expected anonymous identity result

- **WHEN** se consulta identidad desde una página pública sin sesión y se recibe `401`
- **THEN** se permanece en la página pública sin bucles de peticiones o redirecciones

#### Scenario: Private request loses its session

- **WHEN** una petición de identidad de una cuenta previamente autenticada recibe `401`
- **THEN** se descarta su estado de cliente y se vuelve al login con un destino local permitido

#### Scenario: Timeout and unexpected backend response

- **WHEN** una petición excede un tiempo límite finito o recibe una respuesta inesperada
- **THEN** termina con un error seguro y localizado que permite reintentar, sin dejar indefinidamente bloqueados los controles

### Requirement: No automatic mutation replay

Las peticiones de login, registro y logout SHALL NOT reintentarse automáticamente tras errores, reconexión o recuperación de CSRF. SHALL NOT quedar persistidas o encoladas para reenviarlas al recuperar conexión. Un nuevo intento SHALL requerir una acción explícita.

#### Scenario: Registration outcome is uncertain

- **WHEN** se pierde la conexión después de enviar un registro
- **THEN** se informa el fallo sin enviar otro registro automáticamente
- **AND** no se supone que la cuenta fue creada ni que no fue creada

### Requirement: Authentication caches are isolated

Las respuestas y tokens de autenticación SHALL NOT utilizar cachés públicas ni estado global compartido por solicitudes del servidor. Login, logout y cambios de modo SHALL descartar el estado del cliente y de navegación que pudiera pertenecer a la identidad anterior. Contraseñas y tokens SHALL NOT incluirse en el estado serializado al HTML.

#### Scenario: Two users and a guest

- **WHEN** dos navegadores con cuentas distintas y un invitado realizan peticiones simultáneas
- **THEN** cada uno obtiene únicamente su estado de acceso y su idioma
- **AND** el invitado no obtiene la identidad de ninguna cuenta

#### Scenario: Sequential accounts in one browser

- **WHEN** una persona cierra sesión y otra inicia sesión en el mismo navegador
- **THEN** el estado de cuenta anterior no aparece durante la transición ni en las respuestas posteriores
