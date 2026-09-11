import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, isStaff, verifySession } from "@/lib/session";

const RESIDENT_PATHS = ["/dashboard"];
const STAFF_PATHS = ["/admin"];
const GUEST_ONLY_PATHS = ["/login", "/register"];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  const needsResident = RESIDENT_PATHS.some((p) => pathname.startsWith(p));
  const needsStaff = STAFF_PATHS.some((p) => pathname.startsWith(p));

  if ((needsResident || needsStaff) && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (needsStaff && session && !isStaff(session.role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (session && GUEST_ONLY_PATHS.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = isStaff(session.role) ? "/admin" : "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
