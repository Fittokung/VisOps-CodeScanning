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

// --- Types ---
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

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      const url = serviceId
        ? `/api/scan/history?serviceId=${serviceId}`
        : "/api/scan/history";

      const response = await fetch(url);
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        // Handle both 'scans' (old API) and 'history' (new API) keys for compatibility
        setScans(data.scans || data.history || []);
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
      } else {
        return [...prev, scanId];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedScans.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedScans.length} scan record(s)?`
      )
    )
      return;

    setDeletingId("bulk");
    try {
      const deletePromises = selectedScans.map((scanId) =>
        fetch(`/api/scan/history?scanId=${scanId}`, {
          method: "DELETE",
        })
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter((r) => r.ok).length;

      // Optimistic update
      setScans((prev) => prev.filter((s) => !selectedScans.includes(s.id)));
      setSelectedScans([]);

      if (successCount > 0) {
        setToast({
          message: `Successfully deleted ${successCount} scan(s)`,
          type: "success",
        });
      } else {
        setToast({ message: "Failed to delete scans", type: "error" });
      }
    } catch (error) {
      console.error("Failed to delete scans:", error);
      setToast({ message: "Failed to delete scans", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewDetails = (scan: Scan) => {
    if (scan.pipelineId) {
      router.push(`/scan/${scan.pipelineId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
      case "PASSED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "FAILED_SECURITY":
        return "bg-red-100 text-red-800 border-red-200";
      case "FAILED":
      case "FAILED_BUILD":
      case "ERROR":
        return "bg-red-50 text-red-600 border-red-100";
      case "RUNNING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "QUEUED":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "CANCELLED":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
      case "PASSED":
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case "FAILED":
      case "FAILED_SECURITY":
      case "FAILED_BUILD":
      case "ERROR":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "RUNNING":
      case "QUEUED":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="p-4 border-b border-gray-100 last:border-0 flex justify-between items-center"
              >
                <div className="space-y-2 w-1/3">
                  <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-50 rounded w-1/2 animate-pulse"></div>
                </div>
                <div className="h-8 w-24 bg-gray-100 rounded animate-pulse"></div>
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
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            {/* <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all text-gray-500 hover:text-gray-900"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button> */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Scan History</h1>
              <p className="text-gray-500 text-sm mt-1">
                {serviceId
                  ? "Viewing chronological history for selected service"
                  : `All system security scans (${scans.length} total)`}
              </p>
            </div>
          </div>
        </div>

        {/* Bulk Delete Button */}
        {selectedScans.length > 0 && (
          <div className="mb-6 bg-white border border-red-200 rounded-xl p-4 shadow-sm flex justify-between items-center animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <span className="text-gray-900 font-medium">
                  {selectedScans.length} item
                  {selectedScans.length > 1 ? "s" : ""} selected
                </span>
                <p className="text-gray-500 text-xs">
                  Deleted items cannot be recovered
                </p>
              </div>
            </div>
            <button
              onClick={handleBulkDelete}
              disabled={deletingId === "bulk"}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium shadow-sm hover:shadow text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {deletingId === "bulk" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete Selected"
              )}
            </button>
          </div>
        )}

        {/* Scans List */}
        {scans.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Scan History
              </h3>
              <p className="text-gray-500 mb-6 text-sm">
                {serviceId
                  ? "This service hasn't been scanned yet."
                  : "You haven't run any scans yet."}
              </p>
              {/* <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
              >
                Go to Dashboard
              </Link> */}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left w-12">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedScans(scans.map((s) => s.id));
                          } else {
                            setSelectedScans([]);
                          }
                        }}
                        checked={
                          selectedScans.length === scans.length &&
                          scans.length > 0
                        }
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Service / Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Vulnerabilities
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Executed At
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Action
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
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedScans.includes(scan.id) ? "bg-blue-50/30" : ""
                        }`}
                        onClick={() =>
                          scan.pipelineId && handleViewDetails(scan)
                        }
                      >
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedScans.includes(scan.id)}
                            onChange={() => handleSelectScan(scan.id)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">
                              {scan.service.serviceName}
                            </span>
                            <span className="text-xs text-gray-500 font-mono mt-0.5 bg-gray-100 px-1.5 py-0.5 rounded w-fit">
                              {scan.imageTag}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                              scan.scanMode === "SCAN_ONLY"
                                ? "bg-purple-50 text-purple-700 border-purple-100"
                                : "bg-indigo-50 text-indigo-700 border-indigo-100"
                            }`}
                          >
                            {scan.scanMode === "SCAN_ONLY"
                              ? "SCAN ONLY"
                              : "BUILD & SCAN"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(scan.status)}
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusColor(
                                scan.status
                              )}`}
                            >
                              {scan.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {totalVulns === 0 ? (
                            <span className="text-emerald-600 text-xs font-medium flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                              <CheckCircle className="w-3 h-3" /> Clean
                            </span>
                          ) : (
                            <div className="flex gap-1.5">
                              {scan.vulnCritical > 0 && (
                                <span
                                  className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded"
                                  title="Critical"
                                >
                                  C:{scan.vulnCritical}
                                </span>
                              )}
                              {scan.vulnHigh > 0 && (
                                <span
                                  className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded"
                                  title="High"
                                >
                                  H:{scan.vulnHigh}
                                </span>
                              )}
                              {scan.vulnCritical === 0 &&
                                scan.vulnHigh === 0 && (
                                  <span className="text-xs text-gray-500">
                                    Low/Med Only
                                  </span>
                                )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {new Date(scan.startedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {scan.pipelineId ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(scan);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline"
                            >
                              View Report
                            </button>
                          ) : (
                            <span className="text-gray-300 text-xs italic">
                              No Report
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main component with Suspense wrapper
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
