# Spec Delta

## Purpose

Let each account maintain the categories used by its financial records through a simple, consistent management page.

## ADDED Requirements

### Requirement: Category table and navigation
The application SHALL expose a protected Categories section with an add button and a simple table of active category names. Each row MUST provide an accessible three-dot menu for editing or deleting that exact category. Empty, loading and failed lists MUST have distinct states.

#### Scenario: Open the categories section
- **WHEN** an authenticated user selects Categories
- **THEN** the table shows their categories in server order with row actions and an add button
- **AND** it uses the existing application styling and selected language

### Requirement: Create and edit categories
Users SHALL create and edit categories using a nonblank name of at most 100 characters after trimming, matching backend validation. Editing MUST prefill the selected record, and successful changes MUST refresh category labels throughout the application.

#### Scenario: Rename a category used by transactions
- **WHEN** the user edits a category and the server confirms the new name
- **THEN** its table row and related transaction, budget and recurring-payment labels refresh
- **AND** references continue to identify the same category

#### Scenario: Invalid name
- **WHEN** the name is whitespace-only or exceeds 100 characters
- **THEN** a localized field error prevents submission

### Requirement: Category identity is independent of its name
Categories SHALL be identified by their exact backend IDs. Duplicate names MUST remain supported in lists, selectors, URLs and mutations, with sufficient accessible disambiguation to target the intended record. User-written category names MUST NOT be translated as interface labels.

#### Scenario: Two identically named categories
- **WHEN** two categories share the same name and the user edits the second
- **THEN** only the selected ID is updated
- **AND** selectors distinguish the two records without enforcing an unsupported uniqueness rule

### Requirement: Delete categories without losing history
Deleting a category SHALL require confirmation and honor backend dependency conflicts. A successful deletion MUST remove it from new-record selectors while retaining historical references. A rejected deletion MUST leave the row intact and explain that dependent budgets or recurring payments need attention.

#### Scenario: Category has an active budget
- **WHEN** the user confirms deletion and the backend returns 409 because a budget uses it
- **THEN** the category remains visible and a localized dependency message is shown

#### Scenario: Category has historical transactions only
- **WHEN** the backend accepts deletion of a category used by historical transactions
- **THEN** it disappears from the active category list and new-record choices
- **AND** historical movements retain their category name and can still be filtered by its ID
- **AND** an existing movement can retain that inactive category when corrected
