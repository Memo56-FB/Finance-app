import { QueryProvider } from '@/lib/api/QueryProvider'
import { Notifications } from '@/components/ui/Notifications'
import { PreferencesProvider } from '@/lib/i18n/client'
import { getI18n, getTheme } from '@/lib/i18n/server'
import type { Metadata } from "next";
import "./globals.css";
import { minecraft } from "./ui/fonts";
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  title: "finance",
  description: "Track your money, budgets and savings pots in a retro pixel-art world.",
  icons: { icon: "/icon.svg" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getI18n()
  const theme = await getTheme()
  return (
    <html lang={locale.language} data-theme={theme}>
      <SpeedInsights />
      <body className={`${minecraft.variable} font-sans relative h-dvh w-full flex flex-col bg-background text-foreground`}>
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
