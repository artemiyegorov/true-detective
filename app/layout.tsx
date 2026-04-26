import type { Metadata } from "next";
import { Cinzel, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import Tabs from "./Tabs";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${mono.variable} ${display.variable} ${inter.variable} antialiased`}>
        {children}
        <Tabs />
      </body>
    </html>
  );
}
