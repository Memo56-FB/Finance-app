# Spec Delta

## Purpose

Permitir usar toda la interfaz de finanzas en inglés o español con textos, fechas y números coherentes, sin traducir contenido del usuario ni alterar las operaciones de la aplicación.

## ADDED Requirements

### Requirement: Complete interface translation

La aplicación SHALL presentar en el idioma activo todos los textos propios de las páginas de resumen, transacciones, presupuestos, apartados, pagos recurrentes, acceso y registro, incluidos controles compartidos, diálogos, mensajes de demostración y estados vacíos.

#### Scenario: Spanish interface across routes

- **WHEN** una persona selecciona español y recorre las siete vistas de producto
- **THEN** sus títulos, etiquetas, botones, mensajes y opciones de interfaz se presentan en español
- **AND** las marcas y el contenido del usuario conservan su texto original

#### Scenario: Return to English

- **WHEN** una persona cambia de español a inglés
- **THEN** los textos propios de la interfaz vuelven a inglés sin recargar datos financieros ni perder la vista actual

### Requirement: Localized accessibility text

La aplicación SHALL usar el idioma activo en nombres accesibles, textos ocultos para lectores de pantalla, descripciones y controles de icono, y SHALL declarar ese idioma en el atributo `lang` del documento.

#### Scenario: Spanish keyboard and screen-reader navigation

- **WHEN** el idioma activo es español
- **THEN** navegación móvil, filtros, paginación, cierre de diálogos, visibilidad de contraseña y controles de preferencias tienen nombres accesibles en español
- **AND** el documento declara `lang="es"`

### Requirement: Stable internal values

La aplicación SHALL mantener estables los identificadores de categorías, colores, estados, ordenación y parámetros de URL. Una etiqueta traducida SHALL representar el mismo valor interno que su equivalente inglés.

#### Scenario: Translated category keeps the canonical value

- **WHEN** una persona elige la etiqueta española de la categoría `Bills`
- **THEN** se muestran los mismos registros que al elegir `Bills` en inglés
- **AND** el parámetro de categoría continúa usando el valor canónico `Bills`

#### Scenario: Translated sorting keeps its behavior

- **WHEN** una persona selecciona en español la opción equivalente a `Highest`
- **THEN** las transacciones se ordenan por su importe numérico descendente
- **AND** la selección conserva el valor interno `Highest`

### Requirement: Preserve navigation and view state

Cambiar el idioma SHALL conservar la ruta, búsqueda, categoría, ordenación y página seleccionadas. Las rutas públicas actuales SHALL continuar funcionando sin prefijos de idioma obligatorios.

#### Scenario: Change language while filtering transactions

- **GIVEN** la vista de transacciones tiene una búsqueda y una ordenación activas en una página válida
- **WHEN** la persona cambia de idioma
- **THEN** se conservan esos parámetros y los mismos resultados
- **AND** únicamente cambian sus etiquetas y formatos de presentación

### Requirement: Localized calendar dates

Las fechas SHALL presentarse según el idioma activo conservando el día y el instante originales. Las fechas de transacciones SHALL mantener la interpretación UTC existente y los vencimientos mensuales SHALL derivar su texto del día numérico disponible.

#### Scenario: UTC date remains the same calendar day

- **GIVEN** una transacción fechada `2024-08-29` en UTC
- **WHEN** se muestra en español desde una zona horaria negativa
- **THEN** su fecha sigue correspondiendo al día 29 y usa el mes localizado
- **AND** no aparece como una operación del día 28

#### Scenario: Monthly bill due day is localized

- **WHEN** se muestra en español un pago recurrente cuyo día de vencimiento es 1
- **THEN** su texto mensual expresa el día 1 en español sin reutilizar la cadena inglesa `Monthly-1st`

### Requirement: Localized numbers and percentages

Los números y porcentajes propios de la interfaz SHALL respetar el formato del idioma activo sin cambiar el valor calculado. Los porcentajes de ahorro SHALL conservar la precisión de dos decimales actual.

#### Scenario: Savings percentage preserves its value

- **GIVEN** una vista previa de ahorro que representa una proporción de `0.5525`
- **WHEN** se muestra en cualquiera de los dos idiomas
- **THEN** expresa un porcentaje equivalente a `55.25` con dos decimales
- **AND** el formato no vuelve a multiplicar el valor por cien

### Requirement: Preserve user-owned content

La localización SHALL conservar nombres de personas, comercios, apartados y demás contenido aportado por el usuario. El idioma solo SHALL cambiar etiquetas de interfaz y catálogos controlados por la aplicación.

#### Scenario: A savings pot keeps its name

- **GIVEN** un apartado denominado `Holiday`
- **WHEN** la persona cambia el idioma a español
- **THEN** su nombre permanece `Holiday`
- **AND** las acciones y descripciones que lo rodean se presentan en español
