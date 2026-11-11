# Spec Delta

## Purpose

Permitir elegir y recordar únicamente el idioma de la interfaz desde un control accesible, mostrando importes con el signo `$` sin asignar una moneda y descartando la antigua preferencia monetaria.

## ADDED Requirements

### Requirement: Explicit initial language

La aplicación SHALL iniciar en inglés cuando no exista un idioma válido guardado. El idioma del navegador SHALL NOT sustituir automáticamente ese valor inicial.

#### Scenario: First visit from a Spanish browser

- **GIVEN** un navegador configurado en español sin preferencias guardadas
- **WHEN** se abre una página de producto
- **THEN** la interfaz y el selector muestran inglés y el documento declara `lang="en"`

### Requirement: Single global language selector

La aplicación SHALL ofrecer un único selector de idioma por página en las cinco vistas de finanzas, acceso y registro. SHALL estar alineado en la esquina superior derecha del área superior de la aplicación y SHALL permanecer usable en móvil sin superponerse a navegación, títulos, formularios o acciones.

#### Scenario: Finance desktop placement

- **WHEN** se abre cualquiera de las cinco vistas de finanzas en escritorio
- **THEN** el selector se encuentra arriba a la derecha
- **AND** los botones para crear presupuestos o apartados siguen visibles y accionables

#### Scenario: Mobile and authentication placement

- **WHEN** se abre cualquier vista de producto a 320 o 390 píxeles de ancho
- **THEN** hay un único selector visible arriba a la derecha, sin desbordamiento horizontal
- **AND** no tapa el logo, los formularios, las acciones ni la navegación móvil

### Requirement: Flagged accessible language options

El selector SHALL mostrar la bandera de México junto a `Español` y la bandera de Estados Unidos junto a `English`, tanto en las opciones como en el valor activo. Las banderas SHALL ser decorativas; el control SHALL tener un nombre accesible localizado y permitir operar con teclado y foco visible sin depender de reconocer una bandera.

#### Scenario: Both options and selected value include flags

- **WHEN** se abre el selector y se elige `Español`
- **THEN** las opciones muestran sus banderas respectivas y el valor cerrado muestra México y `Español`
- **AND** elegir `English` cambia el valor cerrado a Estados Unidos y `English`

#### Scenario: Keyboard selection

- **WHEN** una persona alcanza el selector mediante Tab y cambia de idioma usando el teclado
- **THEN** puede abrirlo, recorrer las opciones y confirmar la elección con foco visible
- **AND** el lector de pantalla identifica el control como `Language` o `Idioma` y las opciones por sus nombres de idioma

### Requirement: No currency preference interface

La aplicación SHALL NOT ofrecer selector de moneda, opciones USD/MXN ni mensajes de conversión o de presentación sin conversión en su interfaz de producto. El idioma SHALL ser la única preferencia ofrecida por el control global.

#### Scenario: No obsolete monetary controls or explanation

- **WHEN** se recorren las siete vistas de producto en cualquiera de los dos idiomas
- **THEN** no aparece un control `Currency` o `Moneda`, ni la explicación de que cambiar moneda no convierte importes
- **AND** los importes financieros siguen visibles

### Requirement: Fixed monetary presentation

Todos los importes y adornos monetarios SHALL usar únicamente el signo `$` y dos decimales, sin asignar moneda. Cambiar idioma SHALL preservar cantidades, totales, metas, porcentajes, signos y dos decimales monetarios, sin convertir importes ni consultar tipos de cambio.

#### Scenario: Language never changes financial denomination

- **GIVEN** importes de `1000`, `75.5`, `-25` y `0` en inglés
- **WHEN** se cambia a español y se recorren tarjetas, gráficos, tablas, resúmenes y diálogos
- **THEN** todos siguen mostrando las mismas cantidades con el signo `$` y dos decimales
- **AND** las transacciones conservan sus signos de ingreso y gasto; el cero no adquiere ninguno
- **AND** la acción no solicita servicios de tipos de cambio

