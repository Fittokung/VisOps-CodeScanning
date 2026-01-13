"use client";

import useSWR from "swr";
import {
  Loader2,
  Activity,
  ArrowRight,
  X,
  Minus,
  Maximize2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ActiveScanMonitor() {
  const [isMinimized, setIsMinimized] = useState(false);

  // Poll Active Scans ทุก 2 วินาที
  const { data } = useSWR("/api/scan/status/active", fetcher, {
    refreshInterval: 2000,
  });

  const activeScans: ActiveScan[] = data?.activeScans || [];

  // ถ้าไม่มีการ Scan ให้ซ่อนไปเลย
  if (activeScans.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-10 duration-300">
      <div
        className={`bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 ${
          isMinimized ? "w-64" : "w-80"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
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
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 bg-white">
            {activeScans.map((scan) => (
              <Link
                key={scan.id}
                href={scan.pipelineId ? `/scan/${scan.pipelineId}` : "#"}
                className="block px-4 py-3 hover:bg-slate-50 transition group relative overflow-hidden"
              >
                {/* Progress Bar Animation Backdrop */}
                {scan.status === "RUNNING" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-100">
                    <div className="h-full bg-blue-500 animate-progress"></div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex-shrink-0 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">
                        {scan.service?.serviceName || "Unknown Service"}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {scan.status}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
