"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X, Loader2, Tag, Box } from "lucide-react";

type Props = {
  buildMode: boolean;
};

// Type ของ Project ที่ Backend ส่งมาให้ (สำหรับ Modal)
type ProjectItem = {
  id: number;
  name: string;
  webUrl: string;
  createdAt: string;
};

export default function FormScan({ buildMode }: Props) {
  const router = useRouter();

  // --- State หลัก ---
  const [repoUrl, setRepoUrl] = useState("");
  const [dockerUser, setDockerUser] = useState("");
  const [dockerToken, setDockerToken] = useState("");
  
  // --- State ใหม่ (เพิ่มส่วนนี้) ---
  const [projectName, setProjectName] = useState(""); 
  const [imageTag, setImageTag] = useState("latest");

  const [loading, setLoading] = useState(false);
  
  // --- State สำหรับ Modal แจ้งเตือน Limit ---
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitProjects, setLimitProjects] = useState<ProjectItem[]>([]);
  const [limitMessage, setLimitMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Auto-detect Project Name จาก URL
  useEffect(() => {
    if (!repoUrl) {
      setProjectName("");
      return;
    }
    try {
      const parts = repoUrl.trim().split("/");
      let name = parts[parts.length - 1];
      if (name.endsWith(".git")) {
        name = name.replace(".git", "");
      }
      setProjectName(name || "scanned-project");
    } catch (e) {
      setProjectName("scanned-project");
    }
  }, [repoUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const cleanTag = imageTag.trim() || "latest";

    // Prepare Payload
    const payload: any = {
      repoUrl,
      buildAfterScan: buildMode,
      // ส่งค่าใหม่ไป Backend
      projectName: projectName,
      imageTag: cleanTag
    };

    if (buildMode) {
      payload.dockerUsername = dockerUser;
      payload.dockerAccessToken = dockerToken;
    }

    try {
      const res = await fetch("/api/scan/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json();
      setLoading(false);

      if (res.ok && j.scanId) {
        // สำเร็จ: ไปหน้า Pipeline
        router.push(`/scan/${j.scanId}`);
      } else if (res.status === 403 && j.error === "LIMIT_REACHED") {
        // กรณีโควตาเต็ม: เปิด Modal
        setLimitMessage(j.message);
        setLimitProjects(j.projects || []);
        setShowLimitModal(true);
      } else {
        alert("Failed to start scan: " + (j.message || j.error));
      }
    } catch (err) {
      setLoading(false);
      alert("Network error. Please try again.");
    }
  }

  // ฟังก์ชันสั่งลบโปรเจกต์ (Logic เดิมของคุณ)
  async function handleDelete(id: number) {
    if (!confirm("Confirm deletion of this project?")) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/scan/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setLimitProjects((prev) => prev.filter((p) => p.id !== id));
      } else {
        const j = await res.json();
        alert("Delete failed: " + j.error);
      }
    } catch (e) {
      alert("Network error during delete");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {/* --- ฟอร์มหลัก --- */}
      <form onSubmit={onSubmit} className="max-w-xl mx-auto p-4 space-y-5">
        
        {/* 1. Repo URL & Project Name */}
        <div>
          <label className="block mb-1.5 font-medium text-slate-700">Git Repository URL</label>
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            required
            className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          {projectName && (
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
               <Box size={14} className="text-blue-500"/>
               <span>Project Name: <strong>{projectName}</strong></span>
            </div>
          )}
        </div>

        {buildMode && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
             <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Target Image Preview</p>
                <p className="font-mono text-sm text-blue-900 break-all">
                   index.docker.io/{dockerUser || "<user>"}/{projectName || "<project>"}:{imageTag || "latest"}
                </p>
             </div>

            {/* Docker Creds */}
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                    <label className="block mb-1.5 font-medium text-slate-700">Docker Username</label>
                    <input
                        value={dockerUser}
                        onChange={(e) => setDockerUser(e.target.value)}
                        placeholder="dockerhub user"
                        required
                        className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <label className="block mb-1.5 font-medium text-slate-700">Docker Access Token</label>
                    <input
                        value={dockerToken}
                        onChange={(e) => setDockerToken(e.target.value)}
                        placeholder="secret token"
                        required
                        type="password"
                        className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Tag Input (New) */}
            <div>
              <label className="block mb-1.5 font-medium text-slate-700 flex items-center gap-2">
                 <Tag size={16} /> Target Image Tag
              </label>
              <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={imageTag}
                    onChange={(e) => setImageTag(e.target.value)}
                    placeholder="latest"
                    className="flex-1 border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-2 rounded border">Default: latest</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 pl-1">
                * If critical vulnerabilities are found, <code>-warning</code> will be appended automatically.
              </p>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button 
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-md hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all font-medium"
          >
            {loading ? (
               <>
                 <Loader2 className="animate-spin" size={20} /> Starting Pipeline...
               </>
            ) : (
               "Start Security Scan"
            )}
          </button>
        </div>
      </form>

      {/* --- Modal แจ้งเตือน Limit Reached (เหมือนเดิม) --- */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[80vh]">
            
            {/* Header */}
            <div className="bg-amber-50 p-4 border-b border-amber-100 flex justify-between items-start">
              <div className="flex gap-3">
                <div className="bg-amber-100 p-2 rounded-full text-amber-600 mt-1">
                   <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Limit Reached</h3>
                  <p className="text-sm text-slate-600 mt-1">{limitMessage}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLimitModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* List รายการโปรเจกต์ */}
            <div className="p-0 overflow-y-auto flex-1">
                {limitProjects.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                        <div className="text-green-500 mb-2">✓ Available</div>
                        <p>You have cleared enough space!</p>
                        <p className="text-xs">Close this window and click Start Scan again.</p>
                    </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                        <th className="px-4 py-3">Project Name</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {limitProjects.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-medium text-slate-700 truncate max-w-[150px]" title={p.name}>
                            {p.name}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={deletingId === p.id}
                              className="text-red-500 hover:bg-red-50 p-2 rounded-full transition disabled:opacity-50"
                              title="Delete this project"
                            >
                              {deletingId === p.id ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowLimitModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium text-sm"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}