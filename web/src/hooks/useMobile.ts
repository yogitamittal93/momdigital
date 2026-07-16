"use client";

import { useEffect, useState } from "react";
import { isNative, isIOS, isAndroid, getPlatform } from "@/lib/capacitor";

export interface MobileInfo {
  /** Running inside a Capacitor native WebView (iOS or Android) */
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  /** "ios" | "android" | "web" */
  platform: string;
  /** viewport width in px */
  width: number;
  /** true if viewport width < 768 */
  isMobile: boolean;
  /** true if viewport width is 768–1023 */
  isTablet: boolean;
}

export function useMobile(): MobileInfo {
  const [width, setWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 390
  );

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, []);

  return {
    isNative: isNative(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    platform: getPlatform(),
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
  };
}
