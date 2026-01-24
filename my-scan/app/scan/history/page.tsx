"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Trash2,
  AlertCircle,
  Filter,
  Calendar,
  ArrowUpRight,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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

const ITEMS_PER_PAGE = 10;

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

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
        setScans(data.scans || data.history || []);
        setCurrentPage(1); // Reset page on new fetch
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

  // Pagination Logic
  const totalPages = Math.ceil(scans.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedScans = scans.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
        fetch(`/api/scan/history?scanId=${scanId}`, { method: "DELETE" })
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter((r) => r.ok).length;

      // Update local state
      setScans((prev) => prev.filter((s) => !selectedScans.includes(s.id)));
      setSelectedScans([]);

      // Adjust pagination if page becomes empty
      const remainingItems = scans.length - selectedScans.length;
      const newTotalPages = Math.ceil(remainingItems / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }

      if (successCount > 0) {
        setToast({
          message: `Deleted ${successCount} scan(s)`,
          type: "success",
        });
      } else {
        setToast({ message: "Failed to delete scans", type: "error" });
      }
    } catch (error) {
      console.error(error);
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
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "FAILED_SECURITY":
        return "bg-red-50 text-red-700 border-red-100";
      case "FAILED":
      case "FAILED_BUILD":
      case "ERROR":
        return "bg-red-50 text-red-700 border-red-100";
      case "RUNNING":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "QUEUED":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "CANCELLED":
        return "bg-slate-50 text-slate-600 border-slate-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
      case "PASSED":
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case "FAILED":
      case "FAILED_SECURITY":
      case "FAILED_BUILD":
      case "ERROR":
        return <XCircle className="w-3.5 h-3.5 text-red-600" />;
      case "RUNNING":
      case "QUEUED":
        return <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="h-8 bg-slate-100 rounded w-48 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 bg-white border border-slate-100 rounded-xl animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-20">
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
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Scan History
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {serviceId
              ? "History for selected service"
              : `All system scans (${scans.length} total)`}
          </p>
        </div>

        {/* Actions / Filter Placeholders */}
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={16} /> Filter
          </button>
          {selectedScans.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deletingId === "bulk"}
              className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
            >
              {deletingId === "bulk" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              Delete ({selectedScans.length})
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {scans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-300 rounded-xl text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No Scan History
          </h3>
          <p className="text-gray-500 text-sm">
            You haven't run any scans yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left w-12">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Select only current page items or all?
                            // Standard behavior: select currently visible or implement cross-page selection logic.
                            // For simplicity: Select items on current page
                            setSelectedScans(paginatedScans.map((s) => s.id));
                          } else {
                            setSelectedScans([]);
                          }
                        }}
                        checked={
                          paginatedScans.length > 0 &&
                          paginatedScans.every((s) =>
                            selectedScans.includes(s.id)
                          )
                        }
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Service / Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Vulnerabilities
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Executed At
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {paginatedScans.map((scan) => {
                    const totalVulns =
                      scan.vulnCritical +
                      scan.vulnHigh +
                      scan.vulnMedium +
                      scan.vulnLow;
                    const isSelected = selectedScans.includes(scan.id);

                    return (
                      <tr
                        key={scan.id}
                        className={`group hover:bg-slate-50/80 transition-colors cursor-pointer ${
                          isSelected ? "bg-blue-50/40" : ""
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
                            checked={isSelected}
                            onChange={() => handleSelectScan(scan.id)}
                            className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                              {scan.service.serviceName}
                            </span>
                            <span className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                              <Package size={10} /> {scan.imageTag}
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
                          <div className="flex items-center gap-1.5">
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
                            <span className="text-emerald-600 text-xs font-medium flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full w-fit border border-emerald-100">
                              <CheckCircle size={12} /> Clean
                            </span>
                          ) : (
                            <div className="flex gap-1.5">
                              {scan.vulnCritical > 0 && (
                                <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded shadow-sm">
                                  C:{scan.vulnCritical}
                                </span>
                              )}
                              {scan.vulnHigh > 0 && (
                                <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded shadow-sm">
                                  H:{scan.vulnHigh}
                                </span>
                              )}
                              {scan.vulnCritical === 0 &&
                                scan.vulnHigh === 0 && (
                                  <span className="text-xs text-slate-400 italic">
                                    Low risk only
                                  </span>
                                )}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-400" />
                            {new Date(scan.startedAt).toLocaleDateString()}
                            <span className="text-xs text-slate-400 ml-1">
                              {new Date(scan.startedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {scan.pipelineId ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(scan);
                              }}
                              className="text-slate-400 hover:text-blue-600 p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                              title="View Report"
                            >
                              <ArrowUpRight size={18} />
                            </button>
                          ) : (
                            <span className="text-slate-300 text-xs italic">
                              N/A
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

          {/* ✅ Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-slate-500">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(startIndex + ITEMS_PER_PAGE, scans.length)}
                </span>{" "}
                of <span className="font-medium">{scans.length}</span> results
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="First Page"
                >
                  <ChevronsLeft size={16} className="text-slate-600" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous"
                >
                  <ChevronLeft size={16} className="text-slate-600" />
                </button>

                <div className="px-4 py-2 text-sm font-medium text-slate-700">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next"
                >
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Last Page"
                >
                  <ChevronsRight size={16} className="text-slate-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main component with Suspense wrapper
export default function ScanHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-96 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ScanHistoryContent />
    </Suspense>
  );
}
