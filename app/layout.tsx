import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Inter — Stripe / Linear / most fintech default. Excellent legibility at small
// sizes and ships variable axes (weight + opsz). Loaded once for the whole app.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// JetBrains Mono for any monospaced surface (e.g. raw values in dev tooling).
// Body amounts use Inter with `tabular-nums`, not this.
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Easy Expense Tracker",
  description: "Personal expense tracker",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${mono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full bg-background font-sans text-foreground"
        suppressHydrationWarning
      >
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
