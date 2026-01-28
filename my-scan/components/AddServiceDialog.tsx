"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, AlertCircle, Package } from "lucide-react";
import SimpleTooltip from "@/components/ui/Tooltip";
import DuplicateServiceWarning from "@/components/DuplicateServiceWarning";

interface AddServiceDialogProps {
  groupId: string;
  repoUrl: string;
  onClose?: () => void;
  iconOnly?: boolean;
}

// Helper: Extract repo name from URL
const extractRepoName = (url: string): string => {
  const cleanUrl = url.replace(/\.git$/, "").replace(/\/$/, "");
  const parts = cleanUrl.split(/[\/:]/);
  return (
    parts[parts.length - 1]?.toLowerCase().replace(/[^a-z0-9-]/g, "") || ""
  );
};

// Helper: Generate Docker image name from repo + context
const generateImageName = (repoUrl: string, contextPath: string): string => {
  const repoName = extractRepoName(repoUrl);
  if (contextPath && contextPath !== ".") {
    const suffix = contextPath
      .replace(/\//g, "-")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
    return `${repoName}-${suffix}`;
  }
  return repoName;
};

export default function AddServiceDialog({
  groupId,
  repoUrl,
  onClose,
  iconOnly = false,
}: AddServiceDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [serviceName, setServiceName] = useState("");
  const [contextPath, setContextPath] = useState(".");
  const [imageName, setImageName] = useState("");

  // Duplicate detection state
  const [duplicateService, setDuplicateService] = useState<any>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Step 1: Add service to project
      const finalImageName =
        imageName.trim() || generateImageName(repoUrl, contextPath.trim());

      const addServiceRes = await fetch("/api/projects/add-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          serviceName: serviceName.trim(),
          contextPath: contextPath.trim(),
          imageName: finalImageName,
        }),
      });

      if (!addServiceRes.ok) {
        const errorData = await addServiceRes.json();
        
        // Check if it's a duplicate error
        if (addServiceRes.status === 409 && errorData.isDuplicate) {
          setDuplicateService(errorData.existingService);
          setShowDuplicateWarning(true);
          setLoading(false);
          return;
        }
        
        throw new Error(errorData.error || "Failed to add service");
      }

      const { serviceId } = await addServiceRes.json();

      // Step 2: Start scan for the new service
      const startScanRes = await fetch("/api/scan/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          scanMode: "SCAN_AND_BUILD",
          imageTag: "latest",
        }),
      });

      if (!startScanRes.ok) {
        const errorData = await startScanRes.json();
        throw new Error(errorData.error || "Failed to start scan");
      }

      const { pipelineId } = await startScanRes.json();

      // Call onClose callback if provided
      onClose?.();

      // Step 3: Redirect to scan page
      router.push(`/scan/${pipelineId}`);
    } catch (err) {
      console.error("Error adding service:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setIsOpen(false);
      setServiceName("");
      setContextPath(".");
      setImageName("");
      setError(null);
      onClose?.();
    }
  };

  const handleContextPathChange = (value: string) => {
    setContextPath(value);
    if (!imageName) {
      const generated = generateImageName(repoUrl, value);
      setImageName(generated);
    }
  };

  return (
    <>
      {/* ✅ Trigger Button Logic with Tooltip */}
      {iconOnly ? (
        <SimpleTooltip content="Add New Service">
          <button
            onClick={() => setIsOpen(true)}
            className="text-slate-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors"
          >
            <Plus size={16} />
          </button>
        </SimpleTooltip>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-xs font-medium shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Service
        </button>
      )}

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleClose}
        >
          {/* Modal Content */}
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Add New Service
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add a service to this monorepo project
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Repository Info */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs font-medium text-gray-500 mb-1">
                  REPOSITORY
                </div>
                <div className="text-sm text-gray-700 font-mono truncate">
                  {repoUrl}
                </div>
              </div>

              {/* Service Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g., frontend, api, auth-service"
                  required
                  disabled={loading}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  A unique name for this service within the project
                </p>
              </div>

              {/* Context Path */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Build Directory / Context Path
                </label>
                <input
                  type="text"
                  value={contextPath}
                  onChange={(e) => handleContextPathChange(e.target.value)}
                  placeholder="."
                  disabled={loading}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Path to the service folder (default: <code>.</code> for root)
                </p>
              </div>

              {/* Docker Image Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Docker Image Name
                </label>
                <input
                  type="text"
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  placeholder="Auto-generated from repo and path"
                  disabled={loading}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Docker Hub image name (leave empty for auto-generation)
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-red-800">
                      Error
                    </div>
                    <div className="text-sm text-red-700 mt-0.5">{error}</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !serviceName.trim()}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add & Scan
                    </>
                  )}
                </button>
              </div>

              {/* Info Note */}
              {loading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs text-blue-700">
                    <div className="font-medium mb-1">⏳ Processing...</div>
                    <div>
                      Creating service and starting security scan. You'll be
                      redirected to the scan results shortly.
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Warning Dialog */}
      {showDuplicateWarning && duplicateService && (
        <DuplicateServiceWarning
          existingService={duplicateService}
          mode="add-service"
          onViewExisting={() => {
            setShowDuplicateWarning(false);
            setIsOpen(false);
            router.push(`/dashboard?highlight=${duplicateService.id}`);
          }}
          onRescan={async () => {
            setShowDuplicateWarning(false);
            setLoading(true);
            try {
              const res = await fetch("/api/scan/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  serviceId: duplicateService.id,
                  scanMode: "SCAN_AND_BUILD",
                  imageTag: "latest",
                }),
              });
              
              if (res.ok) {
                const { scanId } = await res.json();
                setIsOpen(false);
                router.push(`/scan/${scanId}`);
              } else {
                throw new Error("Failed to start scan");
              }
            } catch (err) {
              setError("Failed to start re-scan");
              setLoading(false);
            }
          }}
          onCancel={() => {
            setShowDuplicateWarning(false);
            setLoading(false);
          }}
        />
      )}
    </>
  );
}
