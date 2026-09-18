import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function sanitizeRedirectPath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return "/profile";
  }
  return path;
}

export async function middleware(request: NextRequest) {
  // Update Supabase session tokens
  const response = await updateSession(request);

  const path = request.nextUrl.pathname;

  // Protect sensitive web routes: /vendor, /admin, /profile
  if (path.startsWith("/vendor") || path.startsWith("/admin") || path.startsWith("/profile")) {
    const allCookies = request.cookies.getAll();
    const hasAuthSession = allCookies.some(
      (c) => (c.name.startsWith("sb-") && c.name.includes("-auth-token")) || c.name === "sb_auth_token"
    );

    if (!hasAuthSession) {
      const sanitized = sanitizeRedirectPath(path);
      return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(sanitized)}`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
