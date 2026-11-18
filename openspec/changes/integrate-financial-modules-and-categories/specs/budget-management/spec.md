# Spec Delta

## Purpose

Manage category budgets and display their server-calculated calendar-month spending without obscuring overspending or blocking valid expenses.

## ADDED Requirements

### Requirement: Budget management by category
Accounts SHALL list, create, edit and delete budgets using an active category, a positive spending limit and a valid six-digit hexadecimal color. One active budget per category MUST be enforced by the server. Editing MUST prefill the selected budget, and deleting it MUST preserve its transactions.

#### Scenario: Duplicate budget created concurrently
- **WHEN** another request already created an active budget for the chosen category
- **THEN** the server's conflict is explained in the form without creating a second budget

#### Scenario: Existing color outside the house palette
- **WHEN** a budget loaded from the server has a valid color outside the preset palette
- **THEN** editing retains and displays that color unless the user selects another

### Requirement: Server-calculated monthly consumption
Budgets SHALL display the selected server calendar month and its returned spent, available, limit-reached and excess amounts. Only negative effective transactions contribute to spending. The default month MUST come from the server rather than the device timezone, independently of reporting-cut settings.

#### Scenario: Income and spending in the same category
- **WHEN** a category has both positive income and negative expenses during a month
- **THEN** budget spending follows the server's expense-only calculation without netting the income

#### Scenario: Limit is exceeded
- **WHEN** a limit of `$100.00` has spending of `$125.00`
- **THEN** available funds are shown as `-$25.00` with an exceeded warning
- **AND** visual progress remains bounded while the displayed amounts stay exact

### Requirement: Budget spending history navigation
Each budget SHALL show up to three newest expenses for its category and selected month, and link to the category-filtered transaction history by ID. Preview selection MUST remain correct when matching expenses are not on the first history page. Preview failure MUST NOT replace valid budget aggregates with inferred totals.

#### Scenario: Recent category movements include other months and income
- **WHEN** the first page has no qualifying expenses but later pages contain expenses in the selected month
- **THEN** the preview finds the newest qualifying expenses across pages
- **AND** the history link targets that category without filtering by its display name

### Requirement: Budget changes refresh shared views
Successful budget changes SHALL refresh the budget section and overview chart. Lowering a limit below existing spending MUST be allowed when accepted by the backend and MUST immediately show the resulting warning; deleting a budget MUST remove its chart contribution without deleting financial history.

#### Scenario: Lower the spending limit
- **WHEN** the user saves a limit below the month's confirmed spending
- **THEN** the updated budget and chart display the new limit and excess
- **AND** previously recorded expenses remain available
