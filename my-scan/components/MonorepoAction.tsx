"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import AddServiceDialog from "@/components/AddServiceDialog";
import {
  Layers,
  ArrowRight,
  CheckCircle2,
  Loader2,
  XCircle,
  AlertTriangle,
  GitBranch,
  Plus,
} from "lucide-react";

type Props = {
  repoUrl: string;
  status: string;
  groupId: string;
  projectId?: string;
  scanId?: string;
};

export default function MonorepoAction({
  repoUrl,
  status,
  groupId,
  projectId,
  scanId,
}: Props) {
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
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-8">
      <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        
        {/* Left: Icon & Info */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 shrink-0">
            <GitBranch size={24} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              Multi-Service Repository
              {isPending && <Loader2 size={14} className="animate-spin text-blue-500" />}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              This project is part of a monorepo. You can add more services (e.g., backend, frontend) from the same repository to track them together.
            </p>
            
            {/* Status Context Helper */}
            <div className="mt-3 flex items-center gap-2 text-xs">
                 {isSuccess ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                        <CheckCircle2 size={12} />
                        Current job complete. Ready for next service.
                    </span>
                 ) : isPending ? (
                    <span className="flex items-center gap-1.5 text-blue-600 font-medium bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                        <Loader2 size={12} className="animate-spin" />
                        Scan in progress. New services will be queued.
                    </span>
                 ) : (
                    <span className="flex items-center gap-1.5 text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                        <AlertTriangle size={12} />
                        Current job failed. Check issues before adding more.
                    </span>
                 )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
            {/* Secondary Action: Wizard Link (Optional/Advanced) */}
            <Link
              href={`/scan/monorepo?repo=${encodeURIComponent(repoUrl)}`}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition flex items-center gap-2 border border-transparent hover:border-slate-200"
            >
              <Layers size={16} />
              <span>Full Wizard</span>
            </Link>

            {/* Primary Action: Add Service Dialog */}
            <div className="relative">
                <AddServiceDialog groupId={groupId} repoUrl={repoUrl} />
            </div>
        </div>

      </div>
    </div>
  );
}
