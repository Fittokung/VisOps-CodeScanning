"use client";
import React from "react";
import { ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";

interface LogsPanelProps {
  logs?: string[];
  scanLogs?: Array<{ status: string; timestamp: string; message: string }>; // [NEW]
  isSuccess: boolean;
  totalFindings: number;
  pipelineId?: string;
  scanId: string;
  scanDuration?: string;
}

export const LogsPanel = ({
  logs,
  scanLogs,
  isSuccess,
  totalFindings,
  pipelineId,
  scanId,
  scanDuration,
}: LogsPanelProps) => {
  // Determine effective logs to show
  const hasRawLogs = logs && logs.length > 0;
  const hasScanLogs = scanLogs && scanLogs.length > 0;

  return (
    <div className="bg-gray-900 rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
      <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
        <ShieldAlert className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-mono text-gray-300">
          LOGS {hasRawLogs ? "(Raw)" : hasScanLogs ? "(Timeline)" : ""}
        </span>
      </div>
      <div className="flex-1 p-4 overflow-auto font-mono text-xs text-gray-300 space-y-1">
        {hasRawLogs ? (
          logs!.slice(-100).map((l, i) => (
            <div key={i} className="break-all">
              {l}
            </div>
          ))
        ) : hasScanLogs ? (
           // Fallback: Show timeline logs if raw logs are missing
           scanLogs!.map((l, i) => (
             <div key={i} className="flex gap-2 border-b border-gray-800 pb-1 mb-1 last:border-0">
                <span className="text-gray-500 w-32 shrink-0">{new Date(l.timestamp).toLocaleTimeString()}</span>
                <span className={`font-bold ${
                    l.status === 'SUCCESS' ? 'text-emerald-400' : 
                    l.status === 'FAILED' ? 'text-red-400' : 
                    'text-blue-400'
                }`}>[{l.status}]</span>
                <span>{l.message || ''}</span>
             </div>
           ))
        ) : isSuccess && totalFindings === 0 ? (
          <div className="space-y-2">
            <div>Pipeline: {pipelineId || scanId}</div>
            <div>Status: SUCCESS</div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 size={14} />
              <span>All security scans completed</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 size={14} />
              <span>No vulnerabilities detected</span>
            </div>
            <div>Duration: {scanDuration || "N/A"}</div>
          </div>
        ) : isSuccess ? (
          <div className="space-y-1">
            <div>Pipeline: {pipelineId || scanId}</div>
            <div>Status: SUCCESS</div>
            <div>Total findings: {totalFindings}</div>
            <div>Duration: {scanDuration || "N/A"}</div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Waiting for logs...</span>
          </div>
        )}
      </div>
    </div>
  );
};
