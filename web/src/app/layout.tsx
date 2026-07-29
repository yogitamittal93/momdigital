import type { Metadata, Viewport } from "next";
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
  // Icons — Next.js serves these automatically
  icons: {
    icon: "/icon.png",
    apple: "/icon-192.png",
    shortcut: "/icon-192.png",
  },
  // PWA / iOS home screen
  appleWebApp: {
    capable: true,
    title: "MomDigital",
    statusBarStyle: "default",
    startupImage: "/icon-512.png",
  },
  // Open Graph (nice previews when sharing URL)
  openGraph: {
    type: "website",
    title: "MomDigital — Maternal & Infant Health Companion",
    description:
      "AI-powered pregnancy and postpartum companion for modern mothers.",
    siteName: "MomDigital",
  },
  // Prevent phone-number auto-detection on iOS
  formatDetection: {
    telephone: false,
  },
};

// Separate Viewport export (Next.js 14+ requirement — cannot be in metadata)
export const viewport: Viewport = {
  // Covers the notch/Dynamic Island on iPhones
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Tints the browser address bar / status bar
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FF9F89" },
    { media: "(prefers-color-scheme: dark)", color: "#2A2A2A" },
  ],
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