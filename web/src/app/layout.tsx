import { Inter, Quicksand } from "next/font/google";
import "./globals.css";
import "../styles/theme.css"; // your file
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-display",
});

import { ReactNode } from "react";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${quicksand.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}