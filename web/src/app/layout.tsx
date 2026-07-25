import type { Metadata } from "next";
import { Inter, Quicksand } from "next/font/google";
import "./globals.css";
import "../styles/theme.css"; // your file
import { ThemeProvider } from "@/components/theme/theme-provider";
import { UserProfileProvider } from "@/context/user-profile-context";
import { CapacitorProvider } from "@/components/capacitor/CapacitorProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "MomDigital — Maternal & Infant Health Companion",
  description:
    "MomDigital supports mothers through pregnancy and early parenthood with AI-powered health guidance, expert advice, and community care.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

import { ReactNode } from "react";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${quicksand.variable} antialiased font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <UserProfileProvider>
            <CapacitorProvider>
              {children}
            </CapacitorProvider>
          </UserProfileProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}