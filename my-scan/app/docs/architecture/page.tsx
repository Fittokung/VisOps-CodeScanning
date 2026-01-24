"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import OnThisPage from "@/components/OnThisPage";

export default function ArchitecturePage() {
  const toc = [
    { title: "Pipeline Data Flow", href: "#data-flow" },
    { title: "Technical Stack", href: "#tech-stack" },
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
            <span className="font-medium text-slate-900">Architecture</span>
          </nav>

          <h1 className="scroll-m-20 text-3xl font-bold tracking-tight text-slate-900 mb-6">
            System Architecture
          </h1>
          <p className="text-base text-slate-600 mb-10 leading-7">
            โครงสร้างการทำงานเบื้องหลังของระบบ VisScan Pipeline ตั้งแต่รับ Input
            จนถึงการออกรายงาน
          </p>

          <section id="data-flow" className="mb-16 scroll-mt-24">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 pb-2 border-b border-slate-100">
              Pipeline Data Flow
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 border border-slate-200 rounded-lg bg-white">
                <div className="font-mono text-slate-400 text-sm">01</div>
                <div>
                  <h3 className="font-medium text-slate-900">User Input</h3>
                  <p className="text-sm text-slate-600">
                    รับ Git URL และ Configuration ผ่าน Web Interface
                  </p>
                </div>
              </div>
              <div className="flex justify-center py-1">
                <div className="w-px h-4 bg-slate-200"></div>
              </div>
              <div className="flex gap-4 p-4 border border-slate-200 rounded-lg bg-white">
                <div className="font-mono text-slate-400 text-sm">02</div>
                <div>
                  <h3 className="font-medium text-slate-900">Orchestrator</h3>
                  <p className="text-sm text-slate-600">
                    Clone source code และรัน Scanners แบบขนาน (Parallel)
                  </p>
                </div>
              </div>
              <div className="flex justify-center py-1">
                <div className="w-px h-4 bg-slate-200"></div>
              </div>
              <div className="flex gap-4 p-4 border border-slate-200 rounded-lg bg-white">
                <div className="font-mono text-slate-400 text-sm">03</div>
                <div>
                  <h3 className="font-medium text-slate-900">
                    Scanners Execution
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">
                    เรียกใช้เครื่องมือตาม Config:
                  </p>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs border border-slate-100 rounded">
                      Gitleaks
                    </span>
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs border border-slate-100 rounded">
                      Semgrep
                    </span>
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs border border-slate-100 rounded">
                      Trivy
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center py-1">
                <div className="w-px h-4 bg-slate-200"></div>
              </div>
              <div className="flex gap-4 p-4 border border-slate-200 rounded-lg bg-white">
                <div className="font-mono text-slate-400 text-sm">04</div>
                <div>
                  <h3 className="font-medium text-slate-900">Reporting</h3>
                  <p className="text-sm text-slate-600">
                    บันทึกผลลง Database และสร้าง JSON Report
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="tech-stack" className="mb-16 scroll-mt-24">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 pb-2 border-b border-slate-100">
              Technical Stack
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-medium text-slate-900 mb-3">
                  Application Core
                </h3>
                <ul className="list-disc pl-4 space-y-1 text-sm text-slate-600 marker:text-slate-300">
                  <li>Next.js 14 (App Router)</li>
                  <li>PostgreSQL</li>
                  <li>Prisma ORM</li>
                  <li>NextAuth.js</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-3">
                  Infrastructure
                </h3>
                <ul className="list-disc pl-4 space-y-1 text-sm text-slate-600 marker:text-slate-300">
                  <li>Docker Engine</li>
                  <li>Node.js Child Process</li>
                  <li>Local File System (Temp Storage)</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        <OnThisPage links={toc} />
      </div>
    </div>
  );
}
