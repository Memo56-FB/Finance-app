# Spec Delta

## Purpose

Show a consistent financial overview and allow accounts to configure the reporting periods calculated by the backend.

## ADDED Requirements

### Requirement: Server-owned period summary
The overview SHALL display the financial summary's period start, period end, income, expenses and current balance. Current balance MUST represent income minus expenses for that server-selected period, without adding prior periods or pot balances. Empty periods MUST display zero totals.

#### Scenario: Monthly period starts on day four
- **WHEN** the server reports a period from the fourth through the third of the next month
- **THEN** the overview displays those exact inclusive dates and totals
- **AND** the browser's timezone does not redefine the period

### Requirement: Configure reporting cuts
Accounts SHALL view and update monthly or semimonthly reporting settings with a start day from 1 through 31. Successful changes MUST reload the summary from the server and MUST NOT modify transactions, pot balances or calendar-month budget definitions.

#### Scenario: Short-month boundary
- **WHEN** a user saves a start day of 31 and the server clamps a cut to the last day of a shorter month
- **THEN** the interface displays the resulting server period without inventing an additional semimonthly cut
- **AND** the configured anchor remains day 31

#### Scenario: Invalid cut setting
- **WHEN** the start day is outside 1 through 31 or the update fails
- **THEN** a localized error is displayed and the previous confirmed summary remains intact

### Requirement: Overview shares section data
The overview SHALL show server-backed pot totals and previews, budgets, recurring-payment aggregates and the four newest transactions using the same account data as their sections. Names and amounts MUST no longer come from independent hardcoded cards. A failed widget MUST offer recovery without substituting sample data.

#### Scenario: Rename a pot and add a transaction
- **WHEN** both operations are confirmed and the user returns to the overview
- **THEN** its pot preview and newest transactions reflect those operations
- **AND** navigation to each detail section shows consistent values

### Requirement: Observe server-generated changes
Active financial views SHALL refresh on focus and at least once per 60 seconds while the page is visible, so automatic payments appear without a full reload. The browser MUST only observe these changes; it MUST NOT generate recurring-payment ledger entries.

#### Scenario: Automatic payment while overview is open
- **WHEN** the backend generates a scheduled payment while the account remains on a visible overview
- **THEN** the next successful refresh updates recurring totals, transactions, affected budgets and the period summary
- **AND** the browser sends no request to create that automatic expense
