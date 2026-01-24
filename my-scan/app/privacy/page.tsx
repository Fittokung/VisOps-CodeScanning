"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";

type Language = "EN" | "TH";

export default function PrivacyPage() {
  const [lang, setLang] = useState<Language>("EN");

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header & Language Switcher */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4"
            >
              <ArrowLeft size={16} />{" "}
              {lang === "EN" ? "Back to Login" : "กลับหน้าเข้าสู่ระบบ"}
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {lang === "EN" ? "Privacy Policy" : "นโยบายความเป็นส่วนตัว"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {lang === "EN"
                ? "Last updated: January 2026"
                : "ปรับปรุงล่าสุด: มกราคม 2569"}
            </p>
          </div>

          <button
            onClick={() => setLang(lang === "EN" ? "TH" : "EN")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            <Globe size={16} />
            {lang === "EN" ? "Switch to Thai" : "เปลี่ยนเป็นภาษาอังกฤษ"}
          </button>
        </div>

        {/* Content */}
        <div className="prose prose-slate prose-sm max-w-none text-slate-600">
          {lang === "EN" ? (
            // English Content
            <>
              <p>
                VisScan is committed to protecting your privacy and handling
                your sensitive data with transparency, complying with the{" "}
                <strong>Thai Personal Data Protection Act (PDPA)</strong> and
                international standards.
              </p>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                1. Information We Collect
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Identity Data:</strong> Name, Email, Profile Picture
                  (via OAuth/Google).
                </li>
                <li>
                  <strong>Sensitive Credentials:</strong> GitHub Tokens, Docker
                  Registry Secrets, and Private Keys provided explicitly by you
                  for service operation.
                </li>
                <li>
                  <strong>Operational Data:</strong> Scan logs, vulnerability
                  reports, and pipeline history.
                </li>
              </ul>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                2. Purpose of Processing
              </h3>
              <p>
                We process your credentials strictly for the purpose of
                executing the requested security scans:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  To authenticate and clone your private repositories for SAST
                  analysis.
                </li>
                <li>
                  To pull/push container images from your private registries.
                </li>
              </ul>
              <p>
                <strong>
                  We do not sell, share, or trade your credentials with any
                  third party.
                </strong>
              </p>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                3. Security Measures
              </h3>
              <p>
                We employ industry-standard encryption (AES-256) for storing
                credentials at rest and use TLS 1.3 for data in transit.
                However, you acknowledge that no system is impenetrable.
              </p>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                4. Data Retention & Deletion
              </h3>
              <p>
                You retain full control over your data. You may delete your
                credentials or your entire account at any time via the Settings
                page. Upon deletion, your sensitive tokens are permanently
                removed from our databases immediately.
              </p>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                5. Contact Us
              </h3>
              <p>
                If you have questions regarding your data rights (PDPA), please
                create a support ticket or contact our Data Protection Officer
                (DPO) at privacy@visscan.com.
              </p>
            </>
          ) : (
            // Thai Content
            <>
              <p>
                VisScan
                มุ่งมั่นที่จะปกป้องความเป็นส่วนตัวและจัดการข้อมูลสำคัญของท่านด้วยความโปร่งใส
                ตามมาตรฐาน{" "}
                <strong>พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)</strong>{" "}
                และมาตรฐานสากล
              </p>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                1. ข้อมูลที่เราเก็บรวบรวม
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>ข้อมูลยืนยันตัวตน:</strong> ชื่อ, อีเมล, รูปโปรไฟล์
                  (ผ่านระบบ OAuth/Google)
                </li>
                <li>
                  <strong>ข้อมูลความลับ (Credentials):</strong> GitHub Tokens,
                  Docker Registry Secrets และ Private Keys
                  ที่ท่านระบุเพื่อให้ระบบทำงาน
                </li>
                <li>
                  <strong>ข้อมูลการดำเนินงาน:</strong> บันทึกการสแกน (Logs),
                  รายงานช่องโหว่ และประวัติ Pipeline
                </li>
              </ul>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                2. วัตถุประสงค์การประมวลผล
              </h3>
              <p>
                เราใช้ Credential
                ของท่านเพื่อวัตถุประสงค์ในการดำเนินการสแกนตามคำสั่งเท่านั้น:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  เพื่อยืนยันตัวตนและเข้าถึง Repository
                  ส่วนตัวของท่านสำหรับการวิเคราะห์ Code
                </li>
                <li>
                  เพื่อดึง (Pull) หรืออัปโหลด (Push) Container Image จาก
                  Registry ของท่าน
                </li>
              </ul>
              <p>
                <strong>
                  เราไม่มีนโยบายจำหน่าย จ่าย แจก หรือแบ่งปัน Credential
                  ของท่านให้กับบุคคลที่สามโดยเด็ดขาด
                </strong>
              </p>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                3. มาตรการความปลอดภัย
              </h3>
              <p>
                เราใช้การเข้ารหัสมาตรฐานอุตสาหกรรม (AES-256) ในการจัดเก็บข้อมูล
                (At Rest) และใช้ TLS 1.3 สำหรับการรับส่งข้อมูล (In Transit)
                อย่างไรก็ตาม ท่านรับทราบว่าไม่มีระบบใดที่ปลอดภัย 100%
              </p>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                4. การเก็บรักษาและการลบข้อมูล
              </h3>
              <p>
                ท่านมีสิทธิ์ในการควบคุมข้อมูลของท่านอย่างสมบูรณ์ ท่านสามารถลบ
                Credential หรือบัญชีผู้ใช้ได้ตลอดเวลาผ่านหน้า Settings
                เมื่อดำเนินการลบ
                โทเคนของท่านจะถูกลบออกจากฐานข้อมูลอย่างถาวรทันที
              </p>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                5. ติดต่อเรา
              </h3>
              <p>
                หากท่านมีข้อสงสัยเกี่ยวกับสิทธิ์ในข้อมูลของท่าน (ตามกฎหมาย PDPA)
                โปรดติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO) ของเราที่
                ติดต่อ -
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
