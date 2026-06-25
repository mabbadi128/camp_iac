import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const adminAuth = request.cookies.get("quiz_admin_auth")?.value;

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (adminAuth !== "true") {
      return NextResponse.redirect(new URL("/admin-login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};