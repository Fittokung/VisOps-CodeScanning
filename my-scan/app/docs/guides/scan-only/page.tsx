"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import OnThisPage from "@/components/OnThisPage";

export default function ScanOnlyGuidePage() {
  const toc = [
    { title: "Overview", href: "#overview" },
    { title: "Walkthrough", href: "#walkthrough" },
    { title: "Results", href: "#results" },
  ];

  return (
    <div className="px-6 lg:px-8">
      <div className="mx-auto max-w-7xl xl:grid xl:grid-cols-[1fr_250px] xl:gap-8">
        <div className="min-w-0">
          <nav className="flex items-center text-sm text-slate-500 mb-6">
            <Link
              href="/docs/getting-started"
              className="hover:text-slate-900 transition-colors"
            >
              Docs
            </Link>
            <ChevronRight size={14} className="mx-2" />
            <span className="font-medium text-slate-900">Scan Only Guide</span>
          </nav>

          <h1 className="scroll-m-20 text-3xl font-bold tracking-tight text-slate-900 mb-6">
            Scan Only Mode
          </h1>
          <p className="text-base text-slate-600 mb-10 leading-7">
            คู่มือการใช้งานโหมดตรวจสอบความปลอดภัยซอร์สโค้ด (Source Code Audit)
            โดยไม่มีการสร้าง Artifacts
          </p>

          <section id="overview" className="mb-12 scroll-mt-24">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">
              Use Cases
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 marker:text-slate-400">
              <li>ตรวจสอบความปลอดภัยเบื้องต้น (Initial Audit)</li>
              <li>ตรวจสอบคุณภาพโค้ดก่อนทำ Pull Request</li>
              <li>สแกนโปรเจกต์ที่ยังไม่มี Dockerfile</li>
            </ul>
          </section>

          <section id="walkthrough" className="mb-16 scroll-mt-24">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 pb-2 border-b border-slate-100">
              Walkthrough
            </h2>
            <ol className="list-decimal pl-5 space-y-6 text-slate-600 marker:text-slate-900 marker:font-medium">
              <li>
                <h3 className="text-sm font-bold text-slate-900 inline">
                  Select Account
                </h3>
                <p className="text-sm mt-1">
                  เลือก GitHub Account ที่มีสิทธิ์เข้าถึง Repository ที่ต้องการ
                </p>
              </li>
              <li>
                <h3 className="text-sm font-bold text-slate-900 inline">
                  Configure Repository
                </h3>
                <p className="text-sm mt-1">
                  ระบุ Git URL และตั้งชื่อ Service Name
                </p>
                <code className="block mt-2 bg-slate-50 px-3 py-2 rounded text-xs font-mono border border-slate-100">
                  https://github.com/org/repo.git
                </code>
              </li>
              <li>
                <h3 className="text-sm font-bold text-slate-900 inline">
                  Start Scan
                </h3>
                <p className="text-sm mt-1">
                  กดปุ่ม Start Security Scan ระบบจะนำท่านไปยังหน้าผลลัพธ์ทันที
                </p>
              </li>
            </ol>
          </section>

          <section id="results" className="mb-16 scroll-mt-24">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 pb-2 border-b border-slate-100">
              Understanding Results
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-slate-900 mb-1">
                  Critical Findings
                </h3>
                <p className="text-sm text-slate-600">
                  สิ่งที่ต้องแก้ไขทันที เช่น Private Key หรือ API Token
                  ที่หลุดมาในโค้ด
                </p>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-1">Report File</h3>
                <p className="text-sm text-slate-600">
                  ระบบจะสร้างไฟล์ JSON Report
                  ให้ดาวน์โหลดเมื่อกระบวนการเสร็จสิ้น
                </p>
              </div>
            </div>
          </section>
        </div>

        <OnThisPage links={toc} />
      </div>
    </div>
  );
}
