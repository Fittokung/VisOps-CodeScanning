"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Loader2, 
  ShieldAlert, 
  Download, 
  ExternalLink,
  Search,
  User,       
  Mail,       
  AlertCircle
} from "lucide-react";

// import ScanStatusAlert from "./ScanStatusAlert";
import ConfirmBuildButton from "./ReleaseButton";

// --- Types ---

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type Vulnerability = {
  id: string;
  pkgName: string;
  installedVersion: string;
  fixedVersion?: string;
  severity: Severity;
  title?: string;
  description?: string;
  sourceTool: "Trivy" | "Gitleaks" | "Semgrep";
  author?: string; 
  email?: string;
  commit?: string;
};

type Run = {
  id: string;
  pipelineId: string;
  repoUrl: string;
  status: string;
  step: string;
  progress: number;
  counts: { critical: number; high: number; medium: number; low: number };
  findings: Vulnerability[]; 
  logs?: string[];
  pipelineUrl?: string;
  scanDuration?: string;
  rawReports?: {
      gitleaks?: any;
      semgrep?: any;
      trivy?: any;
  };
};

const SeverityBadge = ({ severity }: { severity: Severity }) => {
  const styles = {
    critical: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-blue-100 text-blue-800 border-blue-200",
    info: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[severity]} uppercase tracking-wide`}>
      {severity}
    </span>
  );
};

const ToolBadge = ({ tool }: { tool: string }) => {
  return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] border border-slate-200 mr-2">{tool}</span>;
};

export default function PipelineView({ scanId }: { scanId: string }) {
  const [run, setRun] = useState<Run | null>(null);
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  async function fetchStatus() {
    try {
      if (!scanId) return;
      // เรียก endpoint ที่ backend เตรียมไว้
      const res = await fetch(`/api/scan/status/${scanId}`);
      if (res.status === 404) return;
      if (!res.ok) return;

      const data = await res.json();
      setRun(data);

    } catch (e) {
      console.error("Polling Error:", e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
        if (run?.status !== "SUCCESS" && run?.status !== "FAILED" && run?.status !== "BLOCKED") {
            fetchStatus();
        }
    }, 3000); 
    return () => clearInterval(interval);
  }, [scanId, run?.status]);

  useEffect(() => { setCurrentPage(1); }, [filter]);

  // Download Handler
  const handleDownload = (reportName: string, data: any) => {
      if (!data) return alert("Report not available");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${reportName}-report.json`;
      link.click();
  };

  const filteredFindings = useMemo(() => {
    if (!run?.findings) return [];
    if (filter === "all") return run.findings;
    return run.findings.filter((f) => f.severity === filter);
  }, [run, filter]);

  const paginatedFindings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFindings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredFindings, currentPage]);

  if (isLoading && !run) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500">Loading Report...</span>
      </div>
    );
  }

  if (!run) return <div className="p-6 text-center text-gray-500">Initializing Scan...</div>;

  const isScanning = run.status === "RUNNING" || run.status === "PENDING";
  const isBlocked = run.status === "BLOCKED"; 

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 font-sans">
      
      {/* <ScanStatusAlert scanId={scanId} /> */}
      
      <ConfirmBuildButton scanId={scanId} />
      
      {/* Header Info */}
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${isBlocked ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">Scan Report</h1>
              <span className={`px-3 py-1 text-xs rounded-full font-medium border flex items-center gap-1
                ${run.status === "RUNNING" ? "bg-blue-50 text-blue-700 border-blue-200" : 
                  run.status === "SUCCESS" ? "bg-green-50 text-green-700 border-green-200" : 
                  isBlocked ? "bg-red-100 text-red-700 border-red-200 font-bold" :
                  "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
                {run.status === "RUNNING" && <Loader2 className="w-3 h-3 animate-spin"/>}
                {run.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">Repo: <span className="font-mono text-gray-700">{run.repoUrl}</span></p>
          </div>

          {/* Download Buttons */}
          {(run.status === "SUCCESS" || isBlocked) && run.rawReports && (
             <div className="flex gap-2">
                {run.rawReports.gitleaks && (
                    <button onClick={() => handleDownload("gitleaks", run.rawReports?.gitleaks)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition">
                        <Download size={14}/> Gitleaks JSON
                    </button>
                )}
                {run.rawReports.semgrep && (
                    <button onClick={() => handleDownload("semgrep", run.rawReports?.semgrep)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition">
                        <Download size={14}/> Semgrep JSON
                    </button>
                )}
             </div>
          )}
        </div>

        {/* Progress Bar */}
        {(isScanning || isBlocked || run.status === "SUCCESS") && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs font-medium text-gray-600 uppercase tracking-wide">
              <span>Status: {run.step}</span>
              <span>{run.progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                 className={`h-full transition-all duration-500 ease-out ${isBlocked ? 'bg-red-600' : 'bg-blue-600'}`} 
                 style={{ width: `${run.progress}%` }} 
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Summary & Logs */}
        <div className="space-y-6 lg:col-span-1">
          {/* Counts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Findings Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                  { label: "Critical", count: run.counts.critical, color: "text-red-600 bg-red-50 border-red-100" },
                  { label: "High", count: run.counts.high, color: "text-orange-600 bg-orange-50 border-orange-100" },
                  { label: "Medium", count: run.counts.medium, color: "text-yellow-600 bg-yellow-50 border-yellow-100" },
                  { label: "Low", count: run.counts.low, color: "text-blue-600 bg-blue-50 border-blue-100" },
              ].map(stat => (
                  <div key={stat.label} className={`p-3 rounded-lg border text-center ${stat.color}`}>
                      <div className="text-2xl font-bold">{stat.count}</div>
                      <div className="text-xs uppercase">{stat.label}</div>
                  </div>
              ))}
            </div>
          </div>
          
          {/* Logs */}
          <div className="bg-gray-900 rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
             <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
                <ShieldAlert className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-mono text-gray-300">LOGS</span>
             </div>
             <div className="flex-1 p-4 overflow-auto font-mono text-xs text-gray-300 space-y-1">
                {(run.logs && run.logs.length > 0) ? run.logs.slice(-100).map((l, i) => <div key={i} className="break-all">{l}</div>) : "No logs."}
             </div>
          </div>
        </div>

        {/* Right: Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full min-h-[500px]">
             <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                   <Search className="w-4 h-4 text-gray-500" />
                   <h3 className="font-semibold text-gray-800">Findings ({filteredFindings.length})</h3>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                   {(["all", "critical", "high", "medium", "low"] as const).map(lvl => (
                      <button key={lvl} onClick={() => setFilter(lvl)} 
                         className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${filter === lvl ? "bg-white shadow-sm" : "text-gray-500"}`}>
                         {lvl}
                      </button>
                   ))}
                </div>
             </div>

             <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                         <th className="p-4 text-xs font-semibold text-gray-500 uppercase w-24">Severity</th>
                         <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Issue / Tool</th>
                         <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Location / Context</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {paginatedFindings.map((item, idx) => (
                         <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 align-top"><SeverityBadge severity={item.severity} /></td>
                            <td className="p-4 align-top">
                               <div className="flex flex-col gap-1">
                                  <div className="font-medium text-gray-900 line-clamp-2">{item.title || item.pkgName}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                     <ToolBadge tool={item.sourceTool || "Unknown"} />
                                  </div>
                               </div>
                            </td>
                            <td className="p-4 align-top text-sm text-gray-600 font-mono">
                               <div className="break-all mb-2 font-medium">{item.pkgName}</div>
                               {item.sourceTool === "Gitleaks" && (item.author || item.email) ? (
                                  <div className="flex flex-col gap-1.5 bg-purple-50 p-2.5 rounded-lg border border-purple-100">
                                     <div className="flex items-center gap-2 text-xs text-purple-800 font-semibold">
                                        <User size={12} /> {item.author || "Unknown User"}
                                     </div>
                                     {item.email && (
                                        <div className="flex items-center gap-2 text-xs text-purple-600">
                                           <Mail size={12} /> {item.email}
                                        </div>
                                     )}
                                  </div>
                               ) : item.installedVersion && (
                                  <span className="text-xs text-gray-400 bg-gray-50 p-1 px-2 rounded">v{item.installedVersion}</span>
                               )}
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}