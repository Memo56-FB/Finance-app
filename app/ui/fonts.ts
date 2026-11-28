import localFont from "next/font/local";

export const minecraft = localFont({
  src: [
    { path: "./Minecraft-Regular.otf", weight: "400", style: "normal" },
    { path: "./Minecraft-Bold.otf", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-sans",
  fallback: ["system-ui", "sans-serif"],
});
