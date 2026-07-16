/**
 * capacitor.ts — Native bridge utilities for MomDigital
 *
 * All imports from @capacitor/* are lazy so the web bundle never
 * crashes when the plugin isn't loaded in a browser context.
 * Always gate actual plugin usage with `isNative()`.
 */

import { Capacitor } from "@capacitor/core";

/** True only when running inside a real iOS / Android WebView. */
export const isNative = (): boolean => Capacitor.isNativePlatform();

/** "ios" | "android" | "web" */
export const getPlatform = (): string => Capacitor.getPlatform();

export const isIOS = (): boolean => Capacitor.getPlatform() === "ios";
export const isAndroid = (): boolean => Capacitor.getPlatform() === "android";

// ---------------------------------------------------------------------------
// Status Bar
// ---------------------------------------------------------------------------
export async function initStatusBar(): Promise<void> {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    if (isIOS()) {
      await StatusBar.setStyle({ style: Style.Light });
    } else {
      // Android — match our peach/warm brand
      await StatusBar.setBackgroundColor({ color: "#FF9F89" });
      await StatusBar.setStyle({ style: Style.Light });
    }
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (e) {
    console.warn("[capacitor] StatusBar init failed", e);
  }
}

export async function setStatusBarDark(): Promise<void> {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
  } catch { /* noop */ }
}

export async function setStatusBarLight(): Promise<void> {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Light });
  } catch { /* noop */ }
}

// ---------------------------------------------------------------------------
// Splash Screen
// ---------------------------------------------------------------------------
export async function hideSplash(): Promise<void> {
  if (!isNative()) return;
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (e) {
    console.warn("[capacitor] SplashScreen hide failed", e);
  }
}

// ---------------------------------------------------------------------------
// Haptics
// ---------------------------------------------------------------------------
type HapticStyle = "light" | "medium" | "heavy";

export async function haptic(style: HapticStyle = "light"): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const styleMap: Record<HapticStyle, typeof ImpactStyle[keyof typeof ImpactStyle]> = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: styleMap[style] });
  } catch { /* noop */ }
}

export async function hapticNotification(type: "SUCCESS" | "WARNING" | "ERROR" = "SUCCESS"): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    const typeMap = {
      SUCCESS: NotificationType.Success,
      WARNING: NotificationType.Warning,
      ERROR: NotificationType.Error,
    };
    await Haptics.notification({ type: typeMap[type] });
  } catch { /* noop */ }
}

// ---------------------------------------------------------------------------
// Preferences (replaces localStorage for native key-value store)
// ---------------------------------------------------------------------------
export async function prefSet(key: string, value: string): Promise<void> {
  if (!isNative()) {
    localStorage.setItem(key, value);
    return;
  }
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key, value });
  } catch {
    localStorage.setItem(key, value);
  }
}

export async function prefGet(key: string): Promise<string | null> {
  if (!isNative()) return localStorage.getItem(key);
  try {
    const { Preferences } = await import("@capacitor/preferences");
    const { value } = await Preferences.get({ key });
    return value;
  } catch {
    return localStorage.getItem(key);
  }
}

export async function prefRemove(key: string): Promise<void> {
  if (!isNative()) {
    localStorage.removeItem(key);
    return;
  }
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.remove({ key });
  } catch {
    localStorage.removeItem(key);
  }
}

// ---------------------------------------------------------------------------
// Safe-area insets (iOS notch / Android cutout aware)
// ---------------------------------------------------------------------------
/**
 * Returns CSS env() values for safe area insets.
 * On web they resolve to 0; on iOS they respect the notch.
 */
export function safeAreaInsets() {
  return {
    top: "env(safe-area-inset-top, 0px)",
    bottom: "env(safe-area-inset-bottom, 0px)",
    left: "env(safe-area-inset-left, 0px)",
    right: "env(safe-area-inset-right, 0px)",
  };
}
