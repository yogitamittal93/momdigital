import { NextResponse } from "next/server";

// NOTE: This middleware previously gated MOTHER_PROTECTED and /pro routes by
// checking for an `access_token` cookie directly via req.cookies.get(...).
// That check has been removed: the cookie is set by the API on a different
// domain (Railway) than this frontend (momdigital.live), so the browser
// never sends it to requests made to this domain — middleware running here
// could never see it, even for a fully logged-in user. This caused every
// login to bounce back to /login regardless of browser or auth provider.
//
// Auth gating now happens client-side in AppShell (see
// components/layout/app-shell.tsx), which checks the result of a direct
// cross-origin /me request to the API instead. That request works because
// it's a normal credentialed fetch covered by CORS, not a same-origin
// cookie read.
//
// TODO: A same-origin reverse proxy (API and frontend served from the same
// registrable domain) would let the cookie be visible here again, restoring
// the security benefit of server-side gating. Plain Next.js `rewrites()`
// can't do this — it drops Set-Cookie headers from proxied responses — so
// this needs real middleware-based proxying. Tracked for later.

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};