"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ExternalLink } from "lucide-react";

export default function ScannerDocsPage() {
  const tools = [
    {
      id: "gitleaks",
      name: "Gitleaks",
      version: "v8.18.4",
      logo: "/logos/gitleaks.png",
      link: "https://gitleaks.io",
      description:
        "เครื่องมือป้องกันความปลอดภัยขั้นแรก ทำหน้าที่ตรวจสอบ Git Commit History เพื่อหารหัสผ่าน (Secrets), API Keys และ Tokens ที่เผลอหลุดเข้าไปใน Source Code",
      scans: [
        "Cloud Keys (AWS, GCP, Azure)",
        "Database Credentials",
        "Private Keys (RSA, PEM, SSH)",
        "API Tokens",
      ],
      limitations: [
        "ไม่สามารถตรวจจับ Secrets ที่ถูกเข้ารหัส (Encrypted)",
        "ไม่สแกน Environment Variables บน Server",
        "ไฟล์ Binary หรือรูปภาพจะไม่ถูกสแกน",
      ],
    },
    {
      id: "semgrep",
      name: "Semgrep",
      version: "Latest",
      logo: "/logos/semgrep.png",
      link: "https://semgrep.dev",
      description:
        "เครื่องมือวิเคราะห์โครงสร้างโค้ด (Static Analysis) เพื่อหาช่องโหว่ทางความปลอดภัยและ Logic Errors โดยเข้าใจ Syntax ของภาษาโปรแกรม",
      scans: [
        "OWASP Top 10",
        "Insecure Configuration",
        "Unsafe Function Usage",
        "Business Logic Flaws",
      ],
      limitations: [
        "ไม่สามารถตรวจจับ Runtime Errors",
        "การวิเคราะห์ข้ามไฟล์มีข้อจำกัด",
        "ไม่ตรวจสอบ Network Infrastructure",
      ],
    },
    {
      id: "trivy",
      name: "Trivy",
      version: "0.53.0",
      logo: "/logos/trivy.png",
      link: "https://trivy.dev",
      description:
        "เครื่องมือสแกนความปลอดภัยสำหรับ Cloud Native ครอบคลุมทั้ง Docker Image, File System และ Dependencies เพื่อหาช่องโหว่ (CVEs)",
      scans: [
        "OS Package Vulnerabilities",
        "Application Dependencies",
        "Infrastructure as Code",
        "Image Misconfiguration",
      ],
      limitations: [
        "ไม่ตรวจ Logic ของ Custom Code",
        "ไม่เจอ Zero-day Vulnerabilities",
        "ต้องต่อ Internet เพื่ออัปเดตฐานข้อมูล",
      ],
    },
  ];

  const toc = tools.map((t) => ({ title: t.name, href: `#${t.id}` }));

  return (
    <div className="w-full">
      {/* Sticky Breadcrumb */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 lg:px-8 py-3">
        <nav className="flex items-center text-sm text-slate-500 dark:text-slate-400">
          <Link href="/docs/getting-started" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Docs
          </Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="font-medium text-slate-900 dark:text-white">Supported Scanners</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 px-6 lg:px-8 py-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
            Scanner Capabilities
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mb-10 leading-7 max-w-3xl">
            รายละเอียดเชิงเทคนิค ขอบเขตการทำงาน
            และข้อจำกัดของเครื่องมือสแกนความปลอดภัยที่ใช้ในระบบ Secure Pipeline
          </p>

          <div className="space-y-12">
            {tools.map((tool) => (
              <section key={tool.id} id={tool.id} className="scroll-mt-24 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="relative w-10 h-10 shrink-0 bg-white dark:bg-slate-800 rounded-lg p-1">
                    <Image src={tool.logo} alt={tool.name} fill className="object-contain p-1" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{tool.name}</h2>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{tool.version}</span>
                  </div>
                  <a
                    href={tool.link}
                    target="_blank"
                    className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Official Docs <ExternalLink size={10} />
                  </a>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-6">
                  {tool.description}
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                      ✓ Supported
                    </h3>
                    <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                      {tool.scans.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                      ⚠ Limitations
                    </h3>
                    <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                      {tool.limitations.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-orange-500 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            ))}
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

