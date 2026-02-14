import React from "react";
import { Download, GitBranch, AlertCircle, CheckCircle2, Clock } from "lucide-react";
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
      className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-6 ${
        isBlocked ? "border-red-300 dark:border-red-900 ring-2 ring-red-100 dark:ring-red-900/20" : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Scan Report</h1>
            <StatusBadge status={status} />
            <ScanModeBadge mode={scanMode} />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <GitBranch size={14} />
            <span className="font-mono text-slate-700 dark:text-slate-300">{repoUrl}</span>
          </div>
        </div>

        {/* Download Buttons */}
        {(isSuccess || isBlocked) && rawReports && (
          <div className="flex gap-2">
            {rawReports.gitleaks && (
              <button
                onClick={() => onDownload("gitleaks", rawReports.gitleaks)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition"
              >
                <Download size={14} /> Gitleaks
              </button>
            )}
            {rawReports.semgrep && (
              <button
                onClick={() => onDownload("semgrep", rawReports.semgrep)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition"
              >
                <Download size={14} /> Semgrep
              </button>
            )}
            {rawReports.trivy && (
              <button
                onClick={() => onDownload("trivy", rawReports.trivy)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
              >
                <Download size={14} /> Trivy
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar (Legacy - kept if needed, but styled cleanly) */}
      {(isScanning || isBlocked) && (
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <span className="flex items-center gap-1.5">
               {isBlocked ? <AlertCircle size={12} className="text-red-500" /> : <Clock size={12} className="text-blue-500" />}
               {step}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out ${
                isBlocked ? "bg-red-500" : "bg-blue-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
