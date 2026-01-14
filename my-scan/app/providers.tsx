// app/providers.tsx
"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

function IdleTimeoutHandler({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only set timeout if user is authenticated
    if (status === "authenticated") {
      timeoutRef.current = setTimeout(async () => {
        // Check if there are active scans before logging out
        try {
          const response = await fetch("/api/scan/status/active");
          const data = await response.json();

          if (data.hasActiveScans) {
            // Extend session if there are active scans
            console.log("Active scans detected, extending session...");
            resetTimeout();
            return;
          }
        } catch (error) {
          console.error("Failed to check active scans:", error);
        }

        // Log out user due to inactivity
        console.log("Session timeout due to inactivity");
        signOut({ callbackUrl: "/login?reason=timeout" });
      }, IDLE_TIMEOUT_MS);
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    // Events that indicate user activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      // Throttle activity detection to every 30 seconds
      if (Date.now() - lastActivityRef.current > 30000) {
        resetTimeout();
      }
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timeout setup
    resetTimeout();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [status, resetTimeout]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <IdleTimeoutHandler>
        <Navbar />
        <main>{children}</main>
      </IdleTimeoutHandler>
    </SessionProvider>
  );
}
