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
language options, not currencies. On desktop, the selector floats at the top
right so the sidebar fills the full viewport height. The browser
remembers the selection for up to one year in the `finance-language` cookie.
Next.js reads it per request, so the first HTML already matches the selection.
The preference applies when navigating, reloading or opening another tab in the
same browser; it does not synchronize between devices or accounts.

Amounts use only the `$` sign and two decimal places, with no currency assigned. Changing
language does not change financial values or convert money. Older currency
cookies are ignored and are no longer written or renewed. These routes require
a Next.js server runtime because they read request cookies.
