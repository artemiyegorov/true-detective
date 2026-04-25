import type { Metadata } from "next";
import { Special_Elite, IM_Fell_English, Inter } from "next/font/google";
import "./globals.css";

// Tags, monospace accents — typewriter font.
const elite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-elite",
  display: "swap",
  adjustFontFallback: false,
});

// Headlines and names only.
const fell = IM_Fell_English({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-fell",
  display: "swap",
  adjustFontFallback: false,
});

// All UI — body, buttons, descriptions, lists.
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
      <body className={`${elite.variable} ${fell.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
