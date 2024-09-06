import type { Metadata } from "next";
import "./globals.css";
import { publicSans } from "./ui/fonts";

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
      <body className={`${publicSans.className} h-screen w-screen flex bg-beige-100`}>
        {children}
      </body>
    </html>
  );
}