### Requirement: Legacy currency preference has no effect

La aplicación SHALL ignorar cualquier cookie monetaria heredada, sin usarla para decidir idioma, moneda o valores financieros y sin crearla ni renovarla. Un idioma guardado válido SHALL seguir funcionando aunque exista una preferencia monetaria antigua o malformada.

#### Scenario: Existing Mexican peso preference

- **GIVEN** cookies `finance-language=es` y `finance-currency=MXN`
- **WHEN** se abre la aplicación, se cambia a inglés y se recarga
- **THEN** el idioma sigue cada selección y los importes siempre usan `$`
- **AND** no se crea ni se actualiza `finance-currency`

#### Scenario: Invalid legacy currency cannot break rendering

- **GIVEN** español guardado y una cookie monetaria con un valor no soportado
- **WHEN** se abre una vista de producto
- **THEN** la página funciona en español con `$`, igual que si no existiera esa cookie

### Requirement: Browser-scoped language persistence

La aplicación SHALL recordar el idioma mediante `finance-language` al navegar, recargar o abrir una nueva pestaña del mismo navegador. SHALL funcionar sin autenticación y sin sincronización de cuentas o dispositivos.

#### Scenario: Language survives navigation and reload

- **GIVEN** una persona ha seleccionado español
- **WHEN** navega, recarga o abre otra pestaña de la aplicación
- **THEN** esas vistas presentan español y el selector conserva `Español`

#### Scenario: Another browser starts independently

- **GIVEN** un navegador con español guardado
- **WHEN** se abre la aplicación en otro navegador sin preferencias
- **THEN** el segundo usa inglés sin alterar al primero

### Requirement: Consistent initial language rendering

El primer HTML y la hidratación SHALL usar el idioma guardado y el signo `$`, sin mostrar primero otro idioma ni compartir preferencias entre sesiones. El documento SHALL declarar el idioma efectivo.

#### Scenario: Spanish before client scripts

- **GIVEN** español guardado, con o sin cookie monetaria heredada
- **WHEN** se solicita una de las siete vistas antes de ejecutar JavaScript
- **THEN** sus textos y selector ya muestran español, su documento declara `lang="es"` y sus importes usan `$`

#### Scenario: Concurrent independent languages

- **GIVEN** dos sesiones con idiomas distintos
- **WHEN** solicitan simultáneamente la aplicación
- **THEN** cada respuesta usa su propio idioma y ambas muestran importes con `$`

### Requirement: Invalid stored language falls back safely

El idioma guardado SHALL validarse antes de usarse; un valor ausente o distinto de `en` y `es` SHALL volver a inglés sin errores de renderizado ni efectos de cookies monetarias heredadas.

#### Scenario: Unsupported language with an old currency cookie

- **GIVEN** un idioma guardado inválido y `finance-currency=MXN`
- **WHEN** se carga la aplicación
- **THEN** la interfaz usa inglés y `$` sin errores

### Requirement: Failed language persistence preserves effective state

Si el navegador rechaza guardar el idioma, la aplicación SHALL mantener el idioma efectivo anterior y mostrar un error accesible en ese idioma. Durante una actualización SHALL impedir selecciones concurrentes y SHALL permitir volver a usar el selector al finalizar.

#### Scenario: Browser blocks language storage

- **GIVEN** la aplicación en inglés y un navegador que impide guardar cookies
- **WHEN** se intenta seleccionar español
- **THEN** la interfaz y el valor del selector siguen en inglés y se anuncia el error
- **AND** la aplicación sigue navegable y permite reintentar

#### Scenario: Language change is pending

- **WHEN** una selección válida de idioma está actualizando la vista
- **THEN** el selector no permite iniciar otra selección simultánea
- **AND** vuelve a estar disponible cuando termina la actualización
