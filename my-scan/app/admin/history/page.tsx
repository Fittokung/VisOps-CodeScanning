"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Trash2, ExternalLink, UserCircle2, Hash, GitBranch } from "lucide-react";
import Link from "next/link";

type ScanItem = {
  id: string;          // Internal Database ID
  userName: string; 
  status: string;
  projectName: string;
  repoUrl: string;
  imageTag: string;
  vulnCritical: number;
  scanId: string;      // GitLab Project ID (Engine ID - e.g. 55)
  pipelineId: string;  // GitLab Pipeline ID (Run ID - e.g. 1001) - UNIQUE KEY
  createdAt: string;
};

export default function AdminHistoryPage() {
  const [history, setHistory] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/scan/history");
      if (res.ok) {
        const data = await res.json();
        // เรียงลำดับจากใหม่ไปเก่า
        setHistory(data.sort((a: ScanItem, b: ScanItem) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (error) {
      console.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  // ✅ แก้ไข: รับ pipelineId แทน scanId
  const handleDelete = async (pipelineId: string) => {
    if (!confirm(`Confirm DELETE Pipeline ID: ${pipelineId}?`)) return;
    setDeletingId(pipelineId);
    
    try {
      // ส่ง pipelineId ไปที่ API DELETE
      const res = await fetch(`/api/scan/${pipelineId}`, { method: "DELETE" });
      
      if (res.ok) {
        // ลบออกจาก State โดยใช้ pipelineId
        setHistory((prev) => prev.filter((item) => item.pipelineId !== pipelineId));
      } else {
        const err = await res.json();
        alert(`Failed to delete: ${err.error || "Unknown error"}`);
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
             <h1 className="text-2xl font-bold text-slate-800">Admin Console</h1>
             <p className="text-sm text-slate-500">Manage security scans and view user activity.</p>
          </div>
          <button 
            onClick={fetchHistory} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 transition text-sm font-medium"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Pipeline ID</th> {/* เปลี่ยนหัวตาราง */}
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Repo / Tag</th>
                <th className="p-4 font-semibold">Vulns</th>
                <th className="p-4 font-semibold">Time</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {history.map((item) => (
                // ✅ ใช้ pipelineId เป็น key เพราะมันไม่ซ้ำกันแน่นอน
                <tr key={item.pipelineId} className="hover:bg-slate-50 transition-colors">
                  
                  {/* User Column */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <UserCircle2 size={20} />
                        </div>
                        <div>
                            <div className="font-medium text-slate-900">{item.userName || "Anonymous"}</div>
                            <div className="text-xs text-slate-400 font-mono">{item.projectName}</div>
                        </div>
                    </div>
                  </td>

                  {/* Pipeline ID Column (New Identifier) */}
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm text-blue-700 font-bold font-mono">
                            <Hash size={12} /> {item.pipelineId}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                           Engine ID: {item.scanId}
                        </div>
                    </div>
                  </td>

                  {/* Status Column */}
                  <td className="p-4">
                    {item.status === "SUCCESS" && <span className="text-green-700 bg-green-50 px-2 py-1 rounded text-xs border border-green-200 flex w-fit items-center gap-1"><CheckCircle size={12}/> Success</span>}
                    {item.status === "FAILED" && <span className="text-red-700 bg-red-50 px-2 py-1 rounded text-xs border border-red-200 flex w-fit items-center gap-1"><XCircle size={12}/> Failed</span>}
                    {item.status === "BLOCKED" && <span className="text-orange-700 bg-orange-50 px-2 py-1 rounded text-xs border border-orange-200 flex w-fit items-center gap-1"><AlertTriangle size={12}/> Blocked</span>}
                    {(item.status === "PENDING" || item.status === "running") && <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs border border-blue-200 flex w-fit items-center gap-1"><Clock size={12} className="animate-spin"/> Running</span>}
                  </td>
                  
                  {/* Repo Details */}
                  <td className="p-4">
                      <div className="flex items-center gap-1 text-xs font-medium text-slate-700">
                         <GitBranch size={12} className="text-slate-400"/>
                         <span className="max-w-[150px] truncate" title={item.repoUrl}>
                            {item.repoUrl?.replace(/^https?:\/\//, '')}
                         </span>
                      </div>
                      <span className="inline-block bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 mt-1.5 font-mono border border-slate-200">
                         {item.imageTag || "latest"}
                      </span>
                  </td>
                  
                  {/* Vulnerabilities */}
                  <td className="p-4">
                    {item.vulnCritical > 0 ? (
                      <span className="text-red-600 font-bold flex items-center gap-1 bg-red-50 w-fit px-2 py-0.5 rounded-full border border-red-100">
                        <AlertTriangle size={14} /> {item.vulnCritical} Crit
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  
                  {/* Time */}
                  <td className="p-4 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  
                  {/* Actions (ใช้ pipelineId) */}
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    {/* Link ไปหน้า report โดยใช้ pipelineId */}
                    <Link href={`/scan/${item.pipelineId}`} target="_blank" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="View Report">
                        <ExternalLink size={18} />
                    </Link>
                    
                    {/* Delete โดยส่ง pipelineId */}
                    <button 
                        onClick={() => handleDelete(item.pipelineId)} 
                        disabled={deletingId === item.pipelineId} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50" 
                        title="Delete Record"
                    >
                        {deletingId === item.pipelineId ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && history.length === 0 && (
                <tr><td colSpan={7} className="p-10 text-center text-slate-400">No scan history found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}