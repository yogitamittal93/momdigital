"use client";

/**
 * CapacitorProvider
 *
 * Mounted once at the app root. On native platforms it:
 *  1. Initialises the status bar with brand colours
 *  2. Hides the splash screen after a short delay
 *  3. Applies safe-area CSS vars to <html> so every component can use
 *     var(--sat), var(--sab), var(--sal), var(--sar) without re-computing
 *
 * On web it is a pure no-op wrapper.
 */
import { useEffect, type ReactNode } from "react";
import { isNative, initStatusBar, hideSplash } from "@/lib/capacitor";

interface Props {
  children: ReactNode;
}

export function CapacitorProvider({ children }: Props) {
  useEffect(() => {
    if (!isNative()) return;

    // Set CSS vars once per session so layouts can use them
    const root = document.documentElement;
    root.style.setProperty("--sat", "env(safe-area-inset-top, 0px)");
    root.style.setProperty("--sab", "env(safe-area-inset-bottom, 0px)");
    root.style.setProperty("--sal", "env(safe-area-inset-left, 0px)");
    root.style.setProperty("--sar", "env(safe-area-inset-right, 0px)");

    // Init native chrome
    initStatusBar();

    // Give the WebView a brief moment to fully paint before hiding splash
    const timer = setTimeout(() => hideSplash(), 400);
    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
}
