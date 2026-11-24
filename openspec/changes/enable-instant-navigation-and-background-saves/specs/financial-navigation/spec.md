# Spec Delta

## Purpose

Permitir recorrer las seis secciones de Finanzas aunque el servicio tarde en responder, conservando el destino elegido, la identidad de la cuenta y la correspondencia entre los filtros y los datos.

## ADDED Requirements

### Requirement: Cambio inmediato de sección

La interfaz SHALL presentar el destino de una navegación interna antes de recibir la respuesta de identidad, de datos financieros o de página del servidor. Esto se aplica a Resumen, Transacciones, Categorías, Presupuestos, Apartados y Pagos recurrentes en una pestaña ya abierta con cuenta verificada o en modo invitado explícito.

#### Scenario: Primer acceso interno a cada destino con el servicio detenido en una petición

- **GIVEN** la sesión está abierta y las nuevas peticiones del servidor siguen pendientes
- **WHEN** se activa un enlace del menú a cualquiera de las seis secciones
- **THEN** la URL, el enlace activo y el título accesible corresponden al destino antes de liberar las peticiones
- **AND** se puede elegir otra sección mediante teclado o puntero mientras los bloques sin datos indican que están cargando

#### Scenario: Dos cambios seguidos mientras siguen llegando respuestas

- **WHEN** se pasa de Transacciones a Apartados y de ahí a Presupuestos antes de completar la primera lectura
- **THEN** la respuesta tardía de Apartados no cambia la ruta, el foco ni los datos visibles de Presupuestos

### Requirement: Lecturas privadas por cuenta y consulta

La aplicación SHALL presentar la última información disponible para la misma cuenta, filtros, página y periodo. Las vistas base ya visitadas podrán reutilizar sus datos durante la sesión abierta, incluso tras un periodo de inactividad. Una consulta sin datos, una lista vacía confirmada y una lectura fallida SHALL tener estados distinguibles.

#### Scenario: Volver a una vista visitada después del reposo

- **GIVEN** ya se cargó la vista base de Apartados y la cuenta sigue activa tras diez minutos en otra sección
- **WHEN** se vuelve a Apartados con el servicio lento
- **THEN** sus saldos confirmados se muestran antes de cualquier nueva respuesta y una consulta vigente no se descarga otra vez

#### Scenario: Cambiar un filtro o recuperar una lectura fallida

- **WHEN** se abre un mes o filtro que todavía no tiene datos
- **THEN** sólo sus bloques pendientes muestran la carga, sin presentar registros de otra consulta como propios
- **AND** un fallo ofrece reintentar esa lectura. Si ya había datos de esa misma consulta, siguen visibles con un aviso mientras la sesión conserve acceso

### Requirement: Precarga acotada a la navegación habitual

Tras abrir Resumen con una cuenta activa, la aplicación SHALL adelantar en segundo plano las categorías y la primera página de transacciones recientes sin filtros. Las consultas equivalentes completadas o en curso SHALL reutilizarse. El historial, las variantes de filtros y los periodos adicionales se cargan al necesitarlos.

#### Scenario: Abrir Transacciones durante la precarga

- **WHEN** se pulsa Transacciones mientras Resumen ya tiene en curso la misma primera página de movimientos
- **THEN** la pantalla cambia inmediatamente y ambos destinos comparten esa lectura
- **AND** la precarga no recorre páginas adicionales ni se repite por tiempo, foco de la ventana o reconexión

#### Scenario: Entrar directamente en Presupuestos o Pagos recurrentes

- **WHEN** se abre una de esas rutas con un editor cerrado
- **THEN** se cargan los datos de la vista. Las opciones de categorías se consultan al abrir un control que las necesita, si todavía no están disponibles

### Requirement: Enlaces, historial y accesibilidad

Los enlaces financieros SHALL mantener sus URL compartibles y el comportamiento del navegador para abrir en otra pestaña, recargar y usar Atrás o Adelante. La sección abierta, la opción activa y sus controles SHALL ser identificables en español e inglés, con teclado, en móvil y en escritorio.

#### Scenario: Del presupuesto a sus transacciones y de regreso

- **WHEN** se abre el detalle de transacciones de un presupuesto y se usa Atrás y Adelante
- **THEN** se recuperan cada ruta y sus parámetros, incluida la categoría del enlace de detalle
- **AND** el foco llega a un control o título del destino sin que una lectura posterior lo desplace

#### Scenario: Abrir una URL filtrada fuera de la pestaña actual

- **WHEN** se copia el enlace, se abre con un modificador en otra pestaña o se recarga
- **THEN** la entrada protegida recupera el mismo destino, orden, búsqueda, mes y página que estén representados en esa URL

### Requirement: Los límites de acceso rigen en todas las entradas

El servidor SHALL verificar toda entrada directa HTML o de componentes del servidor antes de entregar contenido privado. Sólo una cuenta previamente verificada en esa pestaña podrá reutilizar sus datos. Una señal de cambio de identidad SHALL ocultar el contenido privado y suspender acciones hasta resolver la sesión. El modo invitado SHALL usar únicamente los ejemplos locales.

#### Scenario: Cuenta ausente, caducada o sin verificar

- **WHEN** se solicita por URL una ruta financiera sin sesión válida, o no se puede comprobar su identidad inicial
- **THEN** la respuesta no expone datos privados. Una sesión caducada lleva al acceso con un retorno permitido y un fallo temporal permite reintentar la comprobación

#### Scenario: Caducidad silenciosa o cambio de cuenta en otra pestaña

- **WHEN** una comprobación en segundo plano detecta la caducidad al recorrer una vista en caché, o se confirma otra cuenta tras una señal de cambio
- **THEN** la pestaña descarta datos, borradores y avisos de la sesión anterior, incluso si llega una respuesta antigua
- **AND** el historial no recupera datos privados de esa sesión

#### Scenario: Falla una comprobación rutinaria en una cuenta previamente verificada

- **GIVEN** la pestaña sigue en la misma cuenta y no ha recibido ninguna señal de salida o cambio de identidad
- **WHEN** una comprobación en segundo plano falla por indisponibilidad temporal
- **THEN** se puede navegar por la última copia disponible en modo lectura y reintentar la comprobación. Las nuevas consultas privadas y los envíos quedan suspendidos hasta confirmar de nuevo la identidad
- **AND** una señal posterior de cambio oculta esa copia inmediatamente

#### Scenario: Recorrido de invitado con Spring fuera de servicio

- **WHEN** un invitado explícito abre los seis destinos y sus detalles
- **THEN** puede navegar por los ejemplos sin lecturas de identidad, lecturas financieras ni escrituras contra Spring
