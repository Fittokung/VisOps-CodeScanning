// app/scan/monorepo/page.tsx
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MonorepoWizard from "@/components/MonorepoWizard";
import { Loader2 } from "lucide-react";

function MonorepoPageContent() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repo") || "";

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <MonorepoWizard initialRepoUrl={repoUrl} />
    </div>
  );
}

export default function MonorepoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading wizard...</span>
          </div>
        </div>
      }
    >
      <MonorepoPageContent />
    </Suspense>
  );
}
