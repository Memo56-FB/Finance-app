# Spec Delta

## Purpose

Limitar las consultas privadas a la información necesaria para el estado visible y la operación confirmada, manteniendo exactitud, frescura y recuperación de errores.

## ADDED Requirements

### Requirement: Settled search reads

Transaction and recurring searches SHALL show typed characters immediately and group a continuous typing burst into at most one list request for the settled value. Sorting, pagination, month and category changes SHALL preserve the intended filters. Superseded reads SHALL be cancellable through the read gateway.

#### Scenario: Rapid typing, with the list already loaded

- **WHEN** seven characters arrive 80 ms apart and no alternative filter is changed
- **THEN** the browser requests only the final uncached search after the short pause
- **AND** the URL and results represent the final text with page one selected

#### Scenario: Another filter changes before the search settles

- **WHEN** a person edits the search and then changes category, month or sort before the delay ends
- **THEN** the resulting URL and list use the latest values together and a late timer cannot revert them
- **AND** reloading or using browser history restores the corresponding input and filters

#### Scenario: A previous read completes late

- **WHEN** a different list query supersedes an in-flight read
- **THEN** the superseded result cannot displace the active result and a propagated client disconnect can cancel the upstream GET within the server timeout
- **AND** cancelling a read neither cancels a financial write nor causes one to be replayed

### Requirement: On-demand category choices

The application SHALL request categories for a visible category table or filter and for a form that needs category choices. Rendering the budgets or recurring list with its editor closed SHALL require zero category reads for that screen.

#### Scenario: Open an editor after entering budgets or recurring

- **WHEN** a person opens the first category-dependent editor without fresh cached categories
- **THEN** one category read provides its choices and a read failure can be retried inside the form
- **AND** another editor reuses a fresh list for the same account

#### Scenario: Read transaction filters

- **WHEN** a person enters the transaction list with a category filter
- **THEN** the initial view retains the category choices and a valid selected category ID

### Requirement: Refresh resources affected by reporting settings

A successful reporting-cut update SHALL refresh the server-owned period summary and reflect the confirmed settings, with at most two follow-up financial reads in the active overview. Independent resources SHALL continue to refresh on account-scoped focus or visible polling and when an operation affects them.

#### Scenario: Save the start day in the overview

- **WHEN** the update succeeds in a visible overview with no concurrent poll or focus event
- **THEN** the confirmed settings and recalculated period totals are visible
- **AND** the update triggers zero reads of transactions, budgets, pots and recurring aggregates

#### Scenario: Record a linked movement

- **WHEN** a pot movement or recurring payment succeeds, or the backend records an automatic payment
- **THEN** affected balances, transactions, budget previews and summaries converge to the server values under the existing write or visible-refresh rules

### Requirement: Correct budget previews with bounded unnecessary reads

A budget with confirmed monthly spending of exactly zero SHALL immediately show an empty preview without reading or displaying cached transaction history. For positive spending it SHALL still find up to three newest eligible expenses across pages, with backend totals authoritative.

#### Scenario: Zero spending across several categories

- **WHEN** three displayed budgets report zero monthly spending, including a category with income only
- **THEN** all three previews are empty and trigger zero history requests on entry or refresh

#### Scenario: Spending changes while the screen is visible

- **WHEN** confirmed spending changes from zero to positive and back to zero
- **THEN** the preview can load matching expenses for the positive value and previous or late history is hidden for the zero value

#### Scenario: A historical month has no first-page matches

- **WHEN** qualifying negative transactions occur only on later pages
- **THEN** the preview finds the correct newest rows and a history read failure leaves the server-calculated budget totals visible
