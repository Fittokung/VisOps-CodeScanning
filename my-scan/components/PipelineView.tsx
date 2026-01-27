"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Loader2, AlertCircle, XCircle, GitCompare } from "lucide-react";
import { useRouter } from "next/navigation";

import ConfirmBuildButton from "./ReleaseButton";
import { Run, ComparisonData } from "./pipeline/types";
import { QueuedState, CancelledState } from "./pipeline/StatusViews";
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

  // Helper to fetch comparison data
  const fetchComparison = useCallback(async (serviceId: string) => {
    try {
      const res = await fetch(`/api/scan/compare/${serviceId}`);
      if (res.ok) {
        const data = await res.json();
        setComparison(data);
      }
    } catch (err) {
      console.error("Failed to fetch comparison:", err);
    }
  }, []);

  // ✅ 1. ฟังก์ชันโหลดข้อมูลปกติ (Load Local Data)
  const fetchStatus = useCallback(async () => {
    try {
      if (!scanId) return;
      const res = await fetch(`/api/scan/${scanId}?_t=${Date.now()}`, {
        headers: { "Cache-Control": "no-store" },
        cache: "no-store",
      });

      if (res.status === 404) {
        const errorData = await res.json();
        setError(errorData.details || "Pipeline not found");
        setIsLoading(false);
        return;
      }

      if (!res.ok) return;

      const data = await res.json();
      setRun(data);
      setError(null);
      setIsLoading(false);

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
    }
  }, [scanId, fetchComparison]);

  // ✅ 2. ฟังก์ชัน Auto-Sync (เรียก API POST เพื่อดึงจาก GitLab)
  const autoSyncGitLab = useCallback(async () => {
    try {
      // เรียก API ที่เราเพิ่งรวมไฟล์ไป (POST /api/scan/[id])
      // เพื่อสั่งให้ Backend ไปถาม GitLab เดี๋ยวนี้
      await fetch(`/api/scan/${scanId}`, { method: "POST" });

      // พอถามเสร็จ ก็โหลดข้อมูลล่าสุดมาโชว์
      await fetchStatus();
    } catch (e) {
      console.error("Auto-sync failed:", e);
    }
  }, [scanId, fetchStatus]);

  // ✅ 3. The "Automator" Effect (หัวใจสำคัญ)
  useEffect(() => {
    // โหลดครั้งแรกทันทีที่เข้าหน้า
    fetchStatus();

    // ตั้งเวลาทำงานทุกๆ 3 วินาที
    const interval = setInterval(() => {
      const status = run?.status?.toUpperCase();

      // เช็คว่าจบงานหรือยัง?
      const isFinalState =
        status === "SUCCESS" ||
        status === "FAILED" ||
        status === "BLOCKED" ||
        status === "CANCELED" ||
        status === "CANCELLED" ||
        status === "SKIPPED" ||
        status === "FAILED_SECURITY";

      if (!isFinalState) {
        // ✨ ถ้ายังไม่จบ -> สั่ง Sync อัตโนมัติเลย!
        console.log("🔄 Auto-syncing with GitLab...");
        autoSyncGitLab();
      } else {
        // ถ้าจบแล้ว -> หยุดเรียก (เพื่อประหยัดทรัพยากร)
        // แต่ยังเรียก fetchStatus ธรรมดาเผื่อมีการอัปเดตหน้าจออื่น
        fetchStatus();
      }
    }, 3000);

    // Clear timer เมื่อออกจากหน้า
    return () => clearInterval(interval);
  }, [fetchStatus, autoSyncGitLab, run?.status]);

  // Check for compare intent
  useEffect(() => {
    const status = run?.status;
    if (
      status === "SUCCESS" ||
      status === "PASSED" ||
      status === "BLOCKED" ||
      status === "FAILED_SECURITY"
    ) {
      const compareIntent = sessionStorage.getItem(
        `compare_after_scan_${scanId}`,
      );
      if (compareIntent && run?.serviceId) {
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
      sessionStorage.removeItem(`compare_after_scan_${scanId}`);
      router.push(`/scan/compare?serviceId=${run.serviceId}`);
    }
  };

  const handleCancelScan = async () => {
    if (!confirm("Are you sure you want to cancel this scan?")) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/scan/cancel/${scanId}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to cancel scan");
      await autoSyncGitLab(); // Sync ทันทีหลังกดยกเลิก
    } catch (err: any) {
      console.error("Cancel error:", err);
      alert(err.message || "Failed to cancel scan");
    } finally {
      setIsCancelling(false);
    }
  };

  // --- RENDER STATES ---

  if (isLoading && !run) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-700">
          Connecting to Pipeline...
        </h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-1">
              Pipeline Not Found
            </h3>
            <p className="text-red-700 mb-3">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm font-medium text-red-700 hover:text-red-900 underline"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!run) return null;

  const isQueued =
    run.status === "QUEUED" ||
    run.status === "PENDING" ||
    (run as any).isQueued;
  const isScanning = run.status === "RUNNING" || run.status === "PROCESSING";
  const isBlocked = run.status === "BLOCKED";
  const isSuccess = run.status === "SUCCESS";
  const isCancelled = run.status === "CANCELLED" || run.status === "CANCELED";
  const isCancellable = isQueued || isScanning;
  const isScanOnly = scanMode === "SCAN_ONLY" || run.scanMode === "SCAN_ONLY";

  const totalFindings =
    run.counts.critical + run.counts.high + run.counts.medium + run.counts.low;
  const gitleaksCount = Array.isArray(run.rawReports?.gitleaks)
    ? run.rawReports.gitleaks.length
    : 0;
  const isHealthy = isSuccess && totalFindings === 0 && gitleaksCount === 0;

  console.log("[PipelineView Debug]", {
      propScanMode: scanMode,
      dbScanMode: run.scanMode,
      status: run.status,
      isScanOnly,
      isSuccess,
      isBlocked,
      renderButton: !isScanOnly && isSuccess && !isBlocked
  });

  if (isQueued) {
    return (
      <QueuedState onCancel={handleCancelScan} isCancelling={isCancelling} />
    );
  }

  if (isCancelled) {
    return <CancelledState scanId={scanId} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 font-sans animate-in fade-in duration-500">
      {/* Action Bar: เหลือแค่ปุ่ม Cancel (ปุ่ม Sync หายไปแล้ว เพราะระบบทำให้เอง) */}
      <div className="flex justify-end gap-2">
        {isCancellable && (
          <button
            onClick={handleCancelScan}
            disabled={isCancelling}
            className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition text-sm font-medium shadow-sm"
          >
            {isCancelling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {isCancelling ? "Stopping..." : "Cancel Scan"}
          </button>
        )}
      </div>

      {showCompareButton && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-full shadow-sm">
              <GitCompare className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Scan Complete</h3>
              <p className="text-gray-600 text-sm">
                Compare with previous results available
              </p>
            </div>
          </div>
          <button
            onClick={handleViewComparison}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center gap-2 transition shadow-sm"
          >
            <GitCompare className="w-4 h-4" />
            Compare Results
          </button>
        </div>
      )}

      {/* ปุ่ม Release จะโผล่มาเองอัตโนมัติเมื่อ isSuccess เป็นจริง */}
      {!isScanOnly && (isSuccess || run.status?.toUpperCase() === "MANUAL") && !isBlocked && (
        <ConfirmBuildButton 
            scanId={scanId} 
            status={run.status} 
            vulnCount={run.counts.critical} 
            imagePushed={(run as any).imagePushed}
        />
      )}

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

        <div className="lg:col-span-2 space-y-6">
          {comparison && <ComparisonSection comparison={comparison} />}
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
