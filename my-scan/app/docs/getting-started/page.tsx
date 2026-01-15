"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import OnThisPage from "@/components/OnThisPage";

export default function GettingStartedPage() {
  const toc = [
    { title: "Introduction", href: "#introduction" },
    { title: "Setup & Configuration", href: "#setup" },
    { title: "Quick Start", href: "#quick-start" },
  ];

  return (
    <div className="px-6 lg:px-8">
      <div className="mx-auto max-w-7xl xl:grid xl:grid-cols-[1fr_250px] xl:gap-8">
        <div className="min-w-0">
          <nav className="flex items-center text-sm text-slate-500 mb-6">
            <span>Docs</span>
            <ChevronRight size={14} className="mx-2" />
            <span className="font-medium text-slate-900">Getting Started</span>
          </nav>

          <h1 className="scroll-m-20 text-3xl font-bold tracking-tight text-slate-900 mb-6">
            Getting Started
          </h1>
          <p className="text-base text-slate-600 mb-10 leading-7">
            VisOps Secure Pipeline คือแพลตฟอร์ม DevSecOps แบบครบวงจร
            ที่ช่วยให้คุณตรวจสอบความปลอดภัยของ Source Code และ Container Image
            ได้อย่างอัตโนมัติ
          </p>

          <div className="prose prose-slate max-w-none">
            {/* Introduction */}
            <section id="introduction" className="mb-16 scroll-mt-24">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Introduction
              </h2>
              <div className="space-y-6 text-slate-600">
                <div>
                  <h3 className="font-medium text-slate-900 mb-1">
                    Multi-Scanner Engine
                  </h3>
                  <p className="text-sm leading-6">
                    รวม Gitleaks, Semgrep และ Trivy เพื่อตรวจจับ Secrets
                    และช่องโหว่ครบวงจรในครั้งเดียว
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 mb-1">
                    Automated Build
                  </h3>
                  <p className="text-sm leading-6">
                    CI/CD Pipeline ที่จะทำการ Build Docker Image และ Push ขึ้น
                    Registry โดยอัตโนมัติเมื่อผ่านการตรวจสอบ
                  </p>
                </div>
              </div>
            </section>

            {/* Setup */}
            <section id="setup" className="mb-16 scroll-mt-24">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Setup & Configuration
              </h2>
              <ol className="list-decimal pl-5 space-y-4 text-slate-600 marker:text-slate-400">
                <li>
                  <strong className="text-slate-900">Access Settings</strong>
                  <p className="text-sm mt-1">
                    ไปที่หน้า{" "}
                    <Link
                      href="/settings"
                      className="text-blue-600 hover:underline"
                    >
                      Settings
                    </Link>{" "}
                    ของโปรเจกต์
                  </p>
                </li>
                <li>
                  <strong className="text-slate-900">Connect GitHub</strong>
                  <p className="text-sm mt-1">
                    เพิ่ม Personal Access Token (PAT) ที่มีสิทธิ์{" "}
                    <code>repo</code> scope
                  </p>
                </li>
                <li>
                  <strong className="text-slate-900">
                    Configure Registry (Optional)
                  </strong>
                  <p className="text-sm mt-1">
                    เพิ่มบัญชี Docker Hub หากต้องการใช้งานฟีเจอร์ Build Image
                  </p>
                </li>
              </ol>
            </section>

            {/* Quick Start */}
            <section id="quick-start" className="mb-16 scroll-mt-24">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Quick Start
              </h2>
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="font-medium text-slate-900 mb-4">
                  Run your first scan
                </h3>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 marker:text-slate-400">
                  <li>
                    ไปที่หน้า <b>Dashboard</b> กดปุ่ม <b>New Scan</b>
                  </li>
                  <li>
                    วางลิงก์ <b>Git Repository URL</b> ที่ต้องการตรวจสอบ
                  </li>
                  <li>
                    เลือกโหมด <b>Security Scan Only</b>
                  </li>
                  <li>
                    กด <b>Start Scan</b>
                  </li>
                </ol>
                <div className="mt-6">
                  <Link
                    href="/scan/scanonly"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Go to Scan Page &rarr;
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>

        <OnThisPage links={toc} />
      </div>
    </div>
  );
}
