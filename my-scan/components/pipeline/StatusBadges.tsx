import React from "react";
import { Loader2, XCircle } from "lucide-react";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export const SeverityBadge = ({ severity }: { severity: Severity }) => {
  const styles = {
    critical: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-blue-100 text-blue-800 border-blue-200",
    info: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[severity]} uppercase tracking-wide`}
    >
      {severity}
    </span>
  );
};

export const ToolBadge = ({ tool }: { tool: string }) => {
  return (
    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] border border-slate-200 mr-2">
      {tool}
    </span>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  const isCancelled = status === "CANCELLED" || status === "CANCELED";
  const isRunning = status === "RUNNING";
  const isSuccess = status === "SUCCESS";
  const isBlocked = status === "BLOCKED";

  return (
    <span
      className={`px-3 py-1 text-xs rounded-full font-medium border flex items-center gap-1
        ${
          isRunning
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : isSuccess
            ? "bg-green-50 text-green-700 border-green-200"
            : isCancelled
            ? "bg-gray-100 text-gray-700 border-gray-300"
            : isBlocked || status.includes("FAILED")
            ? "bg-red-50 text-red-700 border-red-200 font-bold"
            : "bg-yellow-50 text-yellow-700 border-yellow-200"
        }`}
    >
      {isRunning && <Loader2 className="w-3 h-3 animate-spin" />}
      {isCancelled && <XCircle className="w-3 h-3" />}
      {(isBlocked || status.includes("FAILED")) && <XCircle className="w-3 h-3" />}
      {status}
    </span>
  );
};

export const ScanModeBadge = ({ mode }: { mode?: string }) => {
  // Normalize mode string
  const normalizedMode = mode?.toUpperCase() || "SCAN_ONLY";
  const isScanAndBuild = normalizedMode === "SCAN_AND_BUILD" || normalizedMode === "BUILD_AND_SCAN";

  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border whitespace-nowrap ${
        isScanAndBuild
          ? "bg-blue-100 text-blue-700 border-blue-200"
          : "bg-purple-100 text-purple-700 border-purple-200"
      }`}
    >
      {isScanAndBuild ? "Scan & Build" : "Scan Only"}
    </span>
  );
};
