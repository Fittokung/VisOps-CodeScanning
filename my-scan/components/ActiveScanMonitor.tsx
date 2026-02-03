"use client";

import useSWR, { mutate } from "swr";
import {
  Loader2,
  Activity,
  ArrowRight,
  X,
  Minus,
  Maximize2,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

// Types
interface ActiveScan {
  id: string;
  pipelineId: string | null;
  status: string;
  service?: {
    serviceName: string;
    imageName: string;
  };
  startedAt: string;
}

const fetcher = (url: string) => 
  fetch(url).then((res) => {
    // ถ้าได้ 401 (Unauthorized) ให้ return null แทนที่จะ throw error
    if (res.status === 401) {
      return { activeScans: [] };
    }
    return res.json();
  });

export default function ActiveScanMonitor() {
  const [isMinimized, setIsMinimized] = useState(false);
  const lastSyncRef = useRef<number>(0);

  // Poll Active Scans ทุก 2 วินาที
  const { data, error } = useSWR("/api/scan/status/active", fetcher, {
    refreshInterval: 2000,
    // หยุด polling ถ้าเจอ error (เช่น user ยังไม่ login)
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const activeScans: ActiveScan[] = data?.activeScans || [];

  // ✅ Auto-sync: เรียก POST /api/scan/[id] เพื่อ sync สถานะจาก GitLab
  useEffect(() => {
    if (activeScans.length === 0) return;
    
    // Throttle: sync ทุก 3 วินาที
    const now = Date.now();
    if (now - lastSyncRef.current < 3000) return;
    lastSyncRef.current = now;

    // Sync แต่ละ scan via /sync endpoint
    activeScans.forEach(async (scan) => {
      try {
        await fetch(`/api/scan/${scan.id}/sync`, { method: "POST" });
      } catch (e) {
        // Ignore errors
      }
    });

    // Refresh active scans list และ dashboard หลัง sync
    setTimeout(() => {
      mutate("/api/scan/status/active");
      mutate("/api/dashboard");
    }, 1000);
  }, [activeScans]);

  // ถ้ามี error หรือไม่มี data ให้ซ่อนไปเลย
  if (error) return null;

  // ถ้าไม่มีการ Scan ให้ซ่อนไปเลย
  if (activeScans.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-10 duration-300">
      <div
        className={`bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 ${
          isMinimized ? "w-64" : "w-80"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="font-semibold text-sm">
              Processing ({activeScans.length})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-blue-100 hover:text-white p-1 hover:bg-white/10 rounded transition"
            >
              {isMinimized ? <Maximize2 size={14} /> : <Minus size={14} />}
            </button>
          </div>
        </div>

        {/* Body */}
        {!isMinimized && (
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {activeScans.map((scan) => (
              <Link
                key={scan.id}
                href={scan.pipelineId ? `/scan/${scan.pipelineId}` : "#"}
                className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition group relative overflow-hidden"
              >
                {/* Progress Bar Animation Backdrop */}
                {scan.status === "RUNNING" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-100 dark:bg-blue-900/30">
                    <div className="h-full bg-blue-500 dark:bg-blue-400 animate-progress"></div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex-shrink-0 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">
                        {scan.service?.serviceName || "Unknown Service"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {scan.status}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
