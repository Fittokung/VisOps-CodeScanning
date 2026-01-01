// app/dashboard/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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
} from "lucide-react";

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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeScans, setActiveScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [scanningService, setScanningService] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchDashboardData();
      // Poll for active scans every 5 seconds
      const interval = setInterval(fetchActiveScans, 5000);
      return () => clearInterval(interval);
    }
  }, [status]);

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

        // Extend session if there are active scans
        if (data.hasActiveScans) {
          // Call session endpoint to update session timestamp
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

  const handleDeleteProject = async (projectId: string) => {
    if (
      !confirm(
        "ต้องการลบโปรเจคนี้หรือไม่? (จะเป็นการ soft delete เก็บ history ไว้)"
      )
    ) {
      return;
    }

    setDeletingProject(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast("ลบโปรเจคสำเร็จ", "success");
        fetchDashboardData();
      } else {
        const error = await response.json();
        showToast(`เกิดข้อผิดพลาด: ${error.error}`, "error");
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      showToast("เกิดข้อผิดพลาดในการลบโปรเจค", "error");
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
          imageTag: `rescan-${Date.now()}`,
        }),
      });

      if (response.ok) {
        showToast(
          scanMode === "SCAN_AND_BUILD"
            ? "เริ่ม scan และ build แล้ว"
            : "เริ่ม scan แล้ว",
          "success"
        );
        fetchDashboardData();
      } else {
        const error = await response.json();
        showToast(`เกิดข้อผิดพลาด: ${error.error}`, "error");
      }
    } catch (error) {
      console.error("Failed to rescan:", error);
      showToast("เกิดข้อผิดพลาดในการ scan", "error");
    } finally {
      setScanningService(null);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="bg-gray-200 h-24 animate-pulse"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-blue-500 text-white"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="w-5 h-5" />}
            {toast.type === "error" && <XCircle className="w-5 h-5" />}
            {toast.type === "info" && <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
      {/* Page Header */}
      {/* <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex gap-3">
              <Link
                href="/scan/build"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Scan & Build ใหม่
              </Link>
              <Link
                href="/scan/scanonly"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Scan Only
              </Link>
            </div>
          </div>
        </div>
      </div> */}

      {/* Active Scans */}
      {activeScans.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-900 mb-3">
              กำลัง Scan ({activeScans.length})
            </h2>
            <div className="space-y-2">
              {activeScans.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between bg-white p-3 rounded"
                >
                  <div>
                    <span className="font-medium">
                      {scan.service?.imageName || "Manual Scan"}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="text-sm text-gray-600">{scan.status}</span>
                  </div>
                  <Link
                    href={`/scan/${scan.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    ดูรายละเอียด →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            โปรเจคทั้งหมด ({projects.length}/6)
          </h2>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            {/* <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <Search className="w-8 h-8 text-blue-600" />
            </div> */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ยังไม่มีโปรเจค
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              เริ่มต้นสร้างโปรเจคแรกของคุณเพื่อ scan
              และตรวจสอบความปลอดภัยของโค้ด
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/scan/build"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Scan & Build
              </Link>
              <Link
                href="/scan/scanonly"
                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                <Search className="w-4 h-4" />
                Scan Only
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                {/* Project Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{project.groupName}</h3>
                      <p className="text-blue-100 text-sm mt-1 break-all">
                        {project.repoUrl}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      disabled={deletingProject === project.id}
                      className="text-white hover:text-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      title="ลบโปรเจค"
                    >
                      {deletingProject === project.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Services */}
                <div className="p-4">
                  <h4 className="font-semibold mb-3 text-gray-700">
                    Services ({project.services.length})
                  </h4>
                  {project.services.length === 0 ? (
                    <p className="text-gray-500 text-sm">ยังไม่มี service</p>
                  ) : (
                    <div className="space-y-3">
                      {project.services.map((service) => (
                        <div
                          key={service.id}
                          className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition"
                        >
                          {/* Service Header */}
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium text-gray-900">
                                {service.serviceName}
                              </div>
                              <div className="text-sm text-gray-600">
                                📦 {service.imageName}
                              </div>
                              <div className="text-xs text-gray-500">
                                📁 {service.contextPath}
                              </div>
                            </div>
                          </div>

                          {/* Latest Scan Info */}
                          {service.scans.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="flex justify-between items-center">
                                <div className="text-xs">
                                  <span className="font-medium">
                                    Latest Scan:
                                  </span>
                                  <span
                                    className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                                      service.scans[0].status === "SUCCESS"
                                        ? "bg-green-100 text-green-800"
                                        : service.scans[0].status ===
                                          "FAILED_SECURITY"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {service.scans[0].status}
                                  </span>
                                  {service.scans[0].vulnCritical > 0 && (
                                    <span className="ml-2 text-red-600 font-bold">
                                      🔴 {service.scans[0].vulnCritical}{" "}
                                      Critical
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() =>
                                handleRescan(service.id, "SCAN_AND_BUILD")
                              }
                              disabled={scanningService === service.id}
                              className="flex-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-1"
                            >
                              {scanningService === service.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                              Scan & Build
                            </button>
                            <button
                              onClick={() =>
                                handleRescan(service.id, "SCAN_ONLY")
                              }
                              disabled={scanningService === service.id}
                              className="flex-1 text-xs px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-1"
                            >
                              {scanningService === service.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Search className="w-3 h-3" />
                              )}
                              Scan Only
                            </button>
                            <Link
                              href={`/scan/history?serviceId=${service.id}`}
                              className="flex-1 text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-center transition flex items-center justify-center gap-1"
                            >
                              <History className="w-3 h-3" />
                              History
                            </Link>
                          </div>

                          {/* Compare Link */}
                          {service.scans.length >= 2 && (
                            <Link
                              href={`/scan/compare?serviceId=${service.id}`}
                              className="flex items-center justify-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline transition"
                            >
                              <TrendingUp className="w-3 h-3" />
                              เปรียบเทียบ Scans
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
