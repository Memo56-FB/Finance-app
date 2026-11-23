# Spec Delta

## Purpose

Garantizar que cerrar un formulario y confirmar una operación financiera tengan resultados previsibles al usar el ratón, el teclado o una pantalla táctil.

## ADDED Requirements

### Requirement: Stable dialog dismissal

The dialog SHALL keep the selected action, title, fields and current values together throughout its visible exit. Reopening SHALL start a fresh draft from the chosen record. Dismissal SHALL restore focus to the opener or a logical surviving control when that opener was removed.

#### Scenario: Dismiss a populated editor

- **WHEN** a person dismisses a populated create, edit or money-movement dialog with Escape, the close button or the backdrop
- **THEN** every visible exit frame keeps its heading and field content until the panel disappears
- **AND** reopening a different record shows only that record's current values

#### Scenario: Reduced motion or deleted opener

- **WHEN** reduced motion is requested or a successful deletion removes the row that opened the dialog
- **THEN** dismissal completes and keyboard focus reaches a usable control without relying on an animation event from an absent element

### Requirement: Single owner of a pending save

A submitted dialog SHALL show the pending state and keep its draft until the request resolves. It SHALL accept only one write for that submission. A confirmed success SHALL close its own dialog. A rejection or uncertain result SHALL keep the entered values and offer the existing localized recovery.

#### Scenario: A slow save is followed by another interaction

- **WHEN** the person attempts to dismiss or resubmit while a save is pending
- **THEN** the pending dialog remains identifiable and exactly one write is sent
- **AND** its response cannot close or overwrite a later draft

#### Scenario: The outcome is uncertain

- **WHEN** a save fails with an unknown outcome and the person chooses to reload data
- **THEN** only a read is performed and the entered values stay available for review

### Requirement: Auxiliary reads require no submission

A form control for retrying a failed lookup SHALL reload only that lookup, including when all fields already contain valid data.

#### Scenario: Retry categories inside an edit

- **WHEN** the category lookup fails and the person activates its retry control with pointer or keyboard
- **THEN** the form stays open with its values, one category lookup starts and zero financial writes are submitted

### Requirement: Reporting day entry

The reporting-period form SHALL accept days 1 through 31, including a two-digit day with a leading zero, and send a JSON integer. Invalid input SHALL show a localized field error before any request.

#### Scenario: Enter a zero-padded day

- **WHEN** the person saves `01` as the start day
- **THEN** the financial service receives the numeric value `1` in one update

#### Scenario: Day outside the range

- **WHEN** the person submits a blank day, zero, a fraction or a day above 31
- **THEN** the input is identified as invalid and zero updates are sent
