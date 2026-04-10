import { Inter, Quicksand } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-display",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${quicksand.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}