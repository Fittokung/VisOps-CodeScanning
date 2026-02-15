"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  ExternalLink,
  UserCircle2,
  Hash,
  ShieldAlert,
  Loader2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

// --- Types ---
type ScanItem = {
  id: string;
  status: string;
  imageTag: string;
  vulnCritical: number;
  vulnHigh: number;
  vulnMedium: number;
  vulnLow: number;
  pipelineId: string;
  createdAt: string;
  service: {
    serviceName: string;
    group: {
      groupName: string;
      repoUrl: string;
      user: {
        name: string;
        email: string;
      };
    };
  };
};

const ITEMS_PER_PAGE = 10;

export default function AdminHistoryPage() {
  const [history, setHistory] = useState<ScanItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/admin/history");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const sortedData = [...data].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setHistory(sortedData);
          setFilteredHistory(sortedData);
        }
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Confirm DELETE this record? This action cannot be undone.`))
      return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/scan/${id}`, { method: "DELETE" });
      if (res.ok) {
        const updated = history.filter((item) => item.id !== id);
        setHistory(updated);
        setFilteredHistory(updated); // Update filtered list too
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  // Search Logic
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredHistory(history);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = history.filter(
        (item) =>
          item.service?.serviceName.toLowerCase().includes(lowerTerm) ||
          item.service?.group?.groupName.toLowerCase().includes(lowerTerm) ||
          item.service?.group?.user?.name.toLowerCase().includes(lowerTerm) ||
          item.service?.group?.user?.email.toLowerCase().includes(lowerTerm) ||
          item.pipelineId?.toLowerCase().includes(lowerTerm)
      );
      setFilteredHistory(filtered);
    }
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, history]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHistory = filteredHistory.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Helper Functions for Badges
  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "FAILED":
      case "FAILED_SECURITY":
        return "bg-red-50 text-red-700 border-red-100";
      case "RUNNING":
      case "QUEUED":
        return "bg-blue-50 text-blue-700 border-blue-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case "FAILED":
      case "FAILED_SECURITY":
        return <XCircle className="w-3.5 h-3.5 text-red-600" />;
      case "RUNNING":
      case "QUEUED":
        return <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // ... (existing helper functions)

  // Selection Logic
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all visible items on current page
      const newSelected = new Set(selectedIds);
      paginatedHistory.forEach((item) => newSelected.add(item.id));
      setSelectedIds(newSelected);
    } else {
      // Deselect all visible items
      const newSelected = new Set(selectedIds);
      paginatedHistory.forEach((item) => newSelected.delete(item.id));
      setSelectedIds(newSelected);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.size} selected items? This cannot be undone.`
      )
    )
      return;

    setIsBulkDeleting(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      const res = await fetch("/api/admin/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsToDelete }),
      });

      if (res.ok) {
        // Remove deleted items locally
        const updated = history.filter((item) => !selectedIds.has(item.id));
        setHistory(updated);
        setFilteredHistory(updated);
        setSelectedIds(new Set()); // Clear selection
      } else {
        alert("Failed to delete selected items.");
      }
    } catch (error) {
      console.error("Bulk delete failed:", error);
      alert("Network error.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Check if all visible items are selected
  const allVisibleSelected =
    paginatedHistory.length > 0 &&
    paginatedHistory.every((item) => selectedIds.has(item.id));
    
  // Check if some visible items are selected (for indeterminate state visual, though standard checkbox doesn't support it easily in React without ref)
  const someVisibleSelected = paginatedHistory.some((item) => selectedIds.has(item.id));

  if (loading && history.length === 0) {
    return (
      <div className="w-full space-y-6 p-6">
        <div className="h-8 bg-slate-100 rounded w-48 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-white border border-slate-200 rounded-xl animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 md:p-8">
      <div className="w-full max-w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              All Scan History
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Monitoring security scans from all users across the system.
            </p>
          </div>
          <div className="flex gap-2">
           {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 border border-red-700 rounded-lg text-sm font-medium text-white hover:bg-red-700 transition-colors shadow-sm animate-in fade-in zoom-in-95"
              >
                {isBulkDeleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete ({selectedIds.size})
              </button>
            )}
            <button
              onClick={() => {
                setLoading(true);
                fetchHistory();
              }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />{" "}
              Refresh
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by user, service, or pipeline ID..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                   {/* Checkbox Header */}
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4">User / Group</th>
                  <th className="px-6 py-4">Service / Pipeline</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Findings</th>
                  <th className="px-6 py-4">Executed At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {paginatedHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Search size={32} className="text-slate-300 dark:text-slate-600" />
                        <p>No records found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedHistory.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group ${selectedIds.has(item.id) ? "bg-purple-50/50 dark:bg-purple-900/10" : ""}`}
                    >
                      {/* Checkbox Row */}
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      </td>

                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40 font-bold text-xs">
                            {item.service?.group?.user?.name
                              ?.charAt(0)
                              .toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-200 leading-none">
                              {item.service?.group?.user?.name ||
                                "Unknown User"}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1 flex items-center gap-1">
                              <UserCircle2 size={10} />
                              {item.service?.group?.groupName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Service / Pipeline */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 dark:text-slate-200">
                            {item.service?.serviceName}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <Hash size={10} />{" "}
                              {item.pipelineId?.substring(0, 8) || "N/A"}...
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-0.5">
                              <Package size={10} /> {item.imageTag}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(item.status)}
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </td>

                      {/* Vulnerabilities */}
                      <td className="px-6 py-4">
                         {/* ... (Keep existing vulnerability display logic) ... */}
                        {item.vulnCritical === 0 &&
                        item.vulnHigh === 0 &&
                        item.vulnMedium === 0 &&
                        item.vulnLow === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-1">
                            <CheckCircle size={12} /> Clean
                          </span>
                        ) : (
                          <div className="flex gap-1.5">
                            {item.vulnCritical > 0 && (
                              <span className="text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 px-1.5 py-0.5 rounded shadow-sm">
                                C:{item.vulnCritical}
                              </span>
                            )}
                            {item.vulnHigh > 0 && (
                              <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 px-1.5 py-0.5 rounded shadow-sm">
                                H:{item.vulnHigh}
                              </span>
                            )}
                            {item.vulnCritical === 0 && item.vulnHigh === 0 && (
                              <span className="text-xs text-slate-400 italic">
                                Low risk only
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Time */}
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-slate-400" />
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {new Date(item.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity">
                          <Link
                            href={`/scan/${item.pipelineId}`}
                            className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                            title="View Full Report"
                          >
                            <ArrowUpRight size={18} />
                          </Link>

                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                            title="Delete Entry"
                          >
                            {deletingId === item.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Showing{" "}
                <span className="font-medium text-slate-900 dark:text-white">
                  {startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-900 dark:text-white">
                  {Math.min(
                    startIndex + ITEMS_PER_PAGE,
                    filteredHistory.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-900 dark:text-white">
                  {filteredHistory.length}
                </span>{" "}
                results
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-200 dark:border-slate-700 rounded hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-200 dark:border-slate-700 rounded hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 px-2">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-slate-200 dark:border-slate-700 rounded hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-slate-200 dark:border-slate-700 rounded hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
