# Spec Delta

## Purpose

Permitir crear una cuenta, iniciar sesión y cerrarla desde los formularios existentes, respetando el contrato y los controles de seguridad de financeApi.

## ADDED Requirements

### Requirement: Login through the existing session contract

El formulario de `/login` SHALL enviar email y contraseña mediante `POST /api/auth/login` como `application/x-www-form-urlencoded`, con CSRF válido. SHALL recortar y convertir el email a minúsculas sin modificar la contraseña. Un `204` SHALL conducir al destino financiero permitido tras comprobar la sesión mediante `/api/auth/me`.

#### Scenario: Successful login with significant password spaces

- **WHEN** se envían un email con espacios exteriores y mayúsculas y una contraseña válida que contiene espacios significativos
- **THEN** se envía el email normalizado y la contraseña intacta
- **AND** un login `204` seguido de `/me` `200` permite abrir el destino financiero solicitado

#### Scenario: Invalid credentials

- **WHEN** el login responde `401` por credenciales incorrectas, una cuenta desconocida o una cuenta deshabilitada
- **THEN** la persona permanece en el formulario y recibe el mismo mensaje localizado de credenciales inválidas
- **AND** no se inicia una sesión local ni un bucle de redirecciones

#### Scenario: Login succeeds but session confirmation fails

- **WHEN** el login responde `204` pero la consulta de sesión falla por red o servicio no disponible
- **THEN** se informa que no se pudo comprobar la sesión y se ofrece reintentar esa comprobación
- **AND** no se informa que la contraseña es incorrecta ni se repite automáticamente el login

### Requirement: Registration without automatic authentication

El formulario de `/singup` SHALL enviar `name`, `email` y `password` como JSON a `POST /api/auth/register`, con CSRF válido. Un `201` SHALL mostrar una confirmación localizada y ofrecer continuar al login conservando el destino financiero permitido. SHALL NOT autenticar automáticamente ni incluir datos personales en la URL de confirmación.

#### Scenario: Successful registration

- **WHEN** el backend confirma la creación con `201` y nombre y email normalizados
- **THEN** se muestra que la cuenta fue creada y se requiere iniciar sesión para obtener acceso de cuenta
- **AND** la contraseña se descarta y no se ejecuta un login automático

#### Scenario: Existing email

- **WHEN** el registro responde `409`
- **THEN** se muestra un error localizado asociado al email y un enlace al login
- **AND** no se afirma que se creó o modificó una cuenta

### Requirement: Registration validation matches the backend

El registro SHALL validar nombre no blanco de 1 a 100 unidades UTF-16 tras recortarlo, email válido de hasta 254 tras normalizarlo y contraseña no blanca de al menos 8 unidades UTF-16 y hasta 72 bytes UTF-8, sin modificarla. El backend SHALL seguir siendo la autoridad de validación; los errores `400` SHALL asociarse a los campos conocidos.

#### Scenario: Password byte limit

- **WHEN** se prueban contraseñas de 72 y 73 caracteres ASCII y de 36 y 37 repeticiones de `é`
- **THEN** las dos de 72 bytes superan la validación de tamaño y las de 73 y 74 bytes se rechazan con un mensaje de contraseña

#### Scenario: Server validation is still shown

- **WHEN** el backend devuelve `400 application/problem+json` con errores de nombre, email o contraseña
- **THEN** se muestran mensajes localizados junto a los campos afectados sin repetir valores rechazados
- **AND** un error desconocido recibe un mensaje general seguro, sin mostrar excepciones internas

### Requirement: Accessible localized account forms

Los formularios SHALL ofrecer etiquetas, autocompletado apropiado, validación y mensajes accesibles en inglés y español. Durante un envío SHALL bloquear envíos y cambios de modo concurrentes. Las credenciales SHALL viajar solo en el cuerpo de la petición y SHALL NOT aparecer en URLs, logs ni almacenamiento persistente del navegador.

#### Scenario: Pending form and keyboard submission

- **WHEN** una persona envía el formulario con Enter y vuelve a pulsar mientras la petición está pendiente
- **THEN** solo se envía una operación y el estado pendiente es perceptible
- **AND** el resultado se anuncia de forma accesible y el formulario vuelve a permitir interacción cuando corresponde

#### Scenario: Forms without client scripts

- **WHEN** se carga acceso o registro con JavaScript desactivado
- **THEN** se muestran sus títulos y etiquetas en el HTML inicial y una explicación localizada de que enviar requiere JavaScript
- **AND** los controles no permiten enviar credenciales mediante GET ni a una ruta de página incorrecta

### Requirement: Session is established by the backend

El acceso de cuenta SHALL depender de `/api/auth/me` con respuesta válida `200` y email. La mera presencia de una cookie, un estado del navegador o un registro exitoso SHALL NOT acreditar una cuenta. La sesión SHALL persistir en navegación y recarga mientras el backend la acepte.

#### Scenario: Forged or expired session cookie

- **WHEN** existe una cookie de sesión arbitraria o caducada y `/me` devuelve `401`
- **THEN** no se concede acceso de cuenta ni se inventa una identidad a partir de datos locales

#### Scenario: Reload with a valid session

- **WHEN** una persona autenticada recarga una página financiera y `/me` confirma su sesión
- **THEN** mantiene acceso con la misma identidad y su preferencia de idioma

### Requirement: Logout invalidates account access

La aplicación SHALL permitir cerrar sesión con `POST /api/auth/logout` y CSRF actualizado. Tras `204` SHALL eliminar el estado de cuenta y regresar a `/login`, sin activar invitado automáticamente. Si falla la operación por red SHALL informar el fallo sin afirmar que la sesión del backend fue invalidada.

#### Scenario: Logout followed by protected navigation

- **WHEN** se completa el logout y se intenta volver a una ruta financiera mediante URL, recarga o historial
- **THEN** se vuelve a exigir login o entrada explícita como invitado y no se reutiliza el estado anterior de la aplicación

#### Scenario: Logout service failure

- **WHEN** la petición de logout no puede completarse
- **THEN** se muestra un error accesible con opción de reintentar y no un mensaje falso de cierre exitoso

### Requirement: Financial demonstrations remain explicit

Iniciar sesión SHALL NOT presentar los datos financieros de ejemplo como datos personales persistidos. Las pantallas SHALL mantener una indicación de demostración y las restricciones actuales para guardar, editar o eliminar información financiera hasta que exista una integración específica de esos datos.

#### Scenario: Newly registered account sees demonstration data

- **WHEN** una cuenta nueva inicia sesión y abre presupuestos o apartados
- **THEN** puede ver la demostración, identificada como tal, sin afirmar que los ejemplos pertenecen a su cuenta
- **AND** las acciones financieras que hoy no guardan cambios siguen sin guardarlos
