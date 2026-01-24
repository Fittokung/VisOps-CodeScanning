"use client";

import ScanForm from "@/components/ScanForm";
import Link from "next/link";
import { ArrowLeft, Package, Hammer } from "lucide-react";

export default function BuildPage() {
  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
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
            <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
              <Package size={20} />
            </div>
            Scan & Build Pipeline
          </h1>
          <p className="text-slate-500 text-sm mt-2 ml-11 max-w-2xl">
            Configure a complete pipeline: Security Scan (Gitleaks, Semgrep) →
            Docker Build → Vulnerability Scan (Trivy) → Push to Registry.
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="w-full">
        <ScanForm buildMode={true} />
      </div>
    </div>
  );
}
