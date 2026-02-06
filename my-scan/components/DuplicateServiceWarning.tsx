"use client";

import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  RefreshCw,
  X,
  Shield,
  Package,
  GitBranch,
  Folder,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface LastScan {
  id: string;
  pipelineId: string | null;
  status: string;
  imageTag: string;
  startedAt: Date | null;
  vulnCritical: number;
  vulnHigh: number;
}

interface ExistingService {
  id: string;
  serviceName: string;
  imageName: string;
  contextPath: string;
  groupId: string;
  groupName: string;
  repoUrl: string;
  lastScan?: LastScan;
}

interface DuplicateServiceWarningProps {
  existingService: ExistingService;
  onViewExisting?: () => void;
  onRescan?: () => void;
  onCreateAnyway?: () => void;
  onCancel: () => void;
  mode?: "add-service" | "standalone-scan";
}

export default function DuplicateServiceWarning({
  existingService,
  onViewExisting,
  onRescan,
  onCreateAnyway,
  onCancel,
  mode = "standalone-scan",
}: DuplicateServiceWarningProps) {
  const router = useRouter();

  const handleViewExisting = () => {
    if (onViewExisting) {
      onViewExisting();
    } else {
      // Default: Navigate to dashboard and highlight the service
      router.push(`/dashboard?highlight=${existingService.id}`);
    }
  };

  const handleRescan = () => {
    if (onRescan) {
      onRescan();
    } else {
      // Default: Navigate to dashboard (user can re-scan from there)
      router.push(`/dashboard?rescan=${existingService.id}`);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "SUCCESS") return "text-emerald-600 bg-emerald-50";
    if (status.includes("FAILED")) return "text-red-600 bg-red-50";
    if (["RUNNING", "QUEUED"].includes(status))
      return "text-blue-600 bg-blue-50";
    return "text-slate-600 bg-slate-50";
  };

  const getStatusIcon = (status: string) => {
    if (status === "SUCCESS") return "✓";
    if (status.includes("FAILED")) return "✗";
    if (["RUNNING", "QUEUED"].includes(status)) return "⟳";
    return "○";
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-orange-900">
                  Service Already Exists
                </h3>
                <p className="text-sm text-orange-700 mt-0.5">
                  A similar service configuration was found
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-orange-400 hover:text-orange-600 transition-colors p-1 rounded-lg hover:bg-orange-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Service Details */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
            <div className="flex items-center gap-2 text-sm">
              <Package size={16} className="text-slate-500 flex-shrink-0" />
              <span className="font-semibold text-slate-700">
                {existingService.serviceName}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <GitBranch size={16} className="text-slate-400 flex-shrink-0" />
              <span className="truncate font-mono text-xs">
                {existingService.repoUrl.replace("https://github.com/", "")}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Folder size={16} className="text-slate-400 flex-shrink-0" />
              <span className="font-mono text-xs">
                {existingService.contextPath}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <div className="text-xs text-slate-500 mb-1.5">
                Project: {existingService.groupName}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Image: {existingService.imageName}
              </div>
            </div>
          </div>

          {/* Last Scan Info */}
          {existingService.lastScan && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">
                    Last Scan
                  </span>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(existingService.lastScan.status)}`}
                >
                  {getStatusIcon(existingService.lastScan.status)}{" "}
                  {existingService.lastScan.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Tag:</span>
                  <span className="ml-1 font-mono font-semibold text-slate-700">
                    {existingService.lastScan.imageTag}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">When:</span>
                  <span className="ml-1 font-semibold text-slate-700">
                    {formatDate(existingService.lastScan.startedAt)}
                  </span>
                </div>
              </div>

              {(existingService.lastScan.vulnCritical > 0 ||
                existingService.lastScan.vulnHigh > 0) && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-blue-200">
                  {existingService.lastScan.vulnCritical > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">
                      {existingService.lastScan.vulnCritical} Critical
                    </span>
                  )}
                  {existingService.lastScan.vulnHigh > 0 && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">
                      {existingService.lastScan.vulnHigh} High
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Suggestion */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-900">
              <AlertCircle size={14} className="inline mr-1.5" />
              {mode === "add-service"
                ? "This service already exists in your project. You can view or re-scan it instead of creating a duplicate."
                : "You can re-scan the existing service or create a new project anyway."}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleViewExisting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Eye size={16} />
            View Existing
          </button>

          {onRescan && (
            <button
              onClick={handleRescan}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
            >
              <RefreshCw size={16} />
              Re-scan
            </button>
          )}

          {onCreateAnyway && (
            <button
              onClick={onCreateAnyway}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-700 bg-orange-100 border border-orange-300 rounded-lg hover:bg-orange-200 transition-colors"
            >
              Create Anyway
            </button>
          )}

          <button
            onClick={onCancel}
            className="sm:hidden w-full px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
