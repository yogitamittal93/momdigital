import { NextResponse, NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const url = req.nextUrl.pathname;
  const isAuthPage = url.startsWith("/login") || url.startsWith("/register");
  const isProtectedPage = [
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
  ].some((path) => url.startsWith(path));

  if (!token && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
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
  ],
};