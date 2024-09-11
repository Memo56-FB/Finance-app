import type { Metadata } from "next";
import "./globals.css";
import { publicSans } from "./ui/fonts";
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  title: "Personal Finance",
  description: "Personal finance app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <SpeedInsights />
      <body className={`${publicSans.className} h-dvh w-dvw bg-beige-100`}>
        {children}
      </body>
    </html>
  );
}
