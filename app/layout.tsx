import { QueryProvider } from '@/lib/api/QueryProvider'
import { Notifications } from '@/components/ui/Notifications'
import { PreferencesProvider } from '@/lib/i18n/client'
import { getI18n } from '@/lib/i18n/server'
import type { Metadata } from "next";
import "./globals.css";
import { publicSans } from "./ui/fonts";
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  title: "Personal Finance",
  description: "Personal finance app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getI18n()
  return (
    <html lang={locale.language}>
      <SpeedInsights />
      <body className={`${publicSans.className} relative h-dvh w-full flex flex-col bg-beige-100`}>
        <QueryProvider>
        <PreferencesProvider preferences={{ language: locale.language }} messages={locale.messages}>
          <div className="flex flex-1 min-h-0 flex-col">{children}</div>
          <Notifications />
        </PreferencesProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
