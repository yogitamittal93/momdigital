import type { ReactNode } from "react";
import "./pro-theme.css";

export const metadata = {
  title: "MomDigital Pro — Expert Portal",
  description: "Clinical workspace for verified healthcare professionals",
};

export default function ProLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="pro" suppressHydrationWarning>
      <body style={{ margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
