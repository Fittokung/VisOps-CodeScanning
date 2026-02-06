"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import AddServiceDialog from "@/components/AddServiceDialog";
import {
  Layers,
  ArrowRight,
  CheckCircle,
  Loader2,
  XCircle,
  AlertTriangle,
  GitBranch,
} from "lucide-react";

import { useScanStatus } from "@/lib/statusPoller";

type Props = {
  repoUrl: string;
  status: string;
  groupId: string;
  projectId?: string;
  scanId?: string;
};

export default function MonorepoAction({
  repoUrl,
  status: initialStatus,
  groupId,
  projectId,
  scanId,
}: Props) {
  const router = useRouter();
  
  // Real-time status checking
  const { data: pollData } = useScanStatus(3000); // Check every 3 seconds

  // Determine current status
  let status = initialStatus;
  
  if (scanId && pollData) {
    // Check active scans
    const activeScan = pollData.active?.find(s => s.scanId === scanId);
    if (activeScan) {
      status = activeScan.status;
    } else {
      // Check recently completed
      const completedScan = pollData.recentCompleted?.find(s => s.scanId === scanId);
      if (completedScan) {
        status = completedScan.status;
      }
    }
  }

  if (!repoUrl) return null;

  // Normalize status for UI
  const isPending =
    status === "PENDING" || status === "RUNNING" || status === "QUEUED" || status === "PROCESSING";
  const isFailed =
    status === "FAILED" ||
    status === "FAILED_BUILD" ||
    status === "FAILED_SECURITY" ||
    status === "CANCELLED" || 
    status === "CANCELED";
  const isSuccess = status === "SUCCESS" || status === "PASSED" || status === "MANUAL";

  return (
    <div
      className={`rounded-xl overflow-hidden mb-8 transition-all shadow-sm border
      ${
        isPending
          ? "border-blue-200 bg-blue-50"
          : isFailed
          ? "border-amber-200 bg-amber-50"
          : "border-green-200 bg-green-50"
      }
    `}
    >
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl backdrop-blur-sm shrink-0 ${
                isPending
                  ? "bg-blue-500/20 text-blue-300"
                  : isFailed
                  ? "bg-amber-500/20 text-amber-300"
                  : "bg-green-500/20 text-green-300"
              }`}
            >
              <GitBranch size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-bold text-lg text-white">
                  Multi-Service Repository
                </h3>

                {isPending && (
                  <span className="text-[10px] bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded border border-blue-500/30 flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" /> Current Job Running
                  </span>
                )}
                {isFailed && (
                  <span className="text-[10px] bg-red-500/20 text-red-200 px-2 py-0.5 rounded border border-red-500/30 flex items-center gap-1">
                    <XCircle size={10} /> Current Job Failed
                  </span>
                )}
                {isSuccess && (
                  <span className="text-[10px] bg-green-500/20 text-green-200 px-2 py-0.5 rounded border border-green-500/30 flex items-center gap-1">
                    <CheckCircle size={10} /> Ready for Next
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
                {isPending
                  ? "The current scan is running. You can configure the next service now and it will be queued automatically."
                  : isFailed
                  ? "The current job had issues, but you can still add more services from this repository."
                  : "Add another service from this repository (e.g., frontend, backend, microservices)."}
              </p>
            </div>
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <AddServiceDialog groupId={groupId} repoUrl={repoUrl} />
            <Link
              href={`/scan/monorepo?repo=${encodeURIComponent(repoUrl)}`}
              className="flex-1 lg:flex-none whitespace-nowrap flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition shadow-lg hover:shadow-indigo-500/20"
            >
              <Layers size={18} />
              Multi-Service Wizard
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 py-2.5 flex items-center gap-2 text-xs border-t border-slate-200">
        {isSuccess ? (
          <>
            <CheckCircle size={12} className="text-green-600" />
            <span className="text-green-700">
              Current job completed. Safe to proceed with next service.
            </span>
          </>
        ) : isPending ? (
          <>
            <Loader2 size={12} className="text-blue-600 animate-spin" />
            <span className="text-blue-700">
              New jobs will be queued and processed in order (FIFO).
            </span>
          </>
        ) : (
          <>
            <AlertTriangle size={12} className="text-amber-600" />
            <span className="text-amber-700">
              Check the failed job before proceeding. You may need to fix
              configuration issues.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
