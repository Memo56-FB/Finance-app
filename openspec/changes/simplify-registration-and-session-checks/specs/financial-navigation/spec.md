# Spec Delta

## Purpose

Permitir recorrer Finanzas con las lecturas propias de cada pantalla, conservando la protección de los datos privados en cada entrada y cambio de sesión.

## ADDED Requirements

### Requirement: Cero consultas de identidad por página financiera

En una sesión estable, abrir o recargar cualquiera de las seis rutas financieras, hidratarla, cambiar de sección o filtros y usar Atrás o Adelante SHALL producir cero `GET /api/auth/me` en el navegador y entre Next.js y Spring. La navegación SHALL reutilizar las consultas vigentes y en curso sin introducir otra petición exclusiva para comprobar la sesión.

#### Scenario: Entrada directa y recarga

- **WHEN** una cuenta abre por URL y recarga cada sección financiera, incluida una URL filtrada
- **THEN** recibe la vista de su sesión, sin consultar `/me` en ninguno de los dos tramos ni repetir la lectura financiera usada para autorizar y mostrar la página

#### Scenario: Recorrido de una pestaña autenticada

- **WHEN** la persona recorre las seis secciones con el menú, cambia un filtro y vuelve por el historial a una vista con datos vigentes
- **THEN** la URL y la vista responden inmediatamente, sin consultas de identidad ni escrituras por navegación

#### Scenario: Invitado explícito

- **WHEN** un invitado abre, recarga o recorre las seis secciones
- **THEN** sólo se muestran los ejemplos locales y el recorrido no hace solicitudes a Spring

### Requirement: Autorización de datos y cambios de sesión

El servidor SHALL verificar el acceso con Spring antes de entregar datos financieros en HTML o RSC. En una pestaña abierta, una señal de cambio de sesión o un rechazo de sesión en una operación privada SHALL suspender las acciones y ocultar la información anterior hasta resolver el acceso actual.

#### Scenario: Cookie que no acredita acceso

- **WHEN** llega una petición directa sin sesión, con una cookie anónima de CSRF, con una sesión inventada o con una sesión revocada
- **THEN** la respuesta exige login con el destino permitido y no contiene datos privados

#### Scenario: Servicio temporalmente indisponible al entrar

- **WHEN** la primera lectura protegida falla por red, timeout o caída del servicio
- **THEN** la entrada ofrece reintento sin entregar datos privados, borrar la sesión ni convertirla en invitada

#### Scenario: Revocación mientras se consultan vistas en caché

- **WHEN** una sesión revocada sin aviso intenta la siguiente lectura o escritura protegida y recibe un `401`
- **THEN** se oculta la vista privada, se descarta el estado de la sesión revocada y se ofrece el acceso correspondiente
- **AND** la aplicación no reenvía automáticamente la escritura

#### Scenario: Cambio de cuenta en otra pestaña

- **WHEN** se recibe una señal de cambio mientras hay un borrador, una operación pendiente o resultados en caché
- **THEN** la pestaña comprueba el acceso antes de reanudar acciones y descarta el estado anterior si cambia la sesión
- **AND** ninguna respuesta tardía de la cuenta anterior puede mostrar datos, guardar un borrador ni publicar un aviso en la nueva sesión
