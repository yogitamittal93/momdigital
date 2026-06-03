import { NextResponse, NextRequest } from "next/server";

// Routes that only an authenticated user (mother OR expert) can access
const MOTHER_PROTECTED = [
  "/dashboard",
  "/pregnancy",
  "/appointments",
  "/postpartum",
  "/childcare",
  "/community",
  "/affirmations",
  "/trusted-help",
  "/career",
  "/recovery",
  "/medical-records",
  "/profile",
];

// Auth pages for mothers (redirect away if already logged in)
const MOTHER_AUTH_PAGES = ["/login", "/register"];

// Pro auth pages (redirect away if already logged in as expert)
const PRO_AUTH_PAGES = ["/pro/login", "/pro/register"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const url = req.nextUrl.pathname;

  // ─── Mother auth-page guard ────────────────────────────────────────────────
  const isMotherAuthPage = MOTHER_AUTH_PAGES.some((p) => url.startsWith(p));
  const isMotherProtected = MOTHER_PROTECTED.some((p) => url.startsWith(p));

  if (!token && isMotherProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (token && isMotherAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // ─── Pro route group guard ─────────────────────────────────────────────────
  const isPro = url.startsWith("/pro");
  const isProAuthPage = PRO_AUTH_PAGES.some((p) => url.startsWith(p));
  const isProApp = isPro && !isProAuthPage; // /pro, /pro/queue, /pro/content …

  if (isProApp && !token) {
    // Not logged in → send to pro login
    return NextResponse.redirect(new URL("/pro/login", req.url));
  }

  if (token && isProAuthPage) {
    // Already logged in, don't show login/register again
    return NextResponse.redirect(new URL("/pro", req.url));
  }

  // Note: role verification (MOTHER trying to access /pro) is intentionally
  // handled server-side by the page component + API RBAC rather than in the
  // middleware, because the JWT payload is HttpOnly-cookie-only and cannot
  // be decoded safely on the edge without the secret. The API returns 403 for
  // mothers, and the page redirects to /dashboard on load.

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Mother routes
    "/dashboard/:path*",
    "/pregnancy/:path*",
    "/appointments/:path*",
    "/postpartum/:path*",
    "/childcare/:path*",
    "/community/:path*",
    "/affirmations/:path*",
    "/trusted-help/:path*",
    "/career/:path*",
    "/recovery/:path*",
    "/medical-records/:path*",
    "/profile/:path*",
    "/login",
    "/register",
    // Pro routes
    "/pro/:path*",
    "/pro",
  ],
};