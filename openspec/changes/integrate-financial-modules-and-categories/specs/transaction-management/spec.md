# Spec Delta

## Purpose

Maintain a personal transaction ledger with accurate filtering, pagination and corrections across manual and linked financial movements.

## ADDED Requirements

### Requirement: Server-filtered transaction history
Transaction history SHALL combine search, category ID, sort and pagination over the complete owned ledger before calculating counts or selecting a page. The API MUST accept optional positive `categoryId` without changing unfiltered requests. Filters MUST persist in the URL, reset the page when changed, and support the six existing sort orders.

#### Scenario: Category matches beyond the first page
- **WHEN** a user filters by a category whose transactions span several pages and searches by name
- **THEN** every returned row and the total count use both filters
- **AND** the displayed page count reflects all matching records

#### Scenario: Historical, foreign and invalid filters
- **WHEN** `categoryId` identifies an inactive owned category or a category outside the account
- **THEN** the former can return its historical movements and the latter returns no private records
- **AND** invalid API parameter values are rejected

#### Scenario: Legacy URL and page normalization
- **WHEN** an account opens an old name-based category URL or a page beyond the last available page
- **THEN** the name filter resets to all categories without guessing an ID, or the page moves to the last valid page respectively
- **AND** a zero-result list displays a stable empty state

### Requirement: Create and correct named transactions
Accounts SHALL create, edit and delete transactions using Name, category, calendar date and signed nonzero amount. New manual transactions MUST require an active category. Existing inactive categories MUST remain selectable for unchanged historical assignments. The interface MUST NOT introduce recipients, senders or user-to-user transfers.

#### Scenario: Record income or an expense
- **WHEN** a user submits a valid name, category, date and positive income or negative expense
- **THEN** the server-confirmed movement appears in history and related totals refresh
- **AND** the calendar date is displayed without a timezone shift

#### Scenario: Correct a movement after its category was deleted
- **WHEN** the user edits the name or amount while retaining its existing inactive category
- **THEN** the form preserves that category assignment and submits the selected movement ID

### Requirement: Linked movement corrections
The interface SHALL identify manual, pot and recurring-payment movements without permitting provenance changes. Edits and confirmed deletions MUST use the transaction API and reflect its effects on linked balances or payment status. Conflicts MUST preserve the saved state and show a localized explanation.

#### Scenario: Correction would overdraw a pot
- **WHEN** a linked pot transaction edit or deletion would produce an invalid pot balance
- **THEN** a backend conflict leaves the transaction and pot unchanged
- **AND** the interface explains why the correction failed

#### Scenario: Delete a recurring-payment expense
- **WHEN** the server confirms deletion of a recurring-payment transaction
- **THEN** its occurrence status and summary refresh along with the ledger
- **AND** the interface does not recreate the expense itself

### Requirement: Confirmed budget warnings
Transaction creation and edits SHALL display budget warnings returned by the backend while retaining a successfully saved movement. Reaching or exceeding a budget MUST NOT be treated as a failed financial operation.

#### Scenario: Expense reaches the limit exactly
- **WHEN** the server saves an expense and reports a reached budget with zero excess
- **THEN** the application confirms the save and displays a localized budget warning
- **AND** it refreshes the budget instead of blocking or repeating the expense
