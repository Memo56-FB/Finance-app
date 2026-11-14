# Spec Delta

## Purpose

Restringir las pantallas financieras a sesiones comprobadas o visitas de demostración explícitas, antes de entregar contenido al navegador y conservando rutas e idioma.

## ADDED Requirements

### Requirement: Server-verified access to finance routes

Toda página de `/finance` SHALL comprobar en servidor una sesión válida o el modo invitado antes de devolver contenido financiero. SHALL cubrir `/finance`, `/finance/transactions`, `/finance/budgets`, `/finance/pots` y `/finance/recurring-bills`, tanto en solicitudes HTML como en navegación interna y respuestas de componentes del servidor.

#### Scenario: Anonymous direct access

- **WHEN** una persona sin sesión válida ni modo invitado solicita cualquiera de las cinco rutas financieras
- **THEN** recibe una redirección temporal al login con un destino de retorno permitido
- **AND** la respuesta no incluye contenido financiero ni identidad de otra persona

#### Scenario: Expiration between internal navigations

- **GIVEN** se ha abierto una página financiera con una sesión válida
- **WHEN** el backend invalida la sesión y se solicita otra página mediante navegación interna o una petición de componentes del servidor
- **THEN** se comprueba nuevamente el acceso y se exige login sin entregar el contenido solicitado

#### Scenario: Authorization does not rely on JavaScript

- **WHEN** un navegador sin JavaScript solicita finanzas sin acceso
- **THEN** recibe la misma protección del servidor, sin depender de ocultar contenido después de cargarlo

### Requirement: Explicit public entry routes

`/login` y `/singup`, sus recursos públicos y las operaciones públicas necesarias de autenticación SHALL permanecer accesibles sin sesión. `/` SHALL redirigir temporalmente al login o a `/finance` según el acceso. Las rutas públicas SHALL NOT admitir una operación privada del backend sin autenticarla.

#### Scenario: First visit and repeat visit

- **WHEN** se abre `/` sin acceso, con sesión válida o con modo invitado
- **THEN** se redirige respectivamente a `/login`, `/finance` o `/finance`
- **AND** los recursos necesarios para mostrar el formulario, sus banderas y sus fuentes siguen disponibles

#### Scenario: Authenticated user opens an account form

- **WHEN** una persona con sesión de cuenta válida abre `/login` o `/singup`
- **THEN** se redirige al destino financiero permitido o a `/finance`
- **AND** una persona invitada puede abrir esos formularios para obtener acceso de cuenta

### Requirement: Safe return destinations

Login, registro y entrada de invitado SHALL conservar el destino financiero solicitado y sus filtros de URL. SHALL aceptar únicamente rutas financieras locales permitidas; destinos externos, ambiguos, malformados o ajenos a finanzas SHALL volver a `/finance` sin ejecutar contenido ni crear bucles.

#### Scenario: Return to filtered transactions

- **WHEN** se solicita sin acceso `/finance/transactions?query=Emma&page=2` y posteriormente se completa el login o se elige invitado
- **THEN** se abre esa misma ruta con sus parámetros conservados

#### Scenario: Reject hostile return URL

- **WHEN** el destino de retorno contiene una URL externa, `//otro.example`, barras invertidas, una variante codificada equivalente o `/login`
- **THEN** el destino utilizado es `/finance` y no se navega al valor rechazado

### Requirement: Unavailable authentication fails closed

Si no puede verificarse una sesión de cuenta por timeout, red, respuesta inválida o error del servicio, la aplicación SHALL mostrar un estado recuperable sin contenido financiero ni identidad confirmada. SHALL NOT convertir ese fallo en sesión válida o invitado automático, ni confundirlo con un `401` confirmado.

#### Scenario: Backend unavailable during a protected request

- **WHEN** una petición financiera necesita verificar una cookie de cuenta y la API no responde correctamente
- **THEN** se muestra un error de comprobación con reintento y acceso al formulario público
- **AND** no se entrega contenido financiero ni se borra la cookie como si existiera un rechazo confirmado

#### Scenario: Entry remains possible during an outage

- **WHEN** se abre `/login` o `/singup` durante una caída del backend, incluso con una cookie previa
- **THEN** se presenta la página pública con un aviso de disponibilidad y la opción explícita de invitado
- **AND** el fallo de comprobación no crea un bucle entre el login y finanzas

### Requirement: Rendering and indexing respect the access boundary

Los títulos, formularios y metadatos de las páginas públicas SHALL estar presentes en el HTML inicial. Las páginas financieras SHALL declarar `noindex, nofollow` y sus respuestas personalizadas SHALL NOT compartirse entre usuarios mediante cachés públicas. La política de indexación SHALL NOT sustituir la comprobación de acceso.

#### Scenario: Public form before hydration

- **WHEN** se inspecciona el HTML inicial del login sin ejecutar JavaScript
- **THEN** están presentes el título, la descripción, las etiquetas del formulario y el idioma efectivo

#### Scenario: Finance indexing and isolation

- **WHEN** dos sesiones diferentes solicitan una página financiera
- **THEN** cada respuesta refleja únicamente su acceso y declara que no debe indexarse
- **AND** una respuesta autenticada no se reutiliza para una solicitud anónima

### Requirement: Preserve language and existing financial presentation

Los controles de acceso y sus errores SHALL respetar inglés y español. Entrar, salir o cambiar de modo SHALL conservar `finance-language`, los importes con `$` y las rutas existentes. Los controles de sesión SHALL ser utilizables a 320, 390 y 1280 píxeles, sin desplazar hacia abajo el sidebar de escritorio ni fijar el selector de idioma durante el scroll.

#### Scenario: Spanish session transitions

- **WHEN** una persona en español entra como invitado, inicia sesión posteriormente y cierra sesión
- **THEN** mantiene español en formularios, mensajes, controles y HTML inicial
- **AND** los importes continúan usando únicamente `$`

#### Scenario: Session controls and language layout

- **WHEN** se usan los controles de sesión en escritorio y móvil y se desplaza el contenido
- **THEN** no hay desbordamiento horizontal ni controles tapados
- **AND** el icono de salida está a la izquierda y el selector a la derecha, separados por el espacio disponible
- **AND** el icono tiene nombre accesible y tooltip `Cerrar sesión` en español o `Logout` en inglés
- **AND** el sidebar de escritorio empieza en el borde superior y el selector de idioma sale de vista con el contenido
