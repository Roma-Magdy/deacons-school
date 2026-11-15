import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Light gate: send visitors without a session cookie to the login page.
// The cookie is verified (and the user re-checked in the database) in the pages themselves.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("session");
  if (!hasSession && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
