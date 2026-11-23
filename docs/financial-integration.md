# Financial integration

Start Spring with its documented PostgreSQL configuration, copy `.env.example` to
`.env.local`, set `FINANCE_API_URL` to its reachable origin and
`FINANCE_APP_ORIGIN` to the exact public Next origin, and run `pnpm dev`.
Spring's `FINANCE_FRONTEND_ORIGIN` must match. These variables remain server-side.
The backend must support `GET /api/transactions?categoryId=<positive ID>` for both
rows and counts. Its absence cannot be replaced by filtering one client page.

## Data and access

`/finance`, `/finance/categories`, `/finance/transactions`, `/finance/budgets`,
`/finance/pots` and `/finance/recurring-bills` each check access on the server.
The financial BFF allows only the documented resources/methods, forwards the Spring
session and CSRF, rejects guest access, and disables public caching. Spring chooses
the owner from the session. No user ID, role or provenance is writable by forms.

Responses are parsed before native JSON decoding can round numbers. IDs and money
are decimal strings in domain objects and hydration, with exact numeric JSON tokens
on writes. Page sizes and other bounded integers are validated separately; Long
counts stay exact. Aggregates can exceed a single record's maximum amount. Local
money arithmetic uses integer cents. User-written names are rendered unchanged,
including names such as `Bills` when the interface is Spanish.

Server calendar dates remain `YYYY-MM-DD`; changing language or device timezone
does not change them. Blank month selection requests the server's current month;
explicit selection uses `YYYY-MM`. Reporting cuts, due dates and business dates
come from Spring. Deletion/payment timestamps are UTC instants.

Queries are scoped to account and filters. SSR uses a fresh QueryClient per request
and direct no-store backend requests. The browser hydrates those results, refreshes
after confirmed writes, and clears/cancels
private data when leaving a session. No cache persists in localStorage.

Financial SSR reads are 6 for Overview, 2 for Transactions, 1 for Categories,
1 for Budgets, 1 for Pots and 2 for Recurring Bills. Session verification is
separate. The transaction category filter is hydrated on entry. Budget and
recurring editors load categories on first open and reuse a fresh cached list.
The two account searches publish settled text after 300 ms, with obsolete
GETs cancellable through the gateway. Saving the reporting-cut preference
uses the confirmed settings response and refreshes just the summary.

Account views verify the session on entry, on a session-change notification and after a financial 401.
Confirmed login, logout and guest transitions notify other tabs without sharing
credentials or account identifiers. A changed identity discards the previous
draft and cache. A temporary identity-check failure offers a retry. During login
confirmation this retry checks the session only. A confirmed expiration makes a
new explicit login available.

An expired session returns to the authorized guest or login view. A 403 permits an explicit retry with fresh CSRF. A 400 marks known
fields; 404 requests a reload; 409 preserves the form and explains the conflict.
Uncertain network outcomes require reading server state before deciding to repeat.
Deposits and withdrawals are not idempotent. No mutation is automatically replayed.
Empty account data never falls back to guest fixtures. Guest examples remain local
and read-only without a permanent demonstration banner.

## Categories

The name table uses IDs for keys, selectors and actions. Duplicate names are allowed
and selectors disambiguate them with their IDs. Create/edit names are trimmed and
limited to 100 characters. Deletion is confirmed and can return 409 for an active
budget or recurring-payment dependency. Successful deletion removes new-record
options, preserving historical names and existing assignments in corrections.

## Transactions

Transactions have a name, category, calendar date and nonzero signed amount.
There are no recipients, senders or transfers between users. Income/expense forms
send the corresponding sign; pot-origin corrections can retain a null category.
Source type, opening-balance flag and source IDs are read-only.

Search, category ID and six stable sorts run on the server before pagination.
The UI shows four records per page and maps its page one to API page zero. URLs
retain filters; changes reset page selection. Old name-based category links reset
to all categories for accounts because duplicate names have no unique ID mapping.
Guest links retain their local canonical values. Deleted categories can still be
queried by ID. Corrections to pot or payment movements can affect balances or
occurrence state; conflicts preserve the saved ledger. Budget warnings accompany
successful writes rather than rejecting an expense.

## Overview and reporting periods

The period summary comes from `/financial-summary` and is income minus expenses
inside its inclusive dates. It does not carry prior balances or add pot totals.
Monthly/semimonthly settings accept an anchor day 1–31; Spring handles short months.
Changing the cut does not rewrite transactions or calendar-month budgets.

By default the other widgets show the newest four transactions,
active pot total and first four pots, current-month budgets and monthly recurring
summary. Selecting a calendar month adds `month=YYYY-MM` to all five Overview
reads. The summary covers that whole month, transactions show its newest four
entries, and pot balances include movements through month end. Budgets and
recurring payments use the selected month. The selection stays on the Overview.
Returning to the current period restores the personal cut and default widgets.
In the monthly view the heading identifies the selected month and its inclusive
dates. Cards appear once the summary confirms that range. If the API returns
another period, the user can retry the reads for the selected month.
Each widget has independent empty/loading/error recovery. There are no
account-only hardcoded financial cards.

## Budgets

Budgets accept an active category, positive limit and hexadecimal color. One active
budget per category is enforced by Spring, including races. Existing valid colors
outside the preset palette are retained. Spent/available/reached/excess values are
server-owned; income does not reduce spending. Overspending shows negative available
funds with bounded visual progress. Lower limits and recorded expenses remain valid.
Deleting a budget preserves its transactions.

With exactly zero confirmed spending, the preview is empty and sends no history
request. For positive spending it scans newest-first category pages until it finds three
negative movements in the selected month or passes that month's start. It never
calculates totals from a partial page. An old month can require extra page reads;
month/sign backend filters can be proposed separately if volume warrants them.

## Savings pots

Create starts at zero; editing name/target/color preserves balance and permits a
target below savings. Positive deposits/withdrawals use Spring's operations, create
linked movements and refresh other sections. Deposits can exceed the target; excess
withdrawals are rejected, never silently reduced.

DELETE returns 200 with `id`, `deletedAt` and `restoreUntil`. The pot and its linked
movements disappear without a manufactured expense/refund. Undo restores the same
record within the original ten-second server window. Response Date helps estimate
the deadline; the server decides under latency or clock skew. Retries do not extend
the deadline, and an expired window is not simulated by creating another pot.

## Recurring payments

Subscriptions omit installment count and accept `intervalMonths` from 1 to 12,
defaulting to 1. Create/edit preserves that frequency and the list translates it.
Installment purchases require a positive whole count and always send an interval
of 1 month. Amounts remain per payment; the interval never multiplies the amount.
Spring determines scheduled months, due dates and monthly totals, including paid
history after frequency edits. The displayed installment sequence depends
on the selected month relative to the first due date, independently of paid count.
List search/sort/page do not alter monthly aggregates. Total is paid plus pending;
due soon is a subset of pending from today through seven days, excluding overdue.

Manual marking is idempotent per occurrence and can record an early payment using
the server's business date. Spring alone generates automatic expenses. Definitions
affect future scheduling; cancellation preserves paid history. Correct a historical
expense through transactions. Deleting it or changing its sign can mark an occurrence
VOID; the browser does not recreate it, and subsequent conflicts belong to Spring.

## Verification

`pnpm test` covers money/DTOs, security boundaries, queries and interactions.
`pnpm test:e2e` starts Next on 3100 and the HTTP fixture on 3101, so SSR and browser
read the same account-isolated contract server. Guest regressions remain separate.
`pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` and `pnpm build-storybook` complete
frontend checks. In the backend, run `./mvnw verify` with Docker available.

For a real integration check, use a disposable PostgreSQL instance, apply Spring's
existing Flyway migrations, disable recurring scheduling for the deterministic CRUD
cycle and start Next with matching origins. The financial smoke script uses its own
temporary account/records and cleans its financial records; do not use a production
or personal development database. Scheduling tests remain in the backend suite;
the browser suite observes a controlled server payment without generating one.
Run `FINANCE_SMOKE_ORIGIN=http://localhost:3220 node tests/integration/finance-real.mjs`
against that isolated environment (the smoke uses UTC as the backend business zone).

Review changes before authorizing atomic commits. This integration has no additional
schema migration; reverting the frontend does not undo already confirmed writes.
