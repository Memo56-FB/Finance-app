# Financial integration

For local development, start Spring at `http://localhost:8080` with its documented
PostgreSQL configuration, copy `.env.example` to `.env.local`, and run `pnpm dev`.
In Vercel Production, set
`FINANCE_API_URL=https://finance-api.memofb.dev` and `FINANCE_APP_ORIGIN` to the
exact public HTTPS origin of Next.js. Spring's `FINANCE_FRONTEND_ORIGIN` must
allow the frontend origin in use. These variables remain server-side.
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

Queries are scoped to account and filters. The initial authorized HTML/RSC
entry uses a fresh QueryClient and streams its in-flight no-store reads. The
browser shares those requests with the destination views. Its memory cache
retains the default view keys through idle periods. Historical months, search
results and additional pages can expire while inactive.

Overview starts the categories lookup and shares the default transaction page
with Transactions. Budget and recurring editors reuse any cached categories,
or fetch them on first open. Searches publish settled text after 300 ms.
Navigation updates the URL, active menu link and heading while the destination
data loads or refreshes. A failed read keeps any available data for the same
query and offers a read-only retry of that query.

Internal transitions share a background identity check. A routine temporary
failure keeps the previously verified copy available for reading. Confirming
identity enables reads and saves again. A session change or 401 conceals private
content until checked. Account changes discard the old cache, drafts and
notices. The finance gateway binds browser requests to the verified session
cookie while Spring continues authorizing each request.

Valid submissions enter a shared pending state and release the editor. A
category rename, a budget color change, or a pot name or color change can appear
provisionally. Spring confirms all financial values. Confirmed operations
invalidate the affected finance queries. Reporting-cut changes refresh only
the active period summary. Pot deletion exposes the original Spring undo
deadline even after navigating away.

A rejected save offers its draft and field errors for review. A 403 can be
retried explicitly with fresh CSRF. A missing record or conflict can be
reviewed against current data. After a lost response, Verify issues only GETs.
Deposits and withdrawals process each request as a new movement. Refreshing or
reopening the tab reads confirmed state without resending a pending operation.
Pending operations and recovered drafts live in the open tab.

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
