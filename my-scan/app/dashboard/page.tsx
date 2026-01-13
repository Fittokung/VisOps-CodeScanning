// app/dashboard/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react"; // เพิ่ม useEffect สำหรับ logic
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR, { mutate } from "swr"; // ✅ Import SWR
import {
  Loader2,
  Trash2,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Shield,
  Package,
  ExternalLink,
  Eye,
  Activity,
  Folder,
  Server,
  Plus,
  Edit2,
  X,
} from "lucide-react";
import AddServiceDialog from "@/components/AddServiceDialog";

// Types
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
  scanMode: string;
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

// Fetcher Function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [scanningService, setScanningService] = useState<string | null>(null);
  const [showRescanModal, setShowRescanModal] = useState<{
    serviceId: string;
    serviceName: string;
  } | null>(null);
  const [rescanTag, setRescanTag] = useState("latest");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [editingProject, setEditingProject] = useState<{
    id: string;
    groupName: string;
    repoUrl: string;
  } | null>(null);

  // ✅ REF: เก็บ ID ของ Scan รอบที่แล้วไว้เปรียบเทียบ
  const prevActiveScanIds = useRef<Set<string>>(new Set());

  // ✅ 1. SWR: Active Scans (Poll ทุก 2 วินาที)
  const { data: activeScansData } = useSWR(
    status === "authenticated" ? "/api/scan/status/active" : null,
    fetcher,
    { refreshInterval: 2000 }
  );

  // ✅ 2. SWR: Dashboard Data (Poll ทุก 10 วินาที)
  const { data: dashboardData, isLoading: dashboardLoading } = useSWR(
    status === "authenticated" ? "/api/dashboard" : null,
    fetcher,
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
    }
  );

  const projects: Project[] = dashboardData?.projects || [];
  const activeScans: ActiveScan[] = activeScansData?.activeScans || [];

  // ✅ Logic: Smart Refresh (ทำงานเมื่อ activeScans เปลี่ยน)
  // ถ้ามีงานเสร็จ หรือมีงานใหม่ -> สั่ง SWR ให้โหลด Dashboard ใหม่ทันที
  useEffect(() => {
    if (!activeScansData) return;

    const currentIds = new Set(activeScans.map((s) => s.id));
    const prevIds = prevActiveScanIds.current;

    let hasFinishedScan = false;
    let hasNewScan = false;

    // เช็คว่ามี ID หายไปไหม (เสร็จแล้ว)
    prevIds.forEach((id) => {
      if (!currentIds.has(id)) hasFinishedScan = true;
    });

    // เช็คว่ามี ID เพิ่มมาไหม (เริ่มใหม่)
    currentIds.forEach((id) => {
      if (!prevIds.has(id)) hasNewScan = true;
    });

    if (hasFinishedScan || hasNewScan) {
      console.log("🔄 Scan status changed, refreshing dashboard...");
      mutate("/api/dashboard"); // Force re-fetch dashboard
    }

    prevActiveScanIds.current = currentIds;
  }, [activeScansData]); // Run whenever active scans data updates

  // Auth Check
  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  // Toast Helper
  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- Handlers --- (Logic เดิม)

  const handleDeleteProject = async (
    projectId: string,
    forceStop: boolean = false
  ) => {
    const confirmMsg = forceStop
      ? "This will stop all active scans and permanently delete the project. Continue?"
      : "Are you sure you want to delete this project?\n\n This will:\n• Remove the project from your dashboard\n• Keep scan history for reference (soft delete)\n\nTo permanently delete, contact administrator.";

    if (!confirm(confirmMsg)) return;

    setDeletingProject(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceStop }),
      });

      if (response.ok) {
        showToast("Project removed from dashboard", "success");
        mutate("/api/dashboard"); // Refresh immediate
      } else {
        const error = await response.json();
        if (error.hasActiveScans && !forceStop) {
          if (
            confirm(`This project has running scans. Force stop and delete?`)
          ) {
            handleDeleteProject(projectId, true);
            return;
          }
        }
        showToast(`Error: ${error.error}`, "error");
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      showToast("Failed to delete project", "error");
    } finally {
      setDeletingProject(null);
    }
  };

  const handleRescan = async (
    serviceId: string,
    scanMode: string = "SCAN_AND_BUILD"
  ) => {
    setScanningService(serviceId);
    try {
      const response = await fetch("/api/scan/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          scanMode,
          imageTag: rescanTag || `rescan-${Date.now()}`,
        }),
      });

      if (response.ok) {
        showToast(
          scanMode === "SCAN_AND_BUILD"
            ? "Scan & Build started"
            : "Scan started",
          "success"
        );
        setShowRescanModal(null);
        setRescanTag("latest");
        mutate("/api/scan/status/active"); // Refresh Active Scans immediate
      } else {
        const error = await response.json();
        showToast(`Error: ${error.error}`, "error");
      }
    } catch (error) {
      console.error("Failed to rescan:", error);
      showToast("Failed to start scan", "error");
    } finally {
      setScanningService(null);
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName: editingProject.groupName,
          repoUrl: editingProject.repoUrl,
        }),
      });

      if (response.ok) {
        showToast("Project updated successfully", "success");
        setEditingProject(null);
        mutate("/api/dashboard");
      } else {
        const error = await response.json();
        showToast(`Error: ${error.error}`, "error");
      }
    } catch (error) {
      console.error("Failed to update project:", error);
      showToast("Failed to update project", "error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
      case "PASSED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "FAILED_SECURITY":
        return "bg-red-100 text-red-800 border-red-200";
      case "FAILED_BUILD":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "RUNNING":
      case "QUEUED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (dashboardLoading && !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse"
              >
                <div className="h-24 bg-gradient-to-r from-slate-200 to-slate-100"></div>
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-8 bg-slate-100 rounded mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : toast.type === "error"
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-blue-50 text-blue-800 border-blue-200"
            }`}
          >
            {toast.type === "success" && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
            {toast.type === "error" && (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            {toast.type === "info" && (
              <AlertCircle className="w-5 h-5 text-blue-600" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* ⚠️ ลบ Widget เดิมออกแล้ว เพราะใช้ตัว Global ใน Layout แทน */}

      {/* Re-scan Modal */}
      {showRescanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Re-scan Service</h3>
              <p className="text-slate-300 text-sm mt-1">
                {showRescanModal.serviceName}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Image Tag / Version
                </label>
                <input
                  type="text"
                  value={rescanTag}
                  onChange={(e) => setRescanTag(e.target.value)}
                  placeholder="latest"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter a new tag or leave as 'latest'
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() =>
                    handleRescan(showRescanModal.serviceId, "SCAN_ONLY")
                  }
                  disabled={scanningService === showRescanModal.serviceId}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition font-medium flex items-center justify-center gap-2"
                >
                  {scanningService === showRescanModal.serviceId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  Scan Only
                </button>
                <button
                  onClick={() =>
                    handleRescan(showRescanModal.serviceId, "SCAN_AND_BUILD")
                  }
                  disabled={scanningService === showRescanModal.serviceId}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium flex items-center justify-center gap-2"
                >
                  {scanningService === showRescanModal.serviceId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Package className="w-4 h-4" />
                  )}
                  Scan & Build
                </button>
              </div>
            </div>
            <div className="border-t px-6 py-3 bg-slate-50 flex justify-end">
              <button
                onClick={() => {
                  setShowRescanModal(null);
                  setRescanTag("latest");
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
              <p className="text-slate-500 text-sm mt-1">
                {projects.length} of 6 projects used
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-purple-300 text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition font-medium"
              >
                <Server className="w-4 h-4" /> Manage Services
              </Link>
              <Link
                href="/scan/scanonly"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
              >
                <Shield className="w-4 h-4" /> Scan Only
              </Link>
              <Link
                href="/scan/build"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
              >
                <Package className="w-4 h-4" /> Scan & Build
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {projects.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <Folder className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Projects Yet
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Create your first project to scan and analyze your code.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/scan/build"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <Package className="w-4 h-4" /> Scan & Build
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Card */}
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 overflow-hidden transition-all duration-200 flex items-center justify-center min-h-[300px]">
              <div className="text-center p-6 w-full">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Create New Project
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Choose your scanning mode
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/scan/build"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                  >
                    <Package className="w-4 h-4" /> Scan & Build
                  </Link>
                  <Link
                    href="/scan/scanonly"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium text-sm"
                  >
                    <Shield className="w-4 h-4" /> Scan Only
                  </Link>
                </div>
              </div>
            </div>

            {/* Existing Projects */}
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-200 group"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold truncate">
                        {project.groupName}
                      </h3>
                      <p className="text-slate-400 text-xs mt-1 truncate">
                        {project.repoUrl}
                      </p>
                    </div>
                    <Link
                      href={`/scan/history?projectId=${project.id}`}
                      className="text-slate-400 hover:text-white transition flex-shrink-0 ml-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">
                      {project.services.length} service
                      {project.services.length !== 1 ? "s" : ""}
                    </span>
                    {project.services.some((s) =>
                      s.scans.some(
                        (sc) =>
                          sc.status === "RUNNING" || sc.status === "QUEUED"
                      )
                    ) && (
                      <span className="text-xs bg-blue-600 px-2 py-0.5 rounded flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Services List */}
                <div className="p-4">
                  {project.services.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">
                      No services configured
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {project.services.slice(0, 3).map((service) => (
                        <div
                          key={service.id}
                          className="border border-slate-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50/30 transition"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-slate-800 truncate">
                                {service.serviceName}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                📦 {service.imageName}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowRescanModal({
                                  serviceId: service.id,
                                  serviceName: service.serviceName,
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded transition"
                              title="Re-scan"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Latest Scan Badge */}
                          {service.scans.length > 0 && (
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColor(
                                    service.scans[0].status
                                  )}`}
                                >
                                  {service.scans[0].status}
                                </span>
                                {service.scans[0].vulnCritical > 0 && (
                                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                                    {service.scans[0].vulnCritical} Crit
                                  </span>
                                )}
                                {service.scans[0].vulnHigh > 0 && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-semibold">
                                    {service.scans[0].vulnHigh} High
                                  </span>
                                )}
                              </div>
                              {service.scans[0].pipelineId && (
                                <Link
                                  href={`/scan/${service.scans[0].pipelineId}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" /> View
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {project.services.length > 3 && (
                        <p className="text-xs text-slate-500 text-center pt-2">
                          +{project.services.length - 3} more services
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-200 px-4 py-3 bg-slate-50 flex items-center justify-between">
                  <AddServiceDialog
                    groupId={project.id}
                    repoUrl={project.repoUrl}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setEditingProject({
                          id: project.id,
                          groupName: project.groupName,
                          repoUrl: project.repoUrl,
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/scan/compare?projectId=${project.id}`}
                      className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      <TrendingUp className="w-3 h-3" /> Compare
                    </Link>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      disabled={deletingProject === project.id}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                    >
                      {deletingProject === project.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal (Same as before) */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Edit Project</h3>
              <button
                onClick={() => setEditingProject(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={editingProject.groupName}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      groupName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Repository URL
                </label>
                <input
                  type="text"
                  value={editingProject.repoUrl}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      repoUrl: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg font-mono text-sm"
                />
              </div>
            </div>
            <div className="border-t px-6 py-3 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setEditingProject(null)}
                className="px-4 py-2 text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProject}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
