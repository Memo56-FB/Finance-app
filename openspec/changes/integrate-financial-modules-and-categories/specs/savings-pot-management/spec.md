# Spec Delta

## Purpose

Manage personal savings pots and their linked money movements, including the backend's brief restoration window after deletion.

## ADDED Requirements

### Requirement: Savings pot definitions and totals
Accounts SHALL list, create and edit pots with name, positive target amount and valid hexadecimal color. New pots MUST start at zero balance. Editing MUST preserve the actual balance, allow a target below that balance and retain valid existing colors. The overview MUST use the server's active-pot total.

#### Scenario: Reduce a target below current savings
- **WHEN** a pot holds `$80.00` and the server accepts a new target of `$50.00`
- **THEN** its balance remains `$80.00` and progress is visually capped at 100 percent
- **AND** the displayed target and balance remain their exact saved values

### Requirement: Confirmed deposits and withdrawals
Accounts SHALL deposit or withdraw strictly positive amounts using the pot operations. The server MUST determine the resulting balance and linked transaction. Insufficient funds and range conflicts MUST leave both unchanged. Deposits above the target MUST remain allowed, and excess withdrawals MUST NOT be silently clamped.

#### Scenario: Deposit creates a movement
- **WHEN** a deposit succeeds
- **THEN** the returned balance replaces the displayed balance and the linked positive transaction appears after refresh
- **AND** the same submission is not automatically repeated

#### Scenario: Attempt to withdraw too much
- **WHEN** a requested withdrawal exceeds the available balance
- **THEN** the interface displays a localized error and neither submits a smaller amount nor reports success

### Requirement: Soft deletion and time-limited undo
Pot deletion SHALL require confirmation and consume the backend's deletion response with `deletedAt` and `restoreUntil`. The pot and its linked movements MUST disappear from active views after success. An Undo action MUST attempt restoration within the original ten-second server window, without creating a new pot or extending the deadline on retries.

#### Scenario: Undo succeeds
- **WHEN** the server accepts restoration before `restoreUntil`
- **THEN** the same pot ID, balance and linked movements reappear exactly once
- **AND** active totals and related views refresh

#### Scenario: Undo arrives too late
- **WHEN** restoration reaches the server at or after the deadline, including because the device clock differs
- **THEN** the server's conflict is handled with a localized expiration message
- **AND** the application does not recreate the deleted pot or fabricate compensating movements

### Requirement: Pot history and summary consistency
Pot operations and linked transaction corrections SHALL refresh their dependent views from the backend. Pot balance MUST NOT be treated as the financial period's current balance, and deleting a pot MUST NOT create an artificial expense or refund.

#### Scenario: Balance spans reporting periods
- **WHEN** a pot has an old deposit of `$100.00` and a withdrawal of `$20.00` in the current period
- **THEN** its balance is `$80.00` while the period summary reflects only effective movements inside its period
- **AND** the overview does not add the pot balance to that summary
