"use client";

import React, { useEffect, useState } from "react";
import { Loader2, AlertCircle, XCircle, GitCompare } from "lucide-react";
import { useRouter } from "next/navigation";

import ConfirmBuildButton from "./ReleaseButton";
import { Run, ComparisonData } from "./pipeline/types";
import { QueuedState, CancelledState } from "./pipeline/StatusViews";
// import { CancelButton } from "./pipeline/CancelButton";
import { StatusHeader } from "./pipeline/StatusHeader";
import { SummaryCards } from "./pipeline/SummaryCards";
import { LogsPanel } from "./pipeline/LogsPanel";
import { HealthyStateBanner } from "./pipeline/HealthyStateBanner";
import { ComparisonSection } from "./pipeline/ComparisonSection";
import { CriticalVulnerabilitiesBlock } from "./pipeline/CriticalVulnerabilitiesBlock";
import { FindingsTable } from "./pipeline/FindingsTable";

export default function PipelineView({
  scanId,
  scanMode,
}: {
  scanId: string;
  scanMode?: string;
}) {
  const router = useRouter();
  const [run, setRun] = useState<Run | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCompareButton, setShowCompareButton] = useState(false);

  // Log scanMode for debugging
  console.log("🔍 PipelineView received scanMode:", scanMode);

  async function fetchComparison(serviceId: string) {
    try {
      const res = await fetch(`/api/scan/compare/${serviceId}`);
      if (res.ok) {
        const data = await res.json();
        setComparison(data);
      }
    } catch (err) {
      console.error("Failed to fetch comparison:", err);
    }
  }

  async function fetchStatus() {
    try {
      if (!scanId) return;
      // ✅ เพิ่ม cache busting เพื่อให้ได้ข้อมูล realtime ล่าสุดเสมอ
      const res = await fetch(`/api/scan/status/${scanId}?_t=${Date.now()}`, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
        cache: "no-store",
      });

      if (res.status === 404) {
        const errorData = await res.json();
        setError(errorData.details || "Pipeline not found in GitLab");
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        setError("Failed to fetch pipeline status");
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      setRun(data);
      setError(null);

      if (
        data.serviceId &&
        (data.status === "SUCCESS" ||
          data.status === "FAILED_SECURITY" ||
          data.status === "BLOCKED")
      ) {
        fetchComparison(data.serviceId);
      }
    } catch (e) {
      console.error("Polling Error:", e);
      setError("An error occurred while fetching pipeline status");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    // ✅ ลด polling interval เหลือ 2000ms (2s) เพื่อให้ realtime มากขึ้น และ sync กับ dashboard
    const interval = setInterval(() => {
      const status = run?.status?.toUpperCase();
      if (
        status !== "SUCCESS" &&
        status !== "FAILED" &&
        status !== "BLOCKED" &&
        status !== "CANCELED" &&
        status !== "CANCELLED" &&
        status !== "SKIPPED"
      ) {
        fetchStatus();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [scanId, run?.status]);

  // Check for compare intent when scan completes
  useEffect(() => {
    if (
      run?.status === "SUCCESS" ||
      run?.status === "PASSED" ||
      run?.status === "BLOCKED" ||
      run?.status === "FAILED_SECURITY"
    ) {
      const compareIntent = sessionStorage.getItem(
        `compare_after_scan_${scanId}`
      );
      if (compareIntent && run.serviceId) {
        setShowCompareButton(true);
      }
    }
  }, [run?.status, scanId, run?.serviceId]);

  const handleDownload = (reportName: string, data: any) => {
    if (!data) return alert("Report not available");
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${reportName}-report.json`;
    link.click();
  };

  const handleViewComparison = () => {
    if (run?.serviceId) {
      // Clear the intent
      sessionStorage.removeItem(`compare_after_scan_${scanId}`);
      router.push(`/scan/compare?serviceId=${run.serviceId}`);
    }
  };

  const handleCancelScan = async () => {
    if (!confirm("Are you sure you want to cancel this scan?")) return;

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/scan/cancel/${scanId}`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to cancel scan");
      }

      // Fetch updated status after cancellation
      await fetchStatus();

      // Show success message
      alert("Scan cancelled successfully. Redirecting to dashboard...");

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err: any) {
      console.error("Cancel error:", err);
      alert(err.message || "Failed to cancel scan");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading && !run) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500">Loading Report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-1">
              Pipeline Not Found
            </h3>
            <p className="text-red-700 mb-3">{error}</p>
            <p className="text-sm text-red-600">
              This pipeline (ID:{" "}
              <span className="font-mono font-semibold">{scanId}</span>) may
              have been deleted from GitLab or the project configuration is
              incorrect.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!run)
    return (
      <div className="p-6 text-center text-gray-500">Initializing Scan...</div>
    );

  const isQueued = run.status === "QUEUED" || (run as any).isQueued;
  const isScanning = run.status === "RUNNING" || run.status === "PENDING";
  const isBlocked = run.status === "BLOCKED";
  const isSuccess = run.status === "SUCCESS";
  const isCancelled = run.status === "CANCELLED" || run.status === "CANCELED";
  const isCancellable = isQueued || isScanning;
  const isScanOnly = scanMode === "SCAN_ONLY"; // ตรวจสอบว่าเป็น SCAN_ONLY หรือไม่

  console.log("🎯 PipelineView state:", {
    scanMode,
    isScanOnly,
    isSuccess,
    isBlocked,
    shouldShowRelease: !isScanOnly && isSuccess && !isBlocked,
  });

  const totalFindings =
    run.counts.critical + run.counts.high + run.counts.medium + run.counts.low;

  const gitleaksCount = Array.isArray(run.rawReports?.gitleaks)
    ? run.rawReports.gitleaks.length
    : 0;
  const isHealthy =
    isSuccess &&
    run.counts.critical === 0 &&
    run.counts.high === 0 &&
    run.counts.medium === 0 &&
    run.counts.low === 0 &&
    gitleaksCount === 0;

  if (isQueued) {
    return (
      <QueuedState onCancel={handleCancelScan} isCancelling={isCancelling} />
    );
  }

  if (isCancelled) {
    return <CancelledState scanId={scanId} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 font-sans">
      {/* Cancel Button - Always show when cancellable */}
      {isCancellable && (
        <div className="flex justify-end">
          <button
            onClick={handleCancelScan}
            disabled={isCancelling}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
          >
            {isCancelling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Cancel Scan
              </>
            )}
          </button>
        </div>
      )}

      {/* Compare Button - Show when scan completes and compare intent exists */}
      {showCompareButton && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <GitCompare className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Scan Complete!
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    View comparison with previous scan to see improvements and
                    changes
                  </p>
                </div>
              </div>
              <button
                onClick={handleViewComparison}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center gap-2 transition shadow-md hover:shadow-lg"
              >
                <GitCompare className="w-5 h-5" />
                View Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Release Button - ซ่อนสำหรับ SCAN_ONLY mode */}
      {!isScanOnly && isSuccess && !isBlocked && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <ConfirmBuildButton scanId={scanId} />
        </div>
      )}

      {/* {comparison && <ComparisonSection comparison={comparison} />} */}

      {isBlocked && run.criticalVulnerabilities && (
        <CriticalVulnerabilitiesBlock
          vulnerabilities={run.criticalVulnerabilities}
        />
      )}

      <StatusHeader
        status={run.status}
        repoUrl={run.repoUrl}
        step={run.step}
        progress={run.progress}
        isBlocked={isBlocked}
        rawReports={run.rawReports}
        onDownload={handleDownload}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          {isHealthy && <HealthyStateBanner />}
          <SummaryCards counts={run.counts} />
          <LogsPanel
            logs={run.logs}
            isSuccess={isSuccess}
            totalFindings={totalFindings}
            pipelineId={run.pipelineId}
            scanId={scanId}
            scanDuration={run.scanDuration}
          />
        </div>

        <div className="lg:col-span-2">
          <FindingsTable
            findings={run.findings}
            isScanning={isScanning}
            isSuccess={isSuccess}
            totalFindings={totalFindings}
          />
        </div>
      </div>
    </div>
  );
}
