import { NextRequest, NextResponse } from "next/server";

/**
 * Routes that require a logged-in session.
 * Guests hitting these get redirected to /login?next=<original-path>
 */
const PROTECTED_PREFIXES = [
  "/upload",
  "/roadtrips",
  "/home",
  "/profile/edit",
  "/settings",
];

/** Exact paths that are also protected */
const PROTECTED_EXACT = new Set(["/home"]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected =
    PROTECTED_EXACT.has(pathname) ||
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  // Session cookie set by your login API
  const session = req.cookies.get("pv_session")?.value;

  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static, _next/image (Next.js internals)
     * - favicon, public assets
     * - API routes (those handle auth themselves)
     */
    "/((?!_next/static|_next/image|favicon|api/).*)",
  ],
};
