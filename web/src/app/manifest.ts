import type { MetadataRoute } from "next";

// Required for `output: "export"` (Capacitor/mobile static builds)
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MomDigital — Maternal & Infant Health Companion",
    short_name: "MomDigital",
    description:
      "MomDigital supports mothers through pregnancy and early parenthood with AI-powered health guidance, expert advice, and community care.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFF9F5",
    theme_color: "#FF9F89",
    categories: ["health", "medical", "lifestyle"],
    lang: "en",
    scope: "/",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        // Maskable icon: Android adaptive icon — the image has padding so
        // device launchers can safely crop it into any shape (circle, squircle, etc.)
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Pregnancy Tracker",
        url: "/pregnancy",
        description: "Track your pregnancy journey",
      },
      {
        name: "AI Chat",
        url: "/chat",
        description: "Chat with your AI health companion",
      },
      {
        name: "Dashboard",
        url: "/dashboard",
        description: "Your personal health dashboard",
      },
    ],
    screenshots: [],
  };
}
