import { PreferencesProvider } from '@/lib/i18n/client'
import { PreferencesBar } from '@/lib/i18n/PreferencesBar'
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
      <body className={`${publicSans.className} h-dvh w-full flex flex-col bg-beige-100`}>
        <PreferencesProvider preferences={{ language: locale.language }} messages={locale.messages}>
          <PreferencesBar />
          <div className="flex flex-1 min-h-0 flex-col">{children}</div>
        </PreferencesProvider>
      </body>
    </html>
  );
}
