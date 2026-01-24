"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MonorepoWizard from "@/components/MonorepoWizard";
import { Loader2, ArrowLeft, GitGraph } from "lucide-react";

function MonorepoPageContent() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repo") || "";

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <GitGraph size={20} />
            </div>
            Monorepo Configuration
          </h1>
          <p className="text-slate-500 text-sm mt-2 ml-11 max-w-2xl">
            Configure multiple services from a single repository. Auto-detect
            paths and set up individual scan pipelines.
          </p>
        </div>
      </div>

      {/* Wizard Content */}
      <div className="w-full">
        <MonorepoWizard initialRepoUrl={repoUrl} />
      </div>
    </div>
  );
}

export default function MonorepoPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-96 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500 bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Loading wizard...</span>
          </div>
        </div>
      }
    >
      <MonorepoPageContent />
    </Suspense>
  );
}
