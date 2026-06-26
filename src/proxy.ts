import { NextResponse, type NextRequest } from "next/server"
import { ADMIN_SESSION_COOKIE } from "@/server/auth/constants"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLoginPage = pathname === "/admin/login"
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/")

  if (!isAdminPath || isLoginPage) {
    return NextResponse.next()
  }

  const hasSessionCookie = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE))

  if (!hasSessionCookie) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/admin/login"
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
