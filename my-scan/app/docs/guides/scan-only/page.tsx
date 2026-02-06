"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function ScanOnlyGuidePage() {
  const toc = [
    { title: "Overview", href: "#overview" },
    { title: "Walkthrough", href: "#walkthrough" },
    { title: "Understanding Results", href: "#results" },
  ];

  return (
    <div className="w-full">
      {/* Sticky Breadcrumb */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 lg:px-8 py-3">
        <nav className="flex items-center text-sm text-slate-500 dark:text-slate-400">
          <Link href="/docs/getting-started" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Docs
          </Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="font-medium text-slate-900 dark:text-white">Scan Only Guide</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 px-6 lg:px-8 py-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
            Scan Only Mode
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mb-10 leading-7 max-w-3xl">
            คู่มือการใช้งานโหมดตรวจสอบความปลอดภัยซอร์สโค้ด (Source Code Audit) โดยไม่มีการสร้าง Artifacts
          </p>

          <section id="overview" className="mb-12 scroll-mt-24">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              Use Cases
            </h2>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> ตรวจสอบความปลอดภัยเบื้องต้น (Initial Audit)</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> ตรวจสอบคุณภาพโค้ดก่อนทำ Pull Request</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> สแกนโปรเจกต์ที่ยังไม่มี Dockerfile</li>
              </ul>
            </div>
          </section>

          <section id="walkthrough" className="mb-12 scroll-mt-24">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              Walkthrough
            </h2>
            <div className="space-y-4">
              {[
                { step: "1", title: "Select Account", desc: "เลือก GitHub Account ที่มีสิทธิ์เข้าถึง Repository ที่ต้องการ" },
                { step: "2", title: "Configure Repository", desc: "ระบุ Git URL และตั้งชื่อ Service Name", code: "https://github.com/org/repo.git" },
                { step: "3", title: "Start Scan", desc: "กดปุ่ม Start Security Scan ระบบจะนำท่านไปยังหน้าผลลัพธ์ทันที" },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                    {item.code && (
                      <code className="block mt-2 bg-slate-200 dark:bg-slate-800 dark:text-slate-300 px-3 py-2 rounded text-xs font-mono">
                        {item.code}
                      </code>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="results" className="mb-12 scroll-mt-24">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              Understanding Results
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-100 dark:border-red-800">
                <h3 className="font-medium text-red-700 dark:text-red-400 mb-2">⚠ Critical Findings</h3>
                <p className="text-sm text-red-600 dark:text-red-300">สิ่งที่ต้องแก้ไขทันที เช่น Private Key หรือ API Token ที่หลุดมาในโค้ด</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                <h3 className="font-medium text-blue-700 dark:text-blue-400 mb-2">📄 Report File</h3>
                <p className="text-sm text-blue-600 dark:text-blue-300">ระบบจะสร้างไฟล์ JSON Report ให้ดาวน์โหลดเมื่อกระบวนการเสร็จสิ้น</p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <aside className="hidden xl:block w-48 flex-shrink-0 sticky top-20 h-fit">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">On this page</p>
          <nav className="space-y-2">
            {toc.map((item) => (
              <a key={item.href} href={item.href} className="block text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                {item.title}
              </a>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}

