import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isPending =
      token?.status === "PENDING" || token?.status === "REJECTED";
    const isApprovePage = req.nextUrl.pathname.startsWith("/pending");
    const isAdminPage = req.nextUrl.pathname.startsWith("/admin");

    // 1. ถ้าสถานะไม่ผ่าน (Pending/Rejected) และพยายามเข้าหน้าอื่นที่ไม่ใช่ /pending
    if (isPending && !isApprovePage) {
      return NextResponse.redirect(new URL("/pending", req.url));
    }

    // 2. ถ้าสถานะผ่านแล้ว แต่ยังพยายามเข้าหน้า /pending ให้ส่งไป Dashboard
    if (!isPending && isApprovePage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // 3. ป้องกัน User ทั่วไปเข้าหน้า Admin
    if (isAdminPage && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // ตรวจสอบว่ามี Token ไหม (ถ้าไม่มีจะเด้งไปหน้า Login อัตโนมัติ)
      authorized: ({ token }) => !!token,
    },
  }
);

// กำหนด Path ที่ต้องการให้ Middleware ทำงาน (ครอบคลุมทุกหน้าที่ต้อง Login)
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/setup/:path*",
    "/scan/:path*",
    "/settings/:path*",
    "/pending",
  ],
};
