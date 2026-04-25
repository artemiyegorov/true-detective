import type { Metadata } from "next";
import { Special_Elite, IM_Fell_English } from "next/font/google";
import "./globals.css";

const elite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-elite",
  display: "swap",
  adjustFontFallback: false,
});

const fell = IM_Fell_English({
  weight: "400",
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fell",
  display: "swap",
  adjustFontFallback: false,
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
      <body className={`${elite.variable} ${fell.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
