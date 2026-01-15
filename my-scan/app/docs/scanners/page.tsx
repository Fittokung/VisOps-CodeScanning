// app/docs/scanners/page.tsx
"use client";

import Link from "next/link";
import { ArrowLeft, FileCode, Box, Key, Check, X, Info } from "lucide-react";

export default function ScannerDocsPage() {
  const tools = [
    {
      id: "gitleaks",
      name: "Gitleaks",
      type: "Secret Detection",
      // ใช้สีเฉพาะที่ Icon เท่านั้น
      icon: <Key className="w-5 h-5 text-amber-500" />,
      description:
        "ตรวจจับรหัสผ่าน, API Keys และ Tokens ที่เผลอหลุดเข้าไปใน Source Code",
      scans: [
        "AWS / Google Cloud Keys",
        "GitHub / GitLab Tokens",
        "Private Keys (RSA, PEM)",
        "Database Credentials",
        "Webhooks (Slack/Discord)",
      ],
      notScans: [
        "Encrypted Secrets",
        "Environment Variables (Server-side)",
        "Secrets ใน Database",
        "Binary Files / Images",
      ],
    },
    {
      id: "semgrep",
      name: "Semgrep",
      type: "SAST Analysis",
      icon: <FileCode className="w-5 h-5 text-purple-500" />,
      description:
        "วิเคราะห์โครงสร้างโค้ดเพื่อหาช่องโหว่ทางความปลอดภัย (Vulnerabilities) และ Code Smell",
      scans: [
        "OWASP Top 10 (Injection, XSS)",
        "Unsafe Functions usage",
        "Business Logic Flaws",
        "Support: Java, Go, Python, JS/TS",
      ],
      notScans: [
        "Runtime Errors",
        "Network / Infrastructure issues",
        "Complex Cross-file Logic",
        "3rd Party Libraries",
      ],
    },
    {
      id: "trivy",
      name: "Trivy",
      type: "Container & Dependencies",
      icon: <Box className="w-5 h-5 text-blue-500" />,
      description:
        "สแกน Docker Image และ Library Packages เพื่อหาช่องโหว่ (CVEs) ที่เป็นที่รู้จัก",
      scans: [
        "OS Packages (Alpine, Debian)",
        "App Libraries (npm, pip, maven)",
        "Image Misconfiguration",
        "Hidden Secrets in Layers",
      ],
      notScans: [
        "Custom Code Logic",
        "Zero-day Vulnerabilities",
        "Runtime Attacks",
        "Firewall Config",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Minimal Header */}
        <div className="mb-16">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-slate-400 hover:text-slate-900 transition-colors mb-8 group"
          >
            <ArrowLeft
              size={16}
              className="mr-2 group-hover:-translate-x-1 transition-transform"
            />
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-3">
            Scanner Capabilities
          </h1>
          <p className="text-lg text-slate-500 font-light leading-relaxed max-w-2xl">
            Technical breakdown of supported features and limitations for each
            scanning engine.
          </p>
        </div>

        {/* Tools List (No Cards, Just Clean Sections) */}
        <div className="space-y-16">
          {tools.map((tool) => (
            <div key={tool.id} className="group">
              {/* Tool Identity */}
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2.5 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors">
                  {tool.icon}
                </div>
                <div>
                  <h2 className="text-xl font-medium text-slate-900">
                    {tool.name}
                  </h2>
                  <span className="text-sm text-slate-400 font-mono uppercase tracking-wider">
                    {tool.type}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-600 mb-8 pl-[3.25rem] max-w-3xl leading-relaxed">
                {tool.description}
              </p>

              {/* Comparison Columns */}
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 pl-[3.25rem]">
                {/* Supported */}
                <div>
                  <h3 className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Check size={14} strokeWidth={3} /> Supported
                  </h3>
                  <ul className="space-y-3">
                    {tool.scans.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-slate-600 flex items-start gap-3"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitations */}
                <div>
                  <h3 className="text-xs font-semibold text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <X size={14} strokeWidth={3} /> Limitations
                  </h3>
                  <ul className="space-y-3">
                    {tool.notScans.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-slate-500 flex items-start gap-3"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-100 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-100 mt-16 w-full" />
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 flex gap-4 text-sm text-slate-400 bg-slate-50 p-6 rounded-lg">
          <Info className="w-5 h-5 shrink-0 text-slate-500" />
          <p>
            Combining these three scanners covers approximately 80% of common
            security risks. However, automated scanning is not a replacement for
            manual penetration testing.
          </p>
        </div>
      </div>
    </div>
  );
}
