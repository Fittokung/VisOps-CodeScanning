"use client";

import ScanForm from "@/components/ScanForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BuildPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header (Optional: ถ้าใน ScanForm มี Header แล้ว ลบส่วนนี้ออกก็ได้ หรือเก็บไว้เป็น Title หน้า) */}
        {/* <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Scan & Build</h1>
          <p className="text-gray-500 text-sm mt-1">
            Scan source code and build Docker image
          </p>
        </div> */}

        <ScanForm buildMode={true} />
      </div>
    </div>
  );
}
