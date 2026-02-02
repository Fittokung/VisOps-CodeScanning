"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function ScanBuildGuidePage() {
  const toc = [
    { title: "Pipeline Flow", href: "#flow" },
    { title: "Prerequisites", href: "#prereq" },
    { title: "Configuration", href: "#config" },
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
          <span className="font-medium text-slate-900 dark:text-white">Guide: Scan & Build</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 px-6 lg:px-8 py-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
            Scan & Build Mode
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mb-10 leading-7 max-w-3xl">
            คู่มือการใช้งาน Pipeline เต็มรูปแบบ: สแกนโค้ด, สร้าง Docker Image, สแกน Image และ Push ขึ้น Registry
          </p>

          <section id="flow" className="mb-12 scroll-mt-24">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              Pipeline Flow
            </h2>
            <div className="space-y-3">
              {[
                { step: "1", title: "Code Scan", desc: "ตรวจสอบด้วย Gitleaks และ Semgrep" },
                { step: "2", title: "Docker Build", desc: "สร้าง Image จาก Dockerfile" },
                { step: "3", title: "Image Scan", desc: "สแกนช่องโหว่ใน Image ด้วย Trivy" },
                { step: "4", title: "Push", desc: "อัปโหลด Image ขึ้น Registry" },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="prereq" className="mb-12 scroll-mt-24">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              Prerequisites
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">Docker Registry</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">ต้องตั้งค่าบัญชี Docker Hub ในหน้า Settings ให้เรียบร้อย</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">Dockerfile</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">ต้องมีไฟล์ <code className="bg-slate-200 dark:bg-slate-700 dark:text-slate-200 px-1 rounded">Dockerfile</code> ใน Repository หรือใช้ Custom Dockerfile</p>
              </div>
            </div>
          </section>

          <section id="config" className="mb-12 scroll-mt-24">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              Configuration Options
            </h2>
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                <h3 className="font-medium text-slate-900 dark:text-white mb-1">Default Mode</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">ใช้ Dockerfile ที่มีอยู่ใน Root Directory ของ Git Repo ตามปกติ</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                <h3 className="font-medium text-slate-900 dark:text-white mb-1">Custom Dockerfile</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">เขียน Dockerfile ใหม่ผ่านหน้าเว็บได้ เหมาะสำหรับ:</p>
                <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><span className="text-blue-500">•</span> Repo ที่ไม่มี Dockerfile</li>
                  <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><span className="text-blue-500">•</span> ต้องการเปลี่ยน Base Image ชั่วคราว</li>
                </ul>
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

