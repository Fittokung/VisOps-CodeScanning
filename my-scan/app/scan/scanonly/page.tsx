// /app/scan/scanonly/page.tsx
"use client";

import ScanForm from "@/components/ScanForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ScanOnlyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Scan Only</h1>
          <p className="text-gray-500 text-sm mt-1">
            Security scan without building image
          </p>
        </div>
        <ScanForm buildMode={false} />
      </div>
    </div>
  );
}
