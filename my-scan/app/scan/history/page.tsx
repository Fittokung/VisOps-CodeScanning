// app/scan/history/page.tsx
"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";

interface Scan {
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
  service: {
    serviceName: string;
    imageName: string;
  };
}

// Helper: Check if scan is deletable (failed status)
const isDeletable = (status: string) => {
  const deletableStatuses = [
    "FAILED",
    "FAILED_SECURITY",
    "FAILED_BUILD",
    "CANCELLED",
    "ERROR",
  ];
  return deletableStatuses.includes(status);
};

function ScanHistoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceId = searchParams.get("serviceId");

  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScans, setSelectedScans] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Fetch history with useCallback for stability
  const fetchHistory = useCallback(async () => {
    try {
      const url = serviceId
        ? `/api/scan/history?serviceId=${serviceId}`
        : "/api/scan/history";

      const response = await fetch(url);
      if (response.status === 401) {
        // Redirect to login if unauthorized
        router.replace("/login");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setScans(data.scans || []);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  }, [serviceId, router]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSelectScan = (scanId: string) => {
    setSelectedScans((prev) => {
      if (prev.includes(scanId)) {
        return prev.filter((id) => id !== scanId);
      } else if (prev.length < 2) {
        return [...prev, scanId];
      }
      return prev;
    });
  };

  const handleCompare = () => {
    if (selectedScans.length === 2) {
      router.push(
        `/scan/compare?scan1=${selectedScans[0]}&scan2=${selectedScans[1]}`
      );
    }
  };

  const handleDelete = async (scanId: string) => {
    if (!confirm("Are you sure you want to delete this scan record?")) return;

    setDeletingId(scanId);
    try {
      const response = await fetch(`/api/scan/history?scanId=${scanId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setScans((prev) => prev.filter((s) => s.id !== scanId));
        setSelectedScans((prev) => prev.filter((id) => id !== scanId));
        setToast({ message: "Scan deleted successfully", type: "success" });
      } else {
        const error = await response.json();
        setToast({
          message: error.error || "Failed to delete scan",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Failed to delete scan:", error);
      setToast({ message: "Failed to delete scan", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  // Navigate to scan details with proper handling
  const handleViewDetails = (scan: Scan) => {
    if (scan.pipelineId) {
      router.push(`/scan/${scan.pipelineId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
      case "PASSED":
        return "bg-green-100 text-green-800";
      case "FAILED_SECURITY":
        return "bg-red-100 text-red-800";
      case "FAILED":
      case "FAILED_BUILD":
      case "ERROR":
        return "bg-gray-100 text-gray-800";
      case "RUNNING":
        return "bg-blue-100 text-blue-800";
      case "QUEUED":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
      case "PASSED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "FAILED":
      case "FAILED_SECURITY":
      case "FAILED_BUILD":
      case "ERROR":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "RUNNING":
      case "QUEUED":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
          <div className="bg-white rounded-xl border overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 border-b">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse"></div>
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
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Scan History</h1>
              <p className="text-gray-500 text-sm mt-1">
                {serviceId
                  ? "Viewing scans for a specific service"
                  : `All your security scans (${scans.length} total)`}
              </p>
            </div>
          </div>
        </div>

        {/* Compare Button */}
        {selectedScans.length === 2 && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-blue-900 font-semibold text-lg">
                  2 scans selected for comparison
                </span>
                <p className="text-blue-700 text-sm mt-1">
                  Compare vulnerabilities and changes between selected scans
                </p>
              </div>
              <button
                onClick={handleCompare}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-md hover:shadow-lg"
              >
                Compare Scans
              </button>
            </div>
          </div>
        )}

        {selectedScans.length === 1 && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-gray-600 text-sm">
              Select one more scan to enable comparison
            </p>
          </div>
        )}

        {/* Scans List */}
        {scans.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Scan History Yet
              </h3>
              <p className="text-gray-500 mb-6">
                {serviceId
                  ? "This service hasn't been scanned yet. Start a new scan to see results here."
                  : "You haven't run any scans yet. Create a new project to get started."}
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tag
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Vulnerabilities
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scans.map((scan) => {
                  const totalVulns =
                    scan.vulnCritical +
                    scan.vulnHigh +
                    scan.vulnMedium +
                    scan.vulnLow;

                  return (
                    <tr
                      key={scan.id}
                      className="hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => scan.pipelineId && handleViewDetails(scan)}
                    >
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedScans.includes(scan.id)}
                          onChange={() => handleSelectScan(scan.id)}
                          disabled={
                            !selectedScans.includes(scan.id) &&
                            selectedScans.length >= 2
                          }
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          title={
                            selectedScans.length >= 2 &&
                            !selectedScans.includes(scan.id)
                              ? "Maximum 2 scans can be selected"
                              : "Select for comparison"
                          }
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {scan.service.serviceName}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          {scan.service.imageName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs px-2.5 py-1.5 rounded-full font-medium ${
                            scan.scanMode === "SCAN_ONLY"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                          title={
                            scan.scanMode === "SCAN_ONLY"
                              ? "Security scan without image build"
                              : "Security scan with Docker image build"
                          }
                        >
                          {scan.scanMode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                        {scan.imageTag}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(scan.status)}
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                              scan.status
                            )}`}
                          >
                            {scan.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2 items-center">
                          {totalVulns === 0 ? (
                            <span className="text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Clean
                            </span>
                          ) : (
                            <>
                              {scan.vulnCritical > 0 && (
                                <span
                                  className="text-red-700 font-bold px-2 py-1 bg-red-50 rounded"
                                  title={`${scan.vulnCritical} Critical vulnerabilities`}
                                >
                                  🔴 {scan.vulnCritical}
                                </span>
                              )}
                              {scan.vulnHigh > 0 && (
                                <span
                                  className="text-orange-700 font-semibold px-2 py-1 bg-orange-50 rounded"
                                  title={`${scan.vulnHigh} High vulnerabilities`}
                                >
                                  🟠 {scan.vulnHigh}
                                </span>
                              )}
                              {scan.vulnMedium > 0 && (
                                <span
                                  className="text-yellow-700 px-2 py-1 bg-yellow-50 rounded"
                                  title={`${scan.vulnMedium} Medium vulnerabilities`}
                                >
                                  🟡 {scan.vulnMedium}
                                </span>
                              )}
                              {scan.vulnLow > 0 && (
                                <span
                                  className="text-gray-700 px-2 py-1 bg-gray-50 rounded text-xs"
                                  title={`${scan.vulnLow} Low vulnerabilities`}
                                >
                                  ⚪ {scan.vulnLow}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(scan.startedAt).toLocaleString("th-TH")}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          {scan.pipelineId ? (
                            <button
                              onClick={() => handleViewDetails(scan)}
                              className="text-blue-600 hover:text-blue-800 hover:underline transition font-medium"
                            >
                              View Details
                            </button>
                          ) : (
                            <span
                              className="text-gray-400"
                              title="Pipeline data not available"
                            >
                              No data
                            </span>
                          )}

                          {/* Delete button - only for failed scans */}
                          {isDeletable(scan.status) && (
                            <button
                              onClick={() => handleDelete(scan.id)}
                              disabled={deletingId === scan.id}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                              title="Delete this failed scan"
                            >
                              {deletingId === scan.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Main component with Suspense wrapper for useSearchParams
export default function ScanHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ScanHistoryContent />
    </Suspense>
  );
}
