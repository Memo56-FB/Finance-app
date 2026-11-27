import { Pixelify_Sans, Press_Start_2P } from "next/font/google";

export const pixelifySans = Pixelify_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-heading",
});
