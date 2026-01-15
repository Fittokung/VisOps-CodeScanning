"use client";

import Link from "next/link";
import Image from "next/image";
import { ExternalLink, ChevronRight } from "lucide-react";
import OnThisPage from "@/components/OnThisPage";

export default function ScannerDocsPage() {
  const tools = [
    {
      id: "gitleaks",
      name: "Gitleaks",
      version: "v8.18.4",
      logo: "/logos/gitleaks.png",
      link: "https://gitleaks.io",
      description:
        "เครื่องมือป้องกันความปลอดภัยขั้นแรก ทำหน้าที่ตรวจสอบ Git Commit History เพื่อหารหัสผ่าน (Secrets), API Keys และ Tokens",
      scans: [
        "Cloud Keys (AWS, GCP, Azure)",
        "Database Credentials",
        "Private Keys (RSA, PEM, SSH)",
        "API Tokens",
      ],
      limitations: [
        "ไม่สามารถตรวจจับ Encrypted Secrets",
        "ไม่สแกน Server Env Variables",
        "ไม่สแกน Binary Files",
      ],
    },
    {
      id: "semgrep",
      name: "Semgrep",
      version: "Latest",
      logo: "/logos/semgrep.png",
      link: "https://semgrep.dev",
      description:
        "เครื่องมือวิเคราะห์โครงสร้างโค้ด (Static Analysis) เพื่อหาช่องโหว่ทางความปลอดภัยและ Logic Errors",
      scans: [
        "OWASP Top 10",
        "Insecure Configuration",
        "Unsafe Function Usage",
        "Business Logic Flaws",
      ],
      limitations: [
        "ไม่ตรวจจับ Runtime Errors",
        "Cross-file analysis มีจำกัด",
        "ไม่ตรวจสอบ Network Infrastructure",
      ],
    },
    {
      id: "trivy",
      name: "Trivy",
      version: "v0.53.0",
      logo: "/logos/trivy.png",
      link: "https://trivy.dev",
      description:
        "เครื่องมือสแกนความปลอดภัยสำหรับ Cloud Native ครอบคลุมทั้ง Docker Image, File System และ Dependencies",
      scans: [
        "OS Package Vulnerabilities",
        "Application Dependencies",
        "Infrastructure as Code",
        "Image Misconfiguration",
      ],
      limitations: [
        "ไม่ตรวจ Logic ของ Custom Code",
        "ไม่เจอ Zero-day Vulnerabilities",
        "ต้องต่อ Internet",
      ],
    },
  ];

  const toc = [
    { title: "Gitleaks", href: "#gitleaks" },
    { title: "Semgrep", href: "#semgrep" },
    { title: "Trivy", href: "#trivy" },
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
              Supported Scanners
            </span>
          </nav>

          <h1 className="scroll-m-20 text-3xl font-bold tracking-tight text-slate-900 mb-6">
            Scanner Capabilities
          </h1>
          <p className="text-base text-slate-600 mb-10 leading-7">
            รายละเอียดเชิงเทคนิค ขอบเขตการทำงาน
            และข้อจำกัดของเครื่องมือสแกนความปลอดภัย
          </p>

          <div className="space-y-16">
            {tools.map((tool) => (
              <section key={tool.id} id={tool.id} className="scroll-mt-24">
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
                  <div className="relative w-8 h-8 shrink-0">
                    <Image
                      src={tool.logo}
                      alt={tool.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {tool.name}
                  </h2>
                  <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    {tool.version}
                  </span>
                  <a
                    href={tool.link}
                    target="_blank"
                    className="ml-auto text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Official Docs <ExternalLink size={10} />
                  </a>
                </div>

                <p className="text-sm text-slate-600 mb-6 leading-6">
                  {tool.description}
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                      Supported
                    </h3>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-slate-600 marker:text-slate-300">
                      {tool.scans.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                      Limitations
                    </h3>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-slate-600 marker:text-slate-300">
                      {tool.limitations.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>

        <OnThisPage links={toc} />
      </div>
    </div>
  );
}
