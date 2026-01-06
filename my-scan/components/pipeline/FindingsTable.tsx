import React, { useState, useMemo, useEffect } from "react";
import { Search, ShieldAlert, User, Mail } from "lucide-react";
import { Severity, Vulnerability } from "./types";
import { SeverityBadge, ToolBadge } from "./StatusBadges";

interface FindingsTableProps {
  findings: Vulnerability[];
  isScanning: boolean;
  isSuccess: boolean;
  totalFindings: number;
}

const ITEMS_PER_PAGE = 10;

export const FindingsTable = ({
  findings,
  isScanning,
  isSuccess,
  totalFindings,
}: FindingsTableProps) => {
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredFindings = useMemo(() => {
    if (!findings) return [];
    if (filter === "all") return findings;
    return findings.filter((f) => f.severity === filter);
  }, [findings, filter]);

  const paginatedFindings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFindings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredFindings, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full min-h-[500px]">
      <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-800">
            Findings ({filteredFindings.length})
          </h3>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {(["all", "critical", "high", "medium", "low"] as const).map(
            (lvl) => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                  filter === lvl ? "bg-white shadow-sm" : "text-gray-500"
                }`}
              >
                {lvl}
              </button>
            )
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {paginatedFindings.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>
              {isScanning
                ? "Scanning for vulnerabilities..."
                : isSuccess && totalFindings === 0
                ? "✅ No vulnerabilities detected - All scans passed!"
                : filter !== "all"
                ? `No ${filter} findings found`
                : "No findings to display"}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase w-24">
                  Severity
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">
                  Issue / Tool
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">
                  Location / Context
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedFindings.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 align-top">
                    <SeverityBadge severity={item.severity} />
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="font-medium text-gray-900 line-clamp-2">
                        {item.title || item.pkgName}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <ToolBadge tool={item.sourceTool || "Unknown"} />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top text-sm text-gray-600 font-mono">
                    <div className="break-all mb-2 font-medium">
                      {item.pkgName}
                    </div>
                    {item.sourceTool === "Gitleaks" &&
                    (item.author || item.email) ? (
                      <div className="flex flex-col gap-1.5 bg-purple-50 p-2.5 rounded-lg border border-purple-100">
                        <div className="flex items-center gap-2 text-xs text-purple-800 font-semibold">
                          <User size={12} /> {item.author || "Unknown User"}
                        </div>
                        {item.email && (
                          <div className="flex items-center gap-2 text-xs text-purple-600">
                            <Mail size={12} /> {item.email}
                          </div>
                        )}
                      </div>
                    ) : (
                      item.installedVersion && (
                        <span className="text-xs text-gray-400 bg-gray-50 p-1 px-2 rounded">
                          v{item.installedVersion}
                        </span>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {filteredFindings.length > ITEMS_PER_PAGE && (
        <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50">
          <div className="text-xs text-gray-600 order-2 sm:order-1">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-gray-900">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredFindings.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {filteredFindings.length}
            </span>{" "}
            results
          </div>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-white rounded border border-transparent hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="First page"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              Previous
            </button>

            <div className="hidden sm:flex items-center gap-1">
              {Array.from(
                {
                  length: Math.ceil(filteredFindings.length / ITEMS_PER_PAGE),
                },
                (_, i) => i + 1
              )
                .filter((page) => {
                  const totalPages = Math.ceil(
                    filteredFindings.length / ITEMS_PER_PAGE
                  );
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="px-2 text-gray-400 select-none">
                        •••
                      </span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] px-2 py-1.5 text-xs font-medium rounded transition-all ${
                        currentPage === page
                          ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-100"
                          : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
            </div>

            <div className="sm:hidden flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded">
              <span>{currentPage}</span>
              <span className="text-gray-400">/</span>
              <span>{Math.ceil(filteredFindings.length / ITEMS_PER_PAGE)}</span>
            </div>

            <button
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(
                    Math.ceil(filteredFindings.length / ITEMS_PER_PAGE),
                    p + 1
                  )
                )
              }
              disabled={
                currentPage ===
                Math.ceil(filteredFindings.length / ITEMS_PER_PAGE)
              }
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              Next
            </button>
            <button
              onClick={() =>
                setCurrentPage(
                  Math.ceil(filteredFindings.length / ITEMS_PER_PAGE)
                )
              }
              disabled={
                currentPage ===
                Math.ceil(filteredFindings.length / ITEMS_PER_PAGE)
              }
              className="p-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-white rounded border border-transparent hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Last page"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
