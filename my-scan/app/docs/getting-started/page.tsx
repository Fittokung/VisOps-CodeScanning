// my-scan/app/docs/getting-started/page.tsx
"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function GettingStartedPage() {
  const toc = [
    { title: "Introduction", href: "#introduction" },
    { title: "Setup & Configuration", href: "#setup" },
    { title: "Quick Start", href: "#quick-start" },
  ];

  return (
    <div className="w-full">
      {/* Sticky Breadcrumb */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 lg:px-8 py-3">
        <nav className="flex items-center text-sm text-slate-500 dark:text-slate-400">
          <span>Docs</span>
          <ChevronRight size={14} className="mx-2" />
          <span className="font-medium text-slate-900 dark:text-white">Getting Started</span>
        </nav>
      </div>

      {/* Main Content - Full Width */}
      <div className="flex gap-6 px-6 lg:px-8 py-6">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
            Getting Started
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mb-10 leading-7 max-w-3xl">
            VisScan Secure Pipeline คือแพลตฟอร์ม DevSecOps แบบครบวงจร
            ที่ช่วยให้คุณตรวจสอบความปลอดภัยของ Source Code และ Container Image
            ได้อย่างอัตโนมัติ
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            {/* Introduction */}
            <section id="introduction" className="mb-12 scroll-mt-24">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                Introduction
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                    Multi-Scanner Engine
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-6">
                    รวม Gitleaks, Semgrep และ Trivy เพื่อตรวจจับ Secrets
                    และช่องโหว่ครบวงจรในครั้งเดียว
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                    Automated Build
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-6">
                    CI/CD Pipeline ที่จะทำการ Build Docker Image และ Push ขึ้น
                    Registry โดยอัตโนมัติเมื่อผ่านการตรวจสอบ
                  </p>
                </div>
              </div>
            </section>

            {/* Setup */}
            <section id="setup" className="mb-12 scroll-mt-24">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                Setup & Configuration
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                ในการใช้งานระบบจำเป็นต้องเชื่อมต่อบัญชี GitHub และ Docker Hub
                เพื่อให้ระบบสามารถเข้าถึง Source Code และจัดการ Image ได้
              </p>

              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <strong className="text-slate-900 dark:text-white">Access Settings</strong>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      ไปที่หน้า{" "}
                      <Link href="/settings" className="text-blue-600 dark:text-blue-400 hover:underline">
                        Settings
                      </Link>{" "}
                      ของโปรเจกต์เพื่อเริ่มตั้งค่า
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold">2</div>
                  <div className="flex-1">
                    <strong className="text-slate-900 dark:text-white">Connect GitHub Account</strong>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-3">
                      กรอก <strong>GitHub Username</strong> และ <strong>Personal Access Token (PAT)</strong>
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-sm">
                      <p className="font-medium text-slate-900 dark:text-white mb-2">วิธีขอ GitHub Token:</p>
                      <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                        <li>ไปที่ <strong>Settings</strong> {">"} <strong>Developer settings</strong> {">"} <strong>Personal access tokens</strong></li>
                        <li>กด <strong>Generate new token</strong></li>
                        <li>เลือก scopes: <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">repo</code>, <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">write:packages</code></li>
                        <li>กด Generate token และคัดลอกมาใช้งาน</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold">3</div>
                  <div className="flex-1">
                    <strong className="text-slate-900 dark:text-white">Configure Docker Registry (Optional)</strong>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-3">
                      หากต้องการใช้งานโหมด Scan & Build ต้องกรอก <strong>Docker Hub Username</strong> และ <strong>Access Token</strong>
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-sm">
                      <p className="font-medium text-slate-900 dark:text-white mb-2">วิธีขอ Docker Hub Token:</p>
                      <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                        <li>ล็อกอินเข้า Docker Hub ไปที่ <strong>Account Settings</strong> {">"} <strong>Security</strong></li>
                        <li>กดปุ่ม <strong>New Access Token</strong></li>
                        <li>กำหนด Access permissions เป็น <strong>Read, Write, Delete</strong></li>
                        <li>กด Generate และคัดลอก Token มาใช้งาน</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Start */}
            <section id="quick-start" className="mb-12 scroll-mt-24">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                Quick Start
              </h2>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-100 dark:border-blue-800">
                <h3 className="font-medium text-slate-900 dark:text-white mb-4">
                   Run your first scan
                </h3>
                <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                    <span>ไปที่หน้า <b>Dashboard</b> กดปุ่ม <b>New Scan</b></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                    <span>วางลิงก์ <b>Git Repository URL</b> ที่ต้องการตรวจสอบ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                    <span>เลือกโหมด <b>Security Scan Only</b></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</span>
                    <span>กด <b>Start Scan</b></span>
                  </li>
                </ol>
                <div className="mt-6">
                  <Link
                    href="/scan/scanonly"
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Go to Scan Page →
                  </Link>
                </div>
              </div>
            </section>
          </div>
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

