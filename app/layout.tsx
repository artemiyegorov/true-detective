import type { Metadata } from "next";
import { Cinzel, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import Tabs from "./Tabs";
import Notifications from "./Notifications";
import { loadCase } from "@/lib/case";

// Headlines and names — Cinzel (display serif from the Blackfile design).
const display = Cinzel({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-fell",
  display: "swap",
});

// Tags, dateline, mono accents — JetBrains Mono.
const mono = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-elite",
  display: "swap",
});

// Body / UI — Inter.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Death at the Bakery — Case File #247",
  description: "Open investigation true crime mystery.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Pre-load case JSON server-side once so the top-of-page Notifications
  // toast can resolve evidence/location ids → display names without
  // shipping the full case payload to every client.
  const ground = await loadCase();
  const evidenceNames: Record<string, string> = {};
  for (const e of ground.evidence) evidenceNames[e.id] = e.name;
  const locationNames: Record<string, string> = {};
  for (const l of ground.locations as Array<{ id: string; name: string }>) {
    locationNames[l.id] = l.name;
  }

  return (
    <html lang="en">
      <body className={`${mono.variable} ${display.variable} ${inter.variable} antialiased`}>
        {children}
        <Tabs />
        <Notifications evidenceNames={evidenceNames} locationNames={locationNames} />
      </body>
    </html>
  );
}
