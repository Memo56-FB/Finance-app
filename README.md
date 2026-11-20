This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

### Language preference

The global language selector at the top right offers English (default) with the
United States flag and Español with the Mexico flag. The flags identify the
language options, not currencies. In finance views, the selector sits at the top
right of the scrolling content and scrolls out of view; the desktop sidebar
fills the full viewport height. The browser
remembers the selection for up to one year in the `finance-language` cookie.
Next.js reads it per request, so the first HTML already matches the selection.
The preference applies when navigating, reloading or opening another tab in the
same browser; it does not synchronize between devices or accounts.

Amounts use only the `$` sign and two decimal places, with no currency assigned. Changing
language does not change financial values or convert money. Older currency
cookies are ignored and are no longer written or renewed. These routes require
a Next.js server runtime because they read request cookies.

### Account access and guest demo

Copy .env.example to .env.local, start financeApi as described in its README,
then run pnpm dev. Next.js must reach FINANCE_API_URL (locally port 8080).
FINANCE_APP_ORIGIN must equal the public frontend origin; configure the same
value as FINANCE_FRONTEND_ORIGIN in Spring. These are server variables. Production
requires HTTPS and a backend URL reachable from the Next.js host.

The existing /login and /singup forms use the real API. Registration creates
an account and asks you to log in. Spring's HttpOnly JSESSIONID is the sole
account session. Next.js transports and verifies it, including session rotation
and CSRF renewal. Axios attaches CSRF; React Query handles pending operations
without automatic POST replay or offline credential queues. Authentication
responses are not publicly cached. Sessions currently disappear when Spring
restarts.

Finance pages require a verified account or an explicit “Continue as guest”.
Guests use the current fixtures, never create backend accounts, and do not save
financial changes. The guest cookie is a separate browser session cookie; “Exit
guest mode” removes it. Closing a window may preserve session cookies depending
on browser restore settings. Accounts use their stored financial data, including empty
lists for new accounts. The header places the logout icon on the left and the language
selector on the right; the icon has a localized native tooltip and accessible name,
with no permanent demo-data banner. Logout calls Spring; guest exit works with the API offline.
Both preserve the independent language preference.

The root redirects temporarily according to access. Each finance page checks access
on the server, including RSC requests. Return URLs are limited to known finance
routes and retain filters. Public forms retain server-rendered HTML; JavaScript
is needed to submit. Finance is noindex, nofollow; public metadata remains
available. This does not promise search indexing of protected pages.

Before public deployment, configure login/registration rate limits at the ingress
as required by financeApi. No deployment or backend schema change is included.

| Entry | Anonymous | Guest | Verified account |
| --- | --- | --- | --- |
| / | Login | Finance demo | Stored finances |
| /login, /singup | Public forms | Forms for account access | Finance destination |
| /finance and its five subpages | Login with safe return URL | Read-only demo | Stored finances |
| /api/auth/me | 401 | 401 | Backend account email |

Run pnpm test, pnpm exec tsc --noEmit, pnpm lint and pnpm build for local checks.
pnpm test:e2e starts an isolated Next instance on port 3100 and a contract fixture
on 3101; it does not reuse your development server or require Spring. Its output
uses .next-e2e. The auth suite covers real HTTP requests from both the browser and
SSR, while the existing finance regressions explicitly prepare guest access.

For a real Spring smoke test, start Spring with an isolated disposable database,
start Next configured for that backend and matching frontend origin, then run:
FINANCE_SMOKE_ORIGIN=http://localhost:3000 node tests/integration/auth-real.mjs
This creates a throwaway account and verifies registration, browser login, session
rotation, HttpOnly cookies, CSRF renewal and logout. Do not point this test at a
production database.

### Financial services

All six finance pages use the existing Spring session. Browser requests go through
`/api/finance/*`, a closed same-origin route list; server rendering reads Spring
directly with `no-store`. Axios shares one CSRF interceptor for POST, PUT and DELETE.
Financial errors preserve forms; writes have no automatic retries or offline queue.
After a lost response, reload server data before deciding whether to submit again.

The backend must include the optional transaction `categoryId` filter, applied before
pagination and counting. Deploy that compatible extension before this frontend.
No new database migration is needed by this frontend change.

Money and IDs are decoded from raw JSON with `lossless-json`, held as decimal
strings and serialized as exact JSON numbers. Forms accept a decimal point without
group separators, at most 17 integer digits and two fractional digits. Financial
calculations never use JavaScript floating-point amounts; chart geometry uses
normalized ratios while labels keep the exact values. TypeScript targets ES2020
for native bigint arithmetic. Display remains `$` with no assigned currency.

Queries use account-specific keys, request-local SSR caches and no persistent
browser cache. Account views verify the active session before refreshing on focus
and also refresh every 60 visible seconds to observe Spring's automatic payments.
Changing the reporting cut updates its settings from the response and requests
only the period summary. Transaction and recurring searches wait 300 ms for
typing to settle. Budget history loads only for cards with confirmed spending.
Guest pages use local examples and send no financial requests.

See [the financial integration guide](docs/financial-integration.md) for module rules,
error handling and integration checks.
