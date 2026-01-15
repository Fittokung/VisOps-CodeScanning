"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import OnThisPage from "@/components/OnThisPage";

export default function ScanBuildGuidePage() {
  const toc = [
    { title: "Pipeline Flow", href: "#flow" },
    { title: "Prerequisites", href: "#prereq" },
    { title: "Configuration", href: "#config" },
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
            <span className="font-medium text-slate-900">
              Guide: Scan & Build
            </span>
          </nav>

          <h1 className="scroll-m-20 text-3xl font-bold tracking-tight text-slate-900 mb-6">
            Scan & Build Mode
          </h1>
          <p className="text-base text-slate-600 mb-10 leading-7">
            คู่มือการใช้งาน Pipeline เต็มรูปแบบ: สแกนโค้ด, สร้าง Docker Image,
            สแกน Image และ Push ขึ้น Registry
          </p>

          <section id="flow" className="mb-16 scroll-mt-24">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 pb-2 border-b border-slate-100">
              Pipeline Flow
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600 marker:text-slate-900">
              <li>
                <strong className="text-slate-900">Code Scan:</strong>{" "}
                ตรวจสอบด้วย Gitleaks และ Semgrep
              </li>
              <li>
                <strong className="text-slate-900">Docker Build:</strong> สร้าง
                Image จาก Dockerfile
              </li>
              <li>
                <strong className="text-slate-900">Image Scan:</strong>{" "}
                สแกนช่องโหว่ใน Image ด้วย Trivy
              </li>
              <li>
                <strong className="text-slate-900">Push:</strong> อัปโหลด Image
                ขึ้น Registry
              </li>
            </ol>
          </section>

          <section id="prereq" className="mb-16 scroll-mt-24">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Prerequisites
            </h2>
            <ul className="list-disc pl-5 space-y-4 text-sm text-slate-600 marker:text-slate-400">
              <li>
                <strong className="text-slate-900">Docker Registry:</strong>
                <span className="block mt-1">
                  ต้องตั้งค่าบัญชี Docker Hub ในหน้า Settings ให้เรียบร้อย
                </span>
              </li>
              <li>
                <strong className="text-slate-900">Dockerfile:</strong>
                <span className="block mt-1">
                  ต้องมีไฟล์ <code>Dockerfile</code> ใน Repository หรือใช้
                  Custom Dockerfile
                </span>
              </li>
            </ul>
          </section>

          <section id="config" className="mb-16 scroll-mt-24">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 pb-2 border-b border-slate-100">
              Configuration Options
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-slate-900 mb-1">
                  Default Mode
                </h3>
                <p className="text-sm text-slate-600">
                  ใช้ Dockerfile ที่มีอยู่ใน Root Directory ของ Git Repo ตามปกติ
                </p>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-1">
                  Custom Dockerfile
                </h3>
                <p className="text-sm text-slate-600 mb-2">
                  เขียน Dockerfile ใหม่ผ่านหน้าเว็บได้ เหมาะสำหรับ:
                </p>
                <ul className="list-disc pl-5 text-sm text-slate-600 marker:text-slate-400">
                  <li>Repo ที่ไม่มี Dockerfile</li>
                  <li>ต้องการเปลี่ยน Base Image ชั่วคราว</li>
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
