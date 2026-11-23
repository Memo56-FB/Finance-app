# Spec Delta

## Purpose

Asegurar que los borradores, datos y acciones disponibles en una pestaña financiera correspondan a la identidad confirmada por el servidor.

## ADDED Requirements

### Requirement: Reconcile an active tab with the current account

When an account transition is signaled or a returning tab revalidates its session, the application SHALL reconcile identity before resuming private actions and refreshes. A confirmed identity change SHALL discard the previous account's private view, pending draft, transient notices and cached data before showing the current account's view.

#### Scenario: A different account is confirmed

- **WHEN** the tab was displaying one account and revalidation successfully returns a different account
- **THEN** any previous editor is discarded, its data is cleared and the current authorized route is loaded for the verified account
- **AND** late reads or callbacks from the previous view cannot publish data, trigger actions or notify the new view

#### Scenario: Account is unchanged

- **WHEN** a visible tab confirms the same account
- **THEN** its valid draft remains available and expected refreshes resume
- **AND** the return to the tab does not initiate any financial write

#### Scenario: Switch to guest or lose the session

- **WHEN** access changes from account to guest or the server confirms that the session expired
- **THEN** private UI and account-scoped data are cleared and the server selects the permitted guest or login destination
- **AND** guest views continue to use local examples with zero financial reads or writes

### Requirement: Recoverable login confirmation

After a successful credential submission the login form SHALL distinguish a transient identity-service error from an expired session. It SHALL only send credentials again after a new explicit login submission.

#### Scenario: Service temporarily unavailable after login

- **WHEN** the credential submission succeeded but the identity check fails with a network or server error
- **THEN** an explicit retry checks identity only and a successful check opens the allowed return destination

#### Scenario: Session no longer exists after login

- **WHEN** the credential submission succeeded but identity confirmation returns HTTP 401
- **THEN** the form explains the expired session in the selected language and makes an explicit login available
- **AND** neither credentials nor the identity check are automatically replayed
