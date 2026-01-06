import React from "react";
import { ShieldAlert } from "lucide-react";

interface LogsPanelProps {
  logs?: string[];
  isSuccess: boolean;
  totalFindings: number;
  pipelineId?: string;
  scanId: string;
  scanDuration?: string;
}

export const LogsPanel = ({
  logs,
  isSuccess,
  totalFindings,
  pipelineId,
  scanId,
  scanDuration,
}: LogsPanelProps) => {
  return (
    <div className="bg-gray-900 rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
      <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
        <ShieldAlert className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-mono text-gray-300">LOGS</span>
      </div>
      <div className="flex-1 p-4 overflow-auto font-mono text-xs text-gray-300 space-y-1">
        {logs && logs.length > 0 ? (
          logs.slice(-100).map((l, i) => (
            <div key={i} className="break-all">
              {l}
            </div>
          ))
        ) : isSuccess && totalFindings === 0 ? (
          <div className="space-y-1">
            <div>Pipeline: {pipelineId || scanId}</div>
            <div>Status: SUCCESS</div>
            <div className="text-green-400">
              ✅ All security scans completed
            </div>
            <div className="text-green-400">✅ No vulnerabilities detected</div>
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
          <div>Waiting for logs...</div>
        )}
      </div>
    </div>
  );
};
