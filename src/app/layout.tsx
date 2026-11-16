import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Fredoka, Jost, Pinyon_Script } from "next/font/google";
import Providers from "@/context/Providers";
import { themeInitScript } from "@/context/ThemeProvider";
import "./globals.css";

// Body / UI: soft geometric sans that echoes the logo's round letters.
const sans = Jost({ subsets: ["latin"], variable: "--font-sans-ui" });
// Headings and card titles: classic serif that pairs with the script.
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});
// Board title: formal copperplate script.
const script = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-script-face" });
// Logo: rounded, bubbly.
const logo = Fredoka({ subsets: ["latin"], weight: ["600"], variable: "--font-logo-face" });

export const metadata: Metadata = {
  title: { default: "Vision Board", template: "%s · Vision Board" },
  description: "Pin your goals, picture them, and check them off as the year unfolds.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1e8c7" },
    { media: "(prefers-color-scheme: dark)", color: "#161910" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${script.variable} ${logo.variable}`} suppressHydrationWarning>
      <body>
        {/* Sets the dark class before first paint so there's no theme flash. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
