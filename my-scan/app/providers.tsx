// app/providers.tsx
"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Logic เดิม: Timeout & Active Scan check
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (status === "authenticated") {
      timeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch("/api/scan/status/active");
          const data = await response.json();
          if (data.hasActiveScans) {
            resetTimeout();
            return;
          }
        } catch (error) {
          console.error("Failed check", error);
        }
        signOut({ callbackUrl: "/login?reason=timeout" });
      }, IDLE_TIMEOUT_MS);
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];
    const handleActivity = () => {
      if (Date.now() - lastActivityRef.current > 30000) resetTimeout();
    };
    events.forEach((event) =>
      document.addEventListener(event, handleActivity, { passive: true })
    );
    resetTimeout();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) =>
        document.removeEventListener(event, handleActivity)
      );
    };
  }, [status, resetTimeout]);

  // --- Layout Logic ---

  // หน้าที่ไม่แสดง Layout หลัก (Login, Setup, Landing Page for guests)
  const isPublicOrAuthPage =
    pathname === "/login" ||
    pathname === "/setup" ||
    pathname === "/pending" ||
    (pathname === "/" && status === "unauthenticated");

  if (status === "loading") return null; // หรือใส่ Loading Spinner ตรงนี้

  // Case 1: หน้า Public หรือยังไม่ Login -> แสดงเต็มจอปกติ
  if (isPublicOrAuthPage || !session) {
    return <>{children}</>;
  }

  // Case 2: Authenticated User -> แสดง Sidebar + Navbar Layout
  const user = session.user as any;
  const isAdmin = user?.role?.toLowerCase() === "admin";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden">
      {/* 1. Left Sidebar */}
      <Sidebar isAdmin={isAdmin} />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar (User Profile Only) */}
        <Navbar />

        {/* Page Content */}
        <main
          className={`flex-1 ${
            pathname?.startsWith("/docs")
              ? "overflow-hidden p-0"
              : "overflow-y-auto p-4 sm:p-6 lg:p-8"
          }`}
        >
          {/* ✅ แก้ไขตรงนี้: ลบ max-w-7xl mx-auto ออก ใช้ w-full แทน */}
          <div className="w-full max-w-full h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

import { ThemeProvider } from "@/components/ThemeProvider";

// ... existing imports

import { TourProvider } from "@/components/providers/TourProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TourProvider>
          <AppLayout>{children}</AppLayout>
        </TourProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
