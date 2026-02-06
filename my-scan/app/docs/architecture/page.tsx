"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function ArchitecturePage() {
  const toc = [
    { title: "Pipeline Data Flow", href: "#data-flow" },
    { title: "Technical Stack", href: "#tech-stack" },
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
          <span className="font-medium text-slate-900 dark:text-white">Architecture</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 px-6 lg:px-8 py-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
            System Architecture
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mb-10 leading-7 max-w-3xl">
            โครงสร้างการทำงานเบื้องหลังของระบบ VisScan Pipeline ตั้งแต่รับ Input
            จนถึงการออกรายงาน
          </p>

          <section id="data-flow" className="mb-12 scroll-mt-24">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              Pipeline Data Flow
            </h2>
            <div className="space-y-3">
              {[
                { step: "01", title: "User Input", desc: "รับ Git URL และ Configuration ผ่าน Web Interface" },
                { step: "02", title: "Orchestrator", desc: "Clone source code และรัน Scanners แบบขนาน (Parallel)" },
                { step: "03", title: "Scanners Execution", desc: "เรียกใช้ Gitleaks, Semgrep, Trivy", badges: ["Gitleaks", "Semgrep", "Trivy"] },
                { step: "04", title: "Reporting", desc: "บันทึกผลลง Database และสร้าง JSON Report" },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">{item.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                      {item.badges && (
                        <div className="flex gap-2 mt-2">
                          {item.badges.map((b) => (
                            <span key={b} className="px-2 py-0.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 rounded">
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {i < 3 && <div className="flex justify-center py-1"><div className="w-px h-4 bg-slate-300 dark:bg-slate-700"></div></div>}
                </div>
              ))}
            </div>
          </section>

          <section id="tech-stack" className="mb-12 scroll-mt-24">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              Technical Stack
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-5 border border-slate-200 dark:border-slate-800">
                <h3 className="font-medium text-slate-900 dark:text-white mb-3">Application Core</h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Next.js 14 (App Router)</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500">•</span> PostgreSQL</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Prisma ORM</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500">•</span> NextAuth.js</li>
                </ul>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-5 border border-slate-200 dark:border-slate-800">
                <h3 className="font-medium text-slate-900 dark:text-white mb-3">Infrastructure</h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2"><span className="text-purple-500">•</span> Docker Engine</li>
                  <li className="flex items-center gap-2"><span className="text-purple-500">•</span> Node.js Child Process</li>
                  <li className="flex items-center gap-2"><span className="text-purple-500">•</span> Local File System (Temp Storage)</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebar - On This Page */}
        <aside className="hidden xl:block w-48 flex-shrink-0 sticky top-20 h-fit">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">On this page</p>
          <nav className="space-y-2">
            {toc.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {item.title}
              </a>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}

