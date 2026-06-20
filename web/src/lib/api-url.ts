/**
 * Normalises NEXT_PUBLIC_API_URL so callers never double-prefix /api.
 * Accepts either http://localhost:3001, http://localhost:3001/api, or a
 * relative path like /api (used in production so requests go through the
 * Next.js rewrite proxy in next.config.ts, keeping the API same-origin for
 * cookie purposes). Local dev should keep using the full localhost URL,
 * since there's no rewrite proxy running in `next dev`.
 */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  return raw.replace(/\/$/, "");
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
