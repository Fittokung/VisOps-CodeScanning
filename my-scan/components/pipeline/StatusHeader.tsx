import React from "react";
import { Download } from "lucide-react";
import { StatusBadge, ScanModeBadge } from "./StatusBadges";

interface StatusHeaderProps {
  status: string;
  repoUrl: string;
  step: string;
  progress: number;
  isBlocked: boolean;
  scanMode?: string;
  rawReports?: {
    gitleaks?: any;
    semgrep?: any;
    trivy?: any;
  };
  onDownload: (reportName: string, data: any) => void;
}

export const StatusHeader = ({
  status,
  repoUrl,
  step,
  progress,
  isBlocked,
  scanMode,
  rawReports,
  onDownload,
}: StatusHeaderProps) => {
  const isScanning = status === "RUNNING" || status === "PENDING";
  const isSuccess = status === "SUCCESS";

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-6 ${
        isBlocked ? "border-red-300 ring-2 ring-red-100" : "border-gray-200"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gray-900">Scan Report</h1>
            <StatusBadge status={status} />
            <ScanModeBadge mode={scanMode} />
          </div>
          <p className="text-sm text-gray-500">
            Repo: <span className="font-mono text-gray-700">{repoUrl}</span>
          </p>
        </div>

        {/* Download Buttons */}
        {(isSuccess || isBlocked) && rawReports && (
          <div className="flex gap-2">
            {rawReports.gitleaks && (
              <button
                onClick={() => onDownload("gitleaks", rawReports.gitleaks)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition"
              >
                <Download size={14} /> Gitleaks JSON
              </button>
            )}
            {rawReports.semgrep && (
              <button
                onClick={() => onDownload("semgrep", rawReports.semgrep)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition"
              >
                <Download size={14} /> Semgrep JSON
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {(isScanning || isBlocked || isSuccess) && (
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-xs font-medium text-gray-600 uppercase tracking-wide">
            <span>Status: {step}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out ${
                isBlocked ? "bg-red-600" : "bg-blue-600"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
