# Spec Delta

## Purpose

Provide private, accurate financial data for authenticated accounts while preserving a separate, read-only guest experience.

## ADDED Requirements

### Requirement: Private financial access
The application SHALL protect all six finance pages and every financial API operation using the existing session. Unsafe requests MUST retain same-origin and CSRF protection. Unauthorized access MUST NOT expose private HTML, navigation payloads, responses, or cached financial data.

#### Scenario: Direct access without a session
- **WHEN** an anonymous visitor opens `/finance/categories` or any existing finance page
- **THEN** the application requires login and preserves only an allowed return route
- **AND** no private financial content is included in the response

#### Scenario: Forged or expired request
- **WHEN** a financial request has an expired session, or a mutation lacks valid origin or CSRF credentials
- **THEN** it is rejected without changing financial data
- **AND** session expiration returns the user to authentication without exposing another account's cache

### Requirement: Read-only guest separation
Guest mode SHALL show local sample data across all six sections without calling financial backend services or saving changes. A signed-in account MUST show its actual data, including empty results, and MUST NOT silently fall back to guest data after an error.

#### Scenario: Guest attempts to create a category
- **WHEN** a guest attempts an action that would save a financial change
- **THEN** the interface explains in the selected language that login is required
- **AND** no financial request, account creation, or persistent change occurs

#### Scenario: Empty account and unavailable backend
- **WHEN** an account has no records, or its financial service becomes unavailable
- **THEN** it sees the corresponding empty or error state respectively
- **AND** neither condition is replaced with sample records

### Requirement: Exact monetary and identifier values
The application SHALL preserve monetary values and record IDs exactly across requests, responses, rendering and edits. Money inputs MUST enforce the backend's sign, range and two-decimal constraints without silently rounding. Display MUST use `$` and the selected language's numeric separators without introducing a currency code or conversion.

#### Scenario: Values exceed JavaScript's safe integer precision
- **WHEN** an amount is `99999999999999999.99` and an ID is `9007199254740993`
- **THEN** both values survive loading, selecting, displaying and submitting unchanged
- **AND** aggregate totals above the single-record amount limit remain exact

#### Scenario: Invalid amount
- **WHEN** an amount is zero where forbidden, outside the allowed range, or has more than two decimal places
- **THEN** submission is blocked with a localized field error rather than a rounded value

### Requirement: Account isolation and consistent refresh
Financial data SHALL be scoped to the active account and requested filters. Successful mutations MUST refresh affected sections and overview data. Logout, guest entry and account changes MUST discard prior private data and prevent late requests from repopulating the next session.

#### Scenario: Switch accounts during a request
- **WHEN** account A logs out while a request is pending and account B signs in
- **THEN** B never sees A's records, including through navigation or browser history restoration

#### Scenario: Mutation changes several modules
- **WHEN** a pot withdrawal succeeds
- **THEN** the pot balance, transaction history, relevant budgets and overview refresh from server state

### Requirement: Safe submission and recoverable failures
The interface SHALL prevent duplicate pending submissions, retain form values on failure and close a form only after confirmed success. Mutations MUST NOT be automatically replayed. Validation, forbidden access, missing records, conflicts and uncertain network outcomes MUST produce localized, actionable states without presenting an unconfirmed change as saved.

#### Scenario: Response lost after a deposit
- **WHEN** the connection fails after sending a deposit and its outcome is unknown
- **THEN** the application does not resubmit it automatically
- **AND** it explains the uncertainty and offers to reload server state before another attempt

#### Scenario: Business conflict
- **WHEN** the backend rejects an operation with a conflict
- **THEN** the form remains available with its entered values and a localized explanation
- **AND** displayed balances are not changed optimistically

### Requirement: Accessible and localized financial controls
Financial pages SHALL retain the existing visual patterns, Spanish/English interface, accessible dialogs and keyboard controls. User-entered names MUST remain unchanged by language selection. Six navigation entries MUST remain usable on mobile and desktop without horizontal overflow or reducing touch targets below 44 pixels.

#### Scenario: A category named Bills in Spanish
- **WHEN** an account creates a category named `Bills` and switches to Spanish
- **THEN** its name remains `Bills`, while controls and validation messages use Spanish
- **AND** session and language controls retain their current positions and scroll behavior

#### Scenario: Keyboard and narrow viewport
- **WHEN** the user opens an action menu or form with the keyboard on a 320-pixel viewport
- **THEN** all six sections and available actions remain reachable, labeled and within the viewport
- **AND** closing a dialog returns focus to its trigger
