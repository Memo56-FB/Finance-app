# Spec Delta

## Purpose

Ofrecer una preferencia global de idioma y moneda de presentación, recordada en el navegador y aplicada de forma coherente a toda la demo, sin cambiar valores financieros ni realizar conversiones monetarias.

## ADDED Requirements

### Requirement: Explicit initial preferences

La aplicación SHALL iniciar en inglés y USD cuando no existan preferencias válidas guardadas. El idioma del navegador SHALL NOT sustituir este valor inicial de forma automática.

#### Scenario: First visit from a Spanish browser

- **GIVEN** un navegador configurado en español sin preferencias guardadas de la aplicación
- **WHEN** se abre una página de producto
- **THEN** la interfaz aparece en inglés y los importes usan USD

### Requirement: Accessible global preference controls

La aplicación SHALL permitir elegir inglés o español y USD o MXN desde controles accesibles en las páginas de finanzas, acceso y registro. Su presentación SHALL funcionar en móvil y escritorio sin ocultar navegación ni acciones de página.

#### Scenario: Change preferences from mobile login

- **WHEN** una persona abre la pantalla de acceso en un dispositivo móvil
- **THEN** puede localizar y usar los controles de idioma y moneda sin iniciar sesión
- **AND** los controles tienen etiquetas accesibles y no generan desbordamiento horizontal

### Requirement: Independent language and currency

La aplicación SHALL permitir las cuatro combinaciones de inglés/español y USD/MXN. Cambiar una preferencia SHALL conservar la otra.

#### Scenario: Spanish does not force Mexican pesos

- **GIVEN** una interfaz en inglés y USD
- **WHEN** se selecciona español
- **THEN** la interfaz cambia a español y la moneda sigue siendo USD
- **AND** seleccionar después MXN conserva el idioma español

### Requirement: Global monetary presentation

Todos los importes de la demo SHALL usar la moneda seleccionada y el formato regional del idioma activo, incluidos saldos, tarjetas, gráficos, tablas, resúmenes, metas y vistas previas. Los signos de ingresos y gastos y la precisión monetaria de dos decimales SHALL conservarse.

#### Scenario: All financial views use Mexican pesos

- **WHEN** se selecciona MXN y se recorren las cinco vistas de finanzas
- **THEN** todas las representaciones monetarias y adornos de campos corresponden a MXN
- **AND** ninguna vista conserva un formateador USD fijo

#### Scenario: Signed amounts keep their meaning

- **GIVEN** importes numéricos de `75.5`, `-25` y `0`
- **WHEN** se muestran como transacciones con cualquiera de las cuatro combinaciones de preferencias
- **THEN** el primero conserva el signo de ingreso, el segundo el de gasto y el cero no adquiere un signo de ingreso o gasto
- **AND** todos conservan el mismo valor numérico y dos decimales monetarios

### Requirement: No foreign exchange conversion

Seleccionar USD o MXN SHALL cambiar únicamente la presentación de los importes ficticios de la demo. La aplicación SHALL conservar números, totales, metas y porcentajes, SHALL NOT consultar tipos de cambio y SHALL explicar junto al selector que los importes no se convierten.

#### Scenario: Currency changes presentation without changing amounts

- **GIVEN** un importe ficticio de `1000` presentado con USD
- **WHEN** se selecciona MXN
- **THEN** el importe sigue siendo numéricamente `1000` y se presenta con MXN
- **AND** los controles explican en el idioma activo que esto no equivale a convertir dólares en pesos
- **AND** no se realiza ninguna solicitud a servicios de tipos de cambio

### Requirement: Browser-scoped persistence

La aplicación SHALL recordar las preferencias para sus rutas dentro del mismo navegador mientras este conserve los datos guardados. La persistencia SHALL funcionar sin autenticación, base de datos ni sincronización de perfiles entre dispositivos.

#### Scenario: Preferences survive navigation and reload

- **GIVEN** una persona que ha seleccionado español y MXN
- **WHEN** navega a otra vista, la recarga o la abre en otra pestaña del mismo navegador
- **THEN** las preferencias siguen siendo español y MXN

#### Scenario: Another browser starts independently

- **GIVEN** un primer navegador con español y MXN
- **WHEN** se abre la aplicación en un navegador independiente sin preferencias guardadas
- **THEN** ese segundo navegador usa inglés y USD
- **AND** no modifica las preferencias del primero

### Requirement: Consistent initial rendering

Cuando existan preferencias válidas, el primer HTML SHALL usar el idioma y la moneda elegidos y el cliente SHALL continuar con esos mismos valores. Preferencias de otras sesiones SHALL NOT afectar esa respuesta.

#### Scenario: Spanish is present before client scripts run

- **GIVEN** preferencias guardadas de español y MXN
- **WHEN** se solicita una vista de producto antes de ejecutar sus scripts de cliente
- **THEN** el HTML inicial declara español y muestra sus textos e importes con las preferencias guardadas
- **AND** no necesita mostrar primero la versión inglesa para sustituirla después

#### Scenario: Concurrent sessions do not share preferences

- **GIVEN** una sesión con español/MXN y otra con inglés/USD
- **WHEN** ambas solicitan páginas de forma simultánea
- **THEN** cada respuesta respeta exclusivamente las preferencias de su sesión

### Requirement: Invalid stored preferences fall back safely

Los valores guardados SHALL validarse antes de usarse. Un idioma no soportado SHALL volver a inglés y una moneda no soportada SHALL volver a USD, sin descartar una preferencia independiente que siga siendo válida ni provocar errores de renderizado.

#### Scenario: Invalid language keeps a valid currency

- **GIVEN** un idioma guardado no soportado y una moneda guardada MXN
- **WHEN** se carga la aplicación
- **THEN** se usa inglés y MXN sin errores de formato

#### Scenario: Unsupported currency keeps Spanish

- **GIVEN** español y una moneda no soportada o malformada
- **WHEN** se carga la aplicación
- **THEN** se usa español y USD sin errores de renderizado

### Requirement: Failed persistence does not misrepresent a saved preference

Si el navegador impide guardar una selección, la aplicación SHALL conservar las preferencias efectivas anteriores, comunicar que no pudo guardar el cambio y continuar funcionando sin una excepción sin manejar.

#### Scenario: Browser blocks preference storage

- **GIVEN** un navegador que impide guardar preferencias
- **WHEN** una persona intenta cambiar idioma o moneda
- **THEN** se mantiene la última configuración efectiva y se presenta un mensaje de error en ese idioma
- **AND** la aplicación sigue siendo navegable
