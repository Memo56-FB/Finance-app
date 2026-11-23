# Spec Delta

## Purpose

Presentar importes, procedencia de movimientos y opciones seleccionadas de forma comprensible en escritorio, móvil y navegación con tecnología de asistencia.

## ADDED Requirements

### Requirement: Readable responsive financial lists

Transaction and recurring lists SHALL identify each value with the appropriate label at the active viewport. A table SHALL expose matching headers and cells. A compact list SHALL present readable labeled values and actions in a coherent order.

#### Scenario: Read movements on a narrow screen

- **WHEN** a user navigates account transactions at a mobile width
- **THEN** name, category, date, amount and row action have their correct meaning in the accessibility tree and their existing compact visual layout

#### Scenario: Read payments on a wide screen

- **WHEN** a user navigates recurring bills on desktop in either account or guest mode
- **THEN** title, due date and amount can be associated with their correct column headers and any available actions remain reachable

### Requirement: Announced filter selection

Mobile single-choice filters SHALL expose their accessible name and the selected option programmatically and support keyboard selection in both supported languages.

#### Scenario: Change a mobile sort or category

- **WHEN** the current selection is changed using the keyboard and the list of options is reopened
- **THEN** exactly one option is identified as selected and it corresponds to the visible list and URL

### Requirement: Budget totals with zero spending

A chart for existing budgets SHALL show the exact total spent and configured limit even when all spending amounts are zero. Existing positive-spending tooltips SHALL continue to show the exact financial value.

#### Scenario: A newly created budget has no expenses

- **WHEN** a person views the overview or budget summary with a single $100.00 budget and zero expenses
- **THEN** the chart shows $0.00 spent and a $100.00 limit in the active locale
- **AND** its decorative ring has no financial tooltip

### Requirement: Identifiable transaction corrections

The transaction editor SHALL visibly identify whether a movement is manual, from a pot or from a recurring payment. Linked names already returned by the service SHALL be displayed when available. Provenance SHALL remain read-only and localized labels SHALL leave user-entered names intact.

#### Scenario: Review a linked movement before saving

- **WHEN** a person opens an existing pot or recurring movement for editing
- **THEN** the visible editor identifies the source and the effect of a correction without requiring a new data request
- **AND** the update carries only editable transaction fields
