"use client";

import ScanForm from "@/components/ScanForm";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function ScanOnlyPage() {
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
            <div className="p-2 bg-purple-50 border border-purple-100 rounded-lg text-purple-600">
              <Shield size={20} />
            </div>
            Security Audit (Scan Only)
          </h1>
          <p className="text-slate-500 text-sm mt-2 ml-11 max-w-2xl">
            Perform a deep security analysis on your source code without
            building Docker images. Ideal for quick audits and pre-commit
            checks.
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="w-full">
        <ScanForm buildMode={false} />
      </div>
    </div>
  );
}
