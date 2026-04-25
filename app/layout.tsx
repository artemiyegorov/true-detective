import type { Metadata } from "next";
import { Special_Elite, Lora } from "next/font/google";
import "./globals.css";

const elite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-elite",
  display: "swap",
  adjustFontFallback: false,
});

// Lora — modern serif, very readable at body sizes, still has character.
// Replaces IM Fell English which was too decorative for paragraph text.
const lora = Lora({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
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
      <body className={`${elite.variable} ${lora.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
