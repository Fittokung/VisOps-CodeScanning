// proxy.ts
// Authentication and authorization proxy using NextAuth

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserStatus, UserRoles } from "./lib/constants";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    
    // Check user status (PENDING or REJECTED = blocked)
    const isBlocked = token?.status === UserStatus.PENDING || token?.status === UserStatus.REJECTED;
    const isPendingPage = pathname.startsWith("/pending");
    const isAdminPage = pathname.startsWith("/admin");
    
    // 1. Blocked users can only access /pending page
    if (isBlocked && !isPendingPage) {
      return NextResponse.redirect(new URL("/pending", req.url));
    }
    
    // 2. Approved users shouldn't be on /pending page
    if (!isBlocked && isPendingPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    // 3. Only admins can access /admin pages
    if (isAdminPage && token?.role !== UserRoles.ADMIN) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      // Verify token exists (redirects to login if not)
      authorized: ({ token }) => !!token,
    },
  }
);

// Define protected routes that require authentication
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/setup/:path*",
    "/scan/:path*",
    "/settings/:path*",
    "/services/:path*",
    "/pending",
  ],
};
