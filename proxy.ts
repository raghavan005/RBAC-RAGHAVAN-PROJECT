import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public pages that don't require authentication
const PUBLIC_PATHS = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public pages and Next.js internals
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Protected pages: redirect to /login if no refresh token cookie
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/members") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/audit-logs");

  if (isProtectedPage) {
    const token = request.cookies.get("refreshToken")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except Next.js static assets and images
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
