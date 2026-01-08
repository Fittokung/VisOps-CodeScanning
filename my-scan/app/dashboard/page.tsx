// app/dashboard/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Trash2,
  RefreshCw,
  Search,
  History,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Play,
  Clock,
  Shield,
  Package,
  ExternalLink,
  MoreVertical,
  Eye,
  StopCircle,
  ArrowRight,
  Activity,
  Folder,
  Server,
  Plus,
  Edit2,
} from "lucide-react";
import AddServiceDialog from "@/components/AddServiceDialog";

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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeScans, setActiveScans] = useState<ActiveScan[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login"); // Use replace for auth redirects (no back button to protected page)
    } else if (status === "authenticated") {
      fetchDashboardData();

      // Refresh active scans every 5 seconds
      const activeScansInterval = setInterval(fetchActiveScans, 5000);

      // Refresh full dashboard data every 15 seconds
      const dashboardInterval = setInterval(fetchDashboardData, 15000);

      return () => {
        clearInterval(activeScansInterval);
        clearInterval(dashboardInterval);
      };
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        setActiveScans(data.activeScans || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveScans = async () => {
    try {
      const response = await fetch("/api/scan/status/active");
      if (response.ok) {
        const data = await response.json();
        setActiveScans(data.activeScans || []);
        if (data.hasActiveScans) {
          await fetch("/api/auth/session");
        }
      }
    } catch (error) {
      console.error("Failed to fetch active scans:", error);
    }
  };

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDeleteProject = async (
    projectId: string,
    forceStop: boolean = false
  ) => {
    const confirmMsg = forceStop
      ? "This will stop all active scans and permanently delete the project. Continue?"
      : "Are you sure you want to delete this project?\n\n⚠️ This will:\n• Remove the project from your dashboard\n• Keep scan history for reference (soft delete)\n\nTo permanently delete, contact administrator.";

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
        fetchDashboardData();
      } else {
        const error = await response.json();
        if (error.hasActiveScans && !forceStop) {
          if (
            confirm(
              `This project has ${
                error.activeCount || "active"
              } scan(s) running.\n\nDo you want to force stop all scans and delete?`
            )
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
        const data = await response.json();
        showToast(
          scanMode === "SCAN_AND_BUILD"
            ? "Scan & Build started"
            : "Scan started",
          "success"
        );
        setShowRescanModal(null);
        setRescanTag("latest");
        if (data.pipelineId) {
          router.push(`/scan/${data.pipelineId}`);
        }
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
        fetchDashboardData();
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

  if (loading || status === "loading") {
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

      {/* Floating Active Scans Popup - Bottom Right */}
      {activeScans.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden w-80">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Activity className="w-5 h-5 animate-pulse" />
                <span className="font-semibold">
                  Active Scans ({activeScans.length})
                </span>
              </div>
              <Link
                href="/scan/history"
                className="text-blue-100 hover:text-white text-xs underline"
              >
                View All
              </Link>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {activeScans.slice(0, 5).map((scan) => (
                <Link
                  key={scan.id}
                  href={
                    scan.pipelineId ? `/scan/${scan.pipelineId}` : `/dashboard`
                  }
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">
                        {scan.service?.serviceName || "Manual Scan"}
                      </p>
                      <p className="text-xs text-slate-500">{scan.status}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

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
                <Server className="w-4 h-4" />
                Manage Services
              </Link>
              <Link
                href="/scan/scanonly"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
              >
                <Shield className="w-4 h-4" />
                Scan Only
              </Link>
              <Link
                href="/scan/build"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
              >
                <Package className="w-4 h-4" />
                Scan & Build
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
              Create your first project to scan and analyze your code for
              security vulnerabilities.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/scan/build"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <Package className="w-4 h-4" />
                Scan & Build
              </Link>
              <Link
                href="/scan/scanonly"
                className="inline-flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
              >
                <Shield className="w-4 h-4" />
                Scan Only
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Add New Project Card - With Mode Selection */}
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
                    <Package className="w-4 h-4" />
                    Scan & Build
                  </Link>
                  <Link
                    href="/scan/scanonly"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium text-sm"
                  >
                    <Shield className="w-4 h-4" />
                    Scan Only
                  </Link>
                </div>
              </div>
            </div>

            {/* Existing Project Cards */}
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-200 group"
              >
                {/* Project Header - Shows Info Only */}
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
                      title="View History"
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

                          {/* Latest Scan Status */}
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
                                    {service.scans[0].vulnCritical} Critical
                                  </span>
                                )}
                                {service.scans[0].vulnHigh > 0 && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-semibold">
                                    {service.scans[0].vulnHigh} High
                                  </span>
                                )}
                                {service.scans[0].vulnMedium > 0 && (
                                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">
                                    {service.scans[0].vulnMedium} Medium
                                  </span>
                                )}
                                {service.scans[0].vulnLow > 0 && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                    {service.scans[0].vulnLow} Low
                                  </span>
                                )}
                              </div>
                              {service.scans[0].pipelineId ? (
                                <Link
                                  href={`/scan/${service.scans[0].pipelineId}`}
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Eye className="w-3 h-3" /> View
                                </Link>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  No details
                                </span>
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

                {/* Project Footer Actions */}
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
                      title="Edit Project"
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
                      title="Delete Project"
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

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Project</h3>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Update project details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
              >
                <XCircle className="w-5 h-5" />
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
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>
            </div>
            <div className="border-t px-6 py-3 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setEditingProject(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProject}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
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
