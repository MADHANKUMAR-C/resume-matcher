import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Add a custom header to identify requests processed by middleware
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-middleware-processed", "true")

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
}

export const config = {
  matcher: "/api/:path*",
}
