// app/dashboard/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import {
  Loader2,
  Trash2,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Shield,
  Package,
  ExternalLink,
  Eye,
  Folder,
  Plus,
  Server,
  GitBranch,
  MoreHorizontal,
  Play,
  Tag,
  X,
} from "lucide-react";
import AddServiceDialog from "@/components/AddServiceDialog";
import Tooltip from "@/components/ui/Tooltip";

// --- Types ---
interface Project {
  id: string;
  groupName: string;
  repoUrl: string;
  isActive: boolean;
  services: Service[];
  createdAt: string;
}

interface Service {
  id: string;
  serviceName: string;
  imageName: string;
  contextPath: string;
  scans: ScanHistory[];
}

interface ScanHistory {
  id: string;
  pipelineId: string | null;
  status: string;
  scanMode: string; // "SCAN_ONLY" | "SCAN_AND_BUILD"
  imageTag: string;
  vulnCritical: number;
  vulnHigh: number;
  vulnMedium: number;
  vulnLow: number;
  startedAt: string;
  completedAt: string | null;
}

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

// --- Fetcher ---
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to fetch data");
  }
  return res.json();
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // --- State ---
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [scanningService, setScanningService] = useState<string | null>(null);

  // ✅ Store lastScanMode
  const [showRescanModal, setShowRescanModal] = useState<{
    serviceId: string;
    serviceName: string;
    lastScanMode: string; // "SCAN_ONLY" or "SCAN_AND_BUILD"
  } | null>(null);

  const [rescanTag, setRescanTag] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [editingProject, setEditingProject] = useState<{
    id: string;
    groupName: string;
    repoUrl: string;
  } | null>(null);

  const prevActiveScanIds = useRef<Set<string>>(new Set());

  // --- Data Fetching ---
  const { data: activeScansData } = useSWR(
    status === "authenticated" ? "/api/scan/status/active" : null,
    fetcher,
    { refreshInterval: 2000 },
  );

  const { data: dashboardData, isLoading: dashboardLoading } = useSWR(
    status === "authenticated" ? "/api/dashboard" : null,
    fetcher,
    { refreshInterval: 10000, revalidateOnFocus: true },
  );

  const projects: Project[] = dashboardData?.projects || [];
  const activeScans: ActiveScan[] = activeScansData?.activeScans || [];

  // --- Logic: Smart Refresh ---
  useEffect(() => {
    if (!activeScansData) return;

    // ✅ FIX: Explicitly cast to Set<string>
    const currentIds = new Set<string>(
      activeScans.map((s: ActiveScan) => s.id),
    );
    const prevIds = prevActiveScanIds.current;

    let hasChanged = false;
    if (currentIds.size !== prevIds.size) hasChanged = true;
    else {
      for (const id of currentIds) {
        if (!prevIds.has(id)) {
          hasChanged = true;
          break;
        }
      }
    }

    if (hasChanged) {
      mutate("/api/dashboard");
    }
    prevActiveScanIds.current = currentIds;
  }, [activeScansData, activeScans]);

  // --- Auth Redirect ---
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // --- Helpers ---
  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- Handlers ---
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    setDeletingProject(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        // เพิ่ม headers และ body ตรงนี้
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceStop: true }),
      });

      if (res.ok) {
        showToast("Project deleted", "success");
        mutate("/api/dashboard");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error deleting project", "error");
    } finally {
      setDeletingProject(null);
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    try {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName: editingProject.groupName,
          repoUrl: editingProject.repoUrl,
        }),
      });
      if (res.ok) {
        showToast("Project updated", "success");
        setEditingProject(null);
        mutate("/api/dashboard");
      } else {
        showToast("Failed to update", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error updating", "error");
    }
  };

  // ✅ Unified Rescan Handler
  const handleStartRescan = async () => {
    if (!showRescanModal) return;

    setScanningService(showRescanModal.serviceId);
    try {
      const res = await fetch("/api/scan/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: showRescanModal.serviceId,
          scanMode: showRescanModal.lastScanMode,
          imageTag: rescanTag || "latest",
        }),
      });

      // ✅ เพิ่มบรรทัดนี้: อ่านข้อมูล JSON จาก Response
      const data = await res.json();

      if (res.ok) {
        showToast("Scan started", "success");
        setShowRescanModal(null);
        setRescanTag("");
        mutate("/api/scan/status/active");

        // ✅ เพิ่มบรรทัดนี้: สั่ง Redirect ไปหน้าผลลัพธ์ทันที!
        if (data.scanId) {
          router.push(`/scan/${data.scanId}`);
        }
      } else {
        showToast("Failed to start scan", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error starting scan", "error");
    } finally {
      setScanningService(null);
    }
  };

  // --- Loading State ---
  if (status === "loading" || (dashboardLoading && !dashboardData)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse w-full">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden h-80"
          >
            <div className="h-24 bg-slate-200"></div>
            <div className="p-5 space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
              <div className="h-20 bg-slate-50 rounded mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                : "bg-red-50 border-red-100 text-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            {toast.message}
          </div>
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Overview of your security posture
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Server size={16} className="text-slate-500" />
            <span className="hidden sm:inline">Services</span>
          </Link>
          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <Tooltip content="Only scan code for secrets/vulns">
              <Link
                href="/scan/scanonly"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
              >
                <Shield
                  size={16}
                  className="text-slate-500 group-hover:text-slate-700"
                />
                <span className="hidden sm:inline">Scan Only</span>
                <span className="sm:hidden">Scan</span>
              </Link>
            </Tooltip>
            <Tooltip content="Full pipeline: Scan code > Build Image > Scan Image">
              <Link
                href="/scan/build"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 shadow-sm transition-all hover:shadow-md active:scale-95"
              >
                <Package size={16} />
                <span>Scan & Build</span>
              </Link>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border-2 border-dashed border-gray-300 rounded-2xl text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <Folder size={40} className="text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Projects Found
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Get started by creating your first project to scan and analyze your
            code security.
          </p>
          <Link
            href="/scan/build"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={18} /> Create New Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
          <div
            className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center justify-center min-h-[350px] cursor-pointer group"
            onClick={() => router.push("/scan/build")}
          >
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-700 text-lg">
              New Project
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Start a new scan pipeline
            </p>
          </div>

          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col group h-full"
            >
              <div className="px-5 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-800 to-slate-900 relative rounded-t-xl">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 pr-8">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className="font-bold text-white truncate text-lg tracking-tight"
                        title={project.groupName}
                      >
                        {project.groupName}
                      </h3>
                      {(() => {
                        // Find the most recent scan across all services
                        const allScans = project.services.flatMap(s => s.scans);
                        const latestScan = allScans.length > 0 ? allScans[0] : null;
                        
                        if (latestScan) {
                          return latestScan.scanMode === "SCAN_ONLY" ? (
                            <span className="text-[10px] font-bold bg-purple-600/90 text-white px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                              <Shield size={10} /> Scan
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-blue-600/90 text-white px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                              <Package size={10} /> Scan & Build
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400 font-mono bg-black/20 inline-block px-2 py-0.5 rounded">
                      <GitBranch size={12} />{" "}
                      <span className="truncate max-w-[200px]">
                        {project.repoUrl.replace("https://github.com/", "")}
                      </span>
                    </div>
                  </div>
                  <Tooltip content="Edit Project Settings">
                    <button
                      onClick={() =>
                        setEditingProject({
                          id: project.id,
                          groupName: project.groupName,
                          repoUrl: project.repoUrl,
                        })
                      }
                      className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-[10px] font-semibold bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full border border-slate-600">
                    {project.services.length} Service
                    {project.services.length !== 1 ? "s" : ""}
                  </span>
                  {project.services.some((s) =>
                    s.scans.some((sc) =>
                      ["RUNNING", "QUEUED"].includes(sc.status),
                    ),
                  ) && (
                    <span className="text-[10px] font-semibold bg-blue-600/90 text-white px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <Loader2 size={10} className="animate-spin" /> Active
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 p-5 space-y-3 bg-white">
                {project.services.length === 0 ? (
                  <div className="text-center py-10 h-full flex flex-col justify-center items-center">
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                      <Server className="text-slate-300" size={20} />
                    </div>
                    <p className="text-sm text-slate-400 italic mb-3">
                      No services configured
                    </p>
                    <div className="scale-90 origin-top">
                      <AddServiceDialog
                        groupId={project.id}
                        repoUrl={project.repoUrl}
                      />
                    </div>
                  </div>
                ) : (
                  project.services.slice(0, 3).map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors group/item"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-700 truncate">
                            {service.serviceName}
                          </p>
                          {service.scans[0] && (
                            <Tooltip
                              content={`Status: ${service.scans[0].status}`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full flex-shrink-0 cursor-help ${
                                  service.scans[0].status === "SUCCESS"
                                    ? "bg-emerald-500"
                                    : service.scans[0].status.includes("FAILED")
                                      ? "bg-red-500"
                                      : "bg-blue-500 animate-pulse"
                                }`}
                              />
                            </Tooltip>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                          {service.scans[0]?.scanMode === "SCAN_ONLY"
                            ? "Ver: "
                            : "Img: "}
                          {service.scans[0]?.imageTag || "latest"}
                        </p>
                        {service.scans[0] &&
                          (service.scans[0].vulnCritical > 0 ||
                            service.scans[0].vulnHigh > 0) && (
                            <div className="flex gap-1 mt-1.5">
                              {service.scans[0].vulnCritical > 0 && (
                                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 rounded font-bold">
                                  {service.scans[0].vulnCritical} C
                                </span>
                              )}
                              {service.scans[0].vulnHigh > 0 && (
                                <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 rounded font-bold">
                                  {service.scans[0].vulnHigh} H
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                      <div className="flex items-center gap-1 pl-2">
                        {/* ✅ Smart Rescan Button: Detects previous mode */}
                        <Tooltip
                          content={`Rescan (${
                            service.scans[0]?.scanMode === "SCAN_ONLY"
                              ? "Audit"
                              : "Build"
                          })`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const mode =
                                service.scans[0]?.scanMode || "SCAN_AND_BUILD";
                              setRescanTag("");
                              setShowRescanModal({
                                serviceId: service.id,
                                serviceName: service.serviceName,
                                lastScanMode: mode,
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </Tooltip>
                        {service.scans[0]?.pipelineId && (
                          <Tooltip content="View Report">
                            <Link
                              href={`/scan/${service.scans[0].pipelineId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-100 rounded transition-colors block"
                            >
                              <Eye size={14} />
                            </Link>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {project.services.length > 3 && (
                  <p className="text-xs text-center text-slate-400 pt-2 border-t border-slate-50 mt-auto">
                    +{project.services.length - 3} more services
                  </p>
                )}
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center mt-auto rounded-b-xl">
                <Link
                  href={`/scan/history?projectId=${project.id}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  History <ExternalLink size={10} />
                </Link>
                <div className="flex gap-1 items-center">
                  {project.services.length > 0 && (
                    <AddServiceDialog
                      groupId={project.id}
                      repoUrl={project.repoUrl}
                      iconOnly
                    />
                  )}
                  <Tooltip content="Compare Scans">
                    <Link
                      href={`/scan/compare?projectId=${project.id}`}
                      className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors ml-1 block"
                    >
                      <TrendingUp size={14} />
                    </Link>
                  </Tooltip>
                  <Tooltip content="Delete Project">
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      disabled={deletingProject === project.id}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors ml-1"
                    >
                      {deletingProject === project.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ New Smart Rescan Modal */}
      {showRescanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div
              className={`px-6 py-5 border-b flex items-center gap-3 ${
                showRescanModal.lastScanMode === "SCAN_ONLY"
                  ? "bg-purple-50 border-purple-100"
                  : "bg-blue-50 border-blue-100"
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  showRescanModal.lastScanMode === "SCAN_ONLY"
                    ? "bg-white text-purple-600"
                    : "bg-white text-blue-600"
                }`}
              >
                {showRescanModal.lastScanMode === "SCAN_ONLY" ? (
                  <Shield size={20} />
                ) : (
                  <Package size={20} />
                )}
              </div>
              <div>
                <h3
                  className={`font-bold text-lg ${
                    showRescanModal.lastScanMode === "SCAN_ONLY"
                      ? "text-purple-900"
                      : "text-blue-900"
                  }`}
                >
                  {showRescanModal.lastScanMode === "SCAN_ONLY"
                    ? "Security Audit"
                    : "Build & Scan"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Service:{" "}
                  <span className="font-semibold">
                    {showRescanModal.serviceName}
                  </span>
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
                  <Tag size={12} />
                  {showRescanModal.lastScanMode === "SCAN_ONLY"
                    ? "Version Label"
                    : "Image Tag"}
                </label>
                <input
                  value={rescanTag}
                  onChange={(e) => setRescanTag(e.target.value)}
                  placeholder={
                    showRescanModal.lastScanMode === "SCAN_ONLY"
                      ? "e.g. v1.2-audit"
                      : "e.g. latest, v2.0"
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                  autoFocus
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {showRescanModal.lastScanMode === "SCAN_ONLY"
                    ? "Give this audit a name to easily identify it in comparisons."
                    : "Specify the Docker tag. Defaults to 'latest' if empty."}
                </p>
              </div>

              <button
                onClick={handleStartRescan}
                disabled={!!scanningService}
                className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white rounded-lg shadow-sm transition-all hover:shadow-md active:scale-95 ${
                  showRescanModal.lastScanMode === "SCAN_ONLY"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {scanningService ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
                {scanningService ? "Starting..." : "Start Scan"}
              </button>

              <button
                onClick={() => setShowRescanModal(null)}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (Preserved) */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 flex justify-between items-center">
              <h3 className="font-bold text-white">Edit Project</h3>
              <button
                onClick={() => setEditingProject(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Project Name
                </label>
                <input
                  value={editingProject.groupName}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      groupName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Repo URL
                </label>
                <input
                  value={editingProject.repoUrl}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      repoUrl: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProject}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
