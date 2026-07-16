/**
 * Normalises NEXT_PUBLIC_API_URL so callers never double-prefix /api.
 *
 * Contexts:
 *  - Web (browser): can use a relative path like /api (same-origin proxy) or
 *    an absolute URL like https://api.momdigital.live/api.
 *  - Capacitor native (iOS / Android WebView): loads from a
 *    capacitor://localhost or file:// origin, so relative paths don't resolve
 *    to any real server. NEXT_PUBLIC_API_URL MUST be an absolute HTTPS URL
 *    in the mobile build, e.g. https://api.momdigital.live/api.
 *
 * During development with live-reload (`npx cap run android/ios --livereload`),
 * set NEXT_PUBLIC_API_URL=http://<your-LAN-IP>:3001/api in .env.local.
 */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  const base = raw.replace(/\/$/, "");

  // In a Capacitor WebView the page origin is capacitor://localhost or
  // file://, so relative /api paths would silently 404. Warn devs early.
  if (
    typeof window !== "undefined" &&
    typeof (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor !== "undefined" &&
    (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() &&
    base.startsWith("/")
  ) {
    console.error(
      "[api-url] Running inside a Capacitor native WebView but NEXT_PUBLIC_API_URL is a " +
        "relative path. Set it to an absolute HTTPS URL in your mobile .env."
    );
  }

  return base;
}

/** Build a full URL for an API path (path should start with /, e.g. /chatbot/message) */
export function apiUrl(path: string): string {
  const base = getApiBase();
  let p = path.startsWith("/") ? path : `/${path}`;

  if (base.endsWith("/api") && p.startsWith("/api/")) {
    p = p.slice(4);
  } else if (base.endsWith("/api") && p === "/api") {
    p = "";
  }

  return `${base}${p}`;
}

