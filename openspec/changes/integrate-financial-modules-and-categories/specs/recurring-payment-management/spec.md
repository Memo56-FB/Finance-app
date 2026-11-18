# Spec Delta

## Purpose

Manage monthly subscriptions and installment schedules while keeping payment status, summaries and ledger history consistent with backend processing.

## ADDED Requirements

### Requirement: Recurring definitions
Accounts SHALL create, edit and cancel subscriptions or installment schedules using name, active category, positive per-payment amount and first due date. Installments MUST require a positive whole installment count; subscriptions MUST omit it. Edits MUST prefill the record, preserve paid history and explain server conflicts involving already-recorded schedules.

#### Scenario: Create an installment schedule
- **WHEN** the user creates a twelve-installment purchase at `$50.00` per payment
- **THEN** the request sends `$50.00` and twelve installments rather than dividing the amount again
- **AND** displayed installment sequence derives from the selected month's schedule, independently of how many installments have been paid

#### Scenario: Edit a schedule with payment history
- **WHEN** a change attempts to move its first due month or reduce its term below a recorded installment
- **THEN** a server conflict preserves the saved schedule and entered form values

### Requirement: Monthly recurring list
Recurring payments SHALL support server-owned month selection, search, six sort orders and pagination. The list MUST distinguish PENDING, PAID, VOID and NOT_SCHEDULED states, preserve server due dates and omit a payment action when no occurrence is scheduled for that month.

#### Scenario: Billing anchor in a short month
- **WHEN** a schedule anchored on day 31 is viewed in a shorter month
- **THEN** its server-provided clamped due date is shown without changing the original billing anchor

#### Scenario: Search matches across pages
- **WHEN** the user changes search or sort
- **THEN** the request resets to the first page and uses server counts for all matching scheduled records

### Requirement: Manual payment confirmation
Accounts SHALL mark a scheduled month as paid through the backend's idempotent payment operation. A confirmed payment MUST update its occurrence, ledger, budget warnings and summaries. Repeating a payment already confirmed by the server MUST NOT create another expense.

#### Scenario: Pay a future occurrence early
- **WHEN** the server accepts an early manual payment for a selected month
- **THEN** the occurrence is shown as paid and its transaction date follows the backend's business date
- **AND** a repeated mark-paid request does not duplicate the expense

### Requirement: Summary is independent of list pagination
Recurring summaries SHALL use server aggregates for the selected month, independently of search and page. Paid plus pending MUST form the total. Due soon MUST remain a subset of pending due from today through seven days ahead; overdue pending items MUST NOT be counted as due soon.

#### Scenario: Due soon is already pending
- **WHEN** the server reports paid `$20.00`, pending `$80.00`, and due soon `$30.00`
- **THEN** the total is `$100.00`, without adding due soon a second time
- **AND** changing the list search does not change these monthly aggregates

### Requirement: Cancellation and corrected history
Canceling a recurring definition SHALL stop future pending schedule entries while preserving paid history and its aggregate contribution. Correcting or deleting a linked transaction MUST refresh the corresponding occurrence state. The browser MUST NOT recreate a VOID expense automatically or rewrite past payments when the definition changes.

#### Scenario: Cancel a paid subscription
- **WHEN** cancellation succeeds after a payment has been recorded
- **THEN** its historical expense and paid aggregate remain available
- **AND** future pending occurrences are removed according to the server response

#### Scenario: Correct an expense into income
- **WHEN** a linked payment transaction is changed to a positive amount and the server marks its occurrence VOID
- **THEN** the positive movement and occurrence state are refreshed
- **AND** any later manual payment follows backend conflict rules rather than creating a client-generated expense
