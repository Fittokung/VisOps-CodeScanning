"use client";

import React, { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

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

export default function PipelineView({ scanId }: { scanId: string }) {
  const [run, setRun] = useState<Run | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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
      const res = await fetch(`/api/scan/status/${scanId}`);

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
    }, 3000);
    return () => clearInterval(interval);
  }, [scanId, run?.status]);

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

      await fetchStatus();
      alert("Scan cancelled successfully");
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
      {/* {isCancellable && (
        <CancelButton
          onCancel={handleCancelScan}
          isCancelling={isCancelling}
          step={run.step}
        />
      )} */}

      {isSuccess && !isBlocked && (
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
