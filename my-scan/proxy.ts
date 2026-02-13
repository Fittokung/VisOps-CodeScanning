// proxy.ts
// Authentication and authorization proxy using NextAuth

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserStatus, UserRoles } from "./lib/constants";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    
    // Status Checks
    const isPending = token?.status === UserStatus.PENDING;
    const isRejected = token?.status === UserStatus.REJECTED;
    
    const isPendingPage = pathname === "/pending";
    const isBannedPage = pathname === "/banned";
    const isAdminPage = pathname.startsWith("/admin");
    const isAdminLoginPage = pathname === "/admin/login";

    // 0. Admin Login Page Logic
    // If logged in as ADMIN, redirect to dashboard (don't show login page)
    if (isAdminLoginPage && token && token.role === UserRoles.ADMIN) {
         return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    // If accessing admin login page, allow it (logic handled by page or Authorized callback)
    if (isAdminLoginPage) {
        return NextResponse.next();
    }
    
    // 1. Rejected Users -> /banned
    if (isRejected && !isBannedPage) {
      return NextResponse.redirect(new URL("/banned", req.url));
    }
    if (!isRejected && isBannedPage) {
        // Active users shouldn't be on /banned
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // 2. Pending Users -> /pending
    if (isPending && !isPendingPage && !isBannedPage) {
      // Allow them to see /banned if they get rejected, but mainly /pending
      return NextResponse.redirect(new URL("/pending", req.url));
    }
    if (!isPending && isPendingPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    // 3. Admin Routes Protection
    if (isAdminPage && token?.role !== UserRoles.ADMIN) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to admin login page without token
        if (req.nextUrl.pathname === "/admin/login") {
            return true;
        }
        // Require token for everything else in matcher
        return !!token;
      },
    },
    pages: {
        signIn: "/login",
    }
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
    "/banned",
  ],
};
