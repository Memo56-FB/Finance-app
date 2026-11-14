# Spec Delta

## Purpose

Permitir recorrer la demostración financiera sin registro mediante una elección explícita, sin crear identidades ni otorgar permisos de cuenta en el backend.

## ADDED Requirements

### Requirement: Explicit guest entry

Acceso y registro SHALL ofrecer «Continuar como invitado» en el idioma activo. Elegirlo SHALL habilitar las pantallas financieras de demostración y respetar el destino local permitido. Visitar una ruta financiera sin acceso SHALL NOT activar invitado automáticamente.

#### Scenario: Enter without credentials

- **WHEN** una persona elige continuar como invitado desde el login o el registro sin rellenar credenciales
- **THEN** puede abrir la demostración y navegar por las cinco pantallas financieras
- **AND** no se crea una cuenta ni se ejecuta un login con credenciales compartidas

#### Scenario: Protected URL without choosing guest

- **WHEN** una persona sin sesión abre directamente `/finance/pots`
- **THEN** se presenta el login y todavía no se concede acceso invitado

### Requirement: Guest access is limited to existing demonstration data

El modo invitado SHALL utilizar los datos de ejemplo actuales y conservar las restricciones de las operaciones financieras. SHALL NOT guardar cambios en servidor, localStorage, IndexedDB u otra persistencia financiera, ni crear un usuario anónimo. Las vistas previas existentes SHALL continuar siendo temporales.

#### Scenario: Preview and reload

- **WHEN** un invitado previsualiza agregar dinero a un apartado y después recarga
- **THEN** reaparecen los datos de ejemplo originales y no se ha guardado ninguna operación
- **AND** el control de confirmación que no persiste cambios continúa deshabilitado

### Requirement: Guest state is separate from account identity

La aplicación SHALL conservar el modo invitado durante navegación y recarga mediante una cookie de sesión propia, sin identificarlo como usuario autenticado. El marcador de invitado SHALL NOT acreditar una cuenta ni autorizar APIs privadas. Entrar como invitado SHALL separar el estado del navegador de cualquier identidad de cuenta previa.

#### Scenario: Guest reload

- **WHEN** una persona con modo invitado activo recarga, navega o abre otra pestaña del mismo navegador
- **THEN** conserva acceso a la demostración mientras se conserve su cookie de sesión
- **AND** no se muestra el email ni el estado privado de una cuenta anterior

#### Scenario: Guest marker cannot impersonate an account

- **WHEN** se modifica o fabrica un marcador de invitado y se consulta un recurso de cuenta
- **THEN** ese marcador no concede autenticación de backend ni devuelve datos privados

### Requirement: Guest demonstration works without the backend

Entrar, recorrer y salir del modo invitado SHALL funcionar con el backend no disponible. Ese recorrido SHALL NOT solicitar identidad ni datos financieros al backend. Intentar registrarse o iniciar sesión desde invitado SHALL seguir dependiendo del servicio real y mostrar sus errores.

#### Scenario: Backend offline

- **WHEN** el backend está detenido y la persona elige invitado, visita las cinco pantallas y sale
- **THEN** puede completar ese recorrido sin peticiones de autenticación a financeApi

### Requirement: Accessible guest exit controls

Las páginas financieras SHALL ofrecer controles accesibles para ir al login y salir de la demostración, sin una leyenda permanente de datos de ejemplo. Salir SHALL borrar el estado invitado y el estado de sesión local asociado, volver al login y conservar únicamente preferencias independientes como el idioma.

#### Scenario: Exit prevents implicit reentry

- **WHEN** un invitado sale y después intenta abrir finanzas mediante URL, recarga o historial
- **THEN** se exige nuevamente login o una nueva elección de invitado
- **AND** no se restaura una cuenta previa ni se pierde la preferencia de idioma

### Requirement: Transition to account access is explicit

Un invitado SHALL poder abrir login o registro. Solo un login confirmado SHALL sustituir el modo invitado por acceso de cuenta y limpiar el estado de demostración del cliente. Un login fallido o un registro exitoso sin login SHALL NOT convertirlo en usuario autenticado.

#### Scenario: Guest logs in successfully

- **WHEN** un invitado completa el login con una cuenta válida
- **THEN** desaparece el estado invitado y el servidor comprueba la sesión de esa cuenta antes de entregar finanzas
- **AND** no se migra ni se guarda ningún cambio de la demostración

#### Scenario: Failed login and successful registration

- **WHEN** un invitado recibe un rechazo de login o crea una cuenta sin iniciar sesión
- **THEN** conserva únicamente su acceso de demostración y puede volver a ella
- **AND** el registro muestra su confirmación sin afirmar que ya inició sesión
