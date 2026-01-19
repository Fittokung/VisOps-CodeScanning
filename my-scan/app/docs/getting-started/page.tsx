// my-scan/app/docs/guides/scan-only/page.tsx
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
            VisScan Secure Pipeline คือแพลตฟอร์ม DevSecOps แบบครบวงจร
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
              <p className="text-sm text-slate-600 mb-6">
                ในการใช้งานระบบจำเป็นต้องเชื่อมต่อบัญชี GitHub และ Docker Hub
                เพื่อให้ระบบสามารถเข้าถึง Source Code และจัดการ Image ได้
              </p>

              <ol className="list-decimal pl-5 space-y-8 text-slate-600 marker:text-slate-400">
                {/* Step 1 */}
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
                    ของโปรเจกต์เพื่อเริ่มตั้งค่า
                  </p>
                </li>

                {/* Step 2 */}
                <li>
                  <strong className="text-slate-900">
                    Connect GitHub Account
                  </strong>
                  <p className="text-sm mt-1 mb-3">
                    กรอก <strong>GitHub Username</strong> และ{" "}
                    <strong>Personal Access Token (PAT)</strong>
                  </p>

                  <div className="bg-slate-50 border border-slate-200 rounded p-4 text-sm">
                    <p className="font-medium text-slate-900 mb-2">
                      วิธีขอ GitHub Token:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                      <li>
                        ไปที่ <strong>Settings</strong> {">"}{" "}
                        <strong>Developer settings</strong> {">"}{" "}
                        <strong>Personal access tokens (Tokens classic)</strong>
                      </li>
                      <li>
                        กด <strong>Generate new token</strong> (Generate new
                        token (classic))
                      </li>
                      <li>
                        ในส่วน Select scopes ให้เลือก:
                        <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-500">
                          <li>
                            <code>repo</code> (Full control of private
                            repositories)
                          </li>
                          <li>
                            <code>write:packages</code> (Upload packages)
                          </li>
                          <li>
                            <code>delete:packages</code> (Delete packages)
                          </li>
                        </ul>
                      </li>
                      <li>กด Generate token และคัดลอกมาใช้งาน</li>
                    </ol>
                  </div>
                </li>

                {/* Step 3 */}
                <li>
                  <strong className="text-slate-900">
                    Configure Docker Registry (Optional)
                  </strong>
                  <p className="text-sm mt-1 mb-3">
                    หากต้องการใช้งานโหมด Scan & Build ต้องกรอก{" "}
                    <strong>Docker Hub Username</strong> และ{" "}
                    <strong>Access Token</strong> (แนะนำให้ใช้ Token แทน
                    Password)
                  </p>

                  <div className="bg-slate-50 border border-slate-200 rounded p-4 text-sm">
                    <p className="font-medium text-slate-900 mb-2">
                      วิธีขอ Docker Hub Token:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                      <li>
                        ล็อกอินเข้า Docker Hub ไปที่{" "}
                        <strong>Account Settings</strong> {">"}{" "}
                        <strong>Security</strong>
                      </li>
                      <li>
                        กดปุ่ม <strong>New Access Token</strong>
                      </li>
                      <li>ตั้งชื่อ Token (เช่น VisScan-Token)</li>
                      <li>
                        กำหนด Access permissions เป็น{" "}
                        <strong>Read, Write, Delete</strong>
                      </li>
                      <li>กด Generate และคัดลอก Token มาใช้งาน</li>
                    </ol>
                  </div>
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
