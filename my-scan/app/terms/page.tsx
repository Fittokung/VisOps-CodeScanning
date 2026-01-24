"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";

type Language = "EN" | "TH";

export default function TermsPage() {
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
              {lang === "EN" ? "Terms of Service" : "ข้อกำหนดการใช้งาน"}
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
                Welcome to VisScan. By accessing or using our platform, you
                agree to be bound by these Terms. If you do not agree, strictly
                do not use our services.
              </p>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                1. User Responsibility for Credentials
              </h3>
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg my-4">
                <p className="text-orange-900 font-medium m-0">
                  <strong>Critical Notice:</strong> You act as the sole
                  custodian of your credentials. VisScan acts only as a
                  processor.
                </p>
              </div>
              <p>You agree that you are solely responsible for:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  The security and confidentiality of your{" "}
                  <strong>
                    GitHub Tokens, Docker Hub Secrets, Private Keys, and API
                    Keys
                  </strong>
                  .
                </li>
                <li>
                  Ensuring that tokens provided to VisScan have the{" "}
                  <strong>
                    minimum necessary permissions (Least Privilege)
                  </strong>
                  .
                </li>
                <li>
                  Rotating and revoking any token immediately if you suspect a
                  breach.
                </li>
              </ul>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                2. Authorized Use & Legal Compliance
              </h3>
              <p>
                You represent and warrant that you own or have explicit written
                permission to scan the repositories and container images
                submitted to our platform.
              </p>
              <p>
                <strong>Strict Prohibition:</strong> Using VisScan to scan
                targets you do not own is a violation of these terms and may
                constitute a criminal offense under the{" "}
                <em>Computer-Related Crime Act B.E. 2560 (Thailand)</em> and
                other international cybercrime laws. We cooperate fully with law
                enforcement agencies.
              </p>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                3. Limitation of Liability
              </h3>
              <p>To the fullest extent permitted by law:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>VisScan shall not be liable</strong> for any direct,
                  indirect, incidental, or consequential damages resulting from
                  the compromise, leak, or misuse of the credentials you stored
                  on our platform.
                </li>
                <li>
                  We provide the service on an "AS IS" and "AS AVAILABLE" basis
                  without warranties of any kind regarding security or uptime.
                </li>
              </ul>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                4. Indemnification
              </h3>
              <p>
                You agree to indemnify and hold VisScan harmless from any
                claims, damages, or legal fees arising from your violation of
                these terms or your misuse of the service (e.g., scanning
                unauthorized targets).
              </p>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                5. Governing Law
              </h3>
              <p>
                These Terms are governed by the laws of the Kingdom of Thailand.
                Any disputes shall be resolved in the courts of Thailand.
              </p>
            </>
          ) : (
            // Thai Content
            <>
              <p>
                ยินดีต้อนรับสู่ VisScan
                การเข้าถึงหรือใช้งานแพลตฟอร์มนี้ถือว่าท่านตกลงที่จะผูกพันตามข้อกำหนดเหล่านี้
                หากท่านไม่เห็นด้วย กรุณายุติการใช้งานทันที
              </p>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                1. ความรับผิดชอบต่อรหัสผ่านและโทเคน (Credentials)
              </h3>
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg my-4">
                <p className="text-orange-900 font-medium m-0">
                  <strong>ข้อตระหนักสำคัญ:</strong>{" "}
                  ท่านเป็นผู้ดูแลรักษาความปลอดภัยของข้อมูลสำคัญแต่เพียงผู้เดียว
                  VisScan เป็นเพียงผู้ประมวลผลข้อมูลตามคำสั่งเท่านั้น
                </p>
              </div>
              <p>
                ท่านตกลงและยอมรับว่าท่านเป็นผู้รับผิดชอบแต่เพียงผู้เดียวในการ:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  รักษาความลับและความปลอดภัยของ{" "}
                  <strong>
                    GitHub Tokens, Docker Hub Secrets, Private Keys และ API Keys
                  </strong>
                </li>
                <li>
                  ตรวจสอบสิทธิ์ของ Token ที่นำมาใช้งานให้มีสิทธิ์เท่าที่จำเป็น
                  (Least Privilege) เท่านั้น
                </li>
                <li>
                  ทำการเปลี่ยน (Rotate) หรือยกเลิก (Revoke) Token
                  ทันทีเมื่อมีความเสี่ยงหรือสงสัยว่าข้อมูลรั่วไหล
                </li>
              </ul>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                2. การใช้งานที่ได้รับอนุญาตและการปฏิบัติตามกฎหมาย
              </h3>
              <p>
                ท่านรับรองว่าท่านเป็นเจ้าของ
                หรือได้รับอนุญาตเป็นลายลักษณ์อักษรในการสแกนตรวจสอบความปลอดภัยของ
                Repository หรือ Container Image ที่ท่านนำเข้าสู่ระบบ
              </p>
              <p>
                <strong>ข้อห้ามเด็ดขาด:</strong> การใช้ VisScan
                เพื่อสแกนเป้าหมายที่ท่านไม่มีสิทธิ์ถือเป็นการละเมิดข้อตกลง
                และอาจเป็นความผิดทางอาญาตาม{" "}
                <em>
                  พ.ร.บ. ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ พ.ศ. 2560
                </em>{" "}
                และกฎหมายสากลที่เกี่ยวข้อง
                เรายินดีให้ความร่วมมือกับเจ้าหน้าที่รัฐในการดำเนินคดีถึงที่สุด
              </p>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                3. ข้อจำกัดความรับผิด (Limitation of Liability)
              </h3>
              <p>ภายในขอบเขตสูงสุดที่กฎหมายอนุญาต:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>VisScan จะไม่รับผิดชอบ</strong> ต่อความเสียหายทางตรง
                  ทางอ้อม หรือผลกระทบใดๆ ที่เกิดจากการรั่วไหล การถูกขโมย
                  หรือการใช้ผิดวัตถุประสงค์ของ Credential ที่ท่านบันทึกไว้ในระบบ
                </li>
                <li>
                  เราให้บริการในรูปแบบ "ตามสภาพ" (AS IS)
                  โดยไม่มีการรับประกันความปลอดภัยขั้นสูงสุดหรือความเสถียรของระบบ
                  100%
                </li>
              </ul>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                4. การชดเชยค่าเสียหาย (Indemnification)
              </h3>
              <p>
                ท่านตกลงที่จะชดเชยค่าเสียหายและปกป้อง VisScan จากการเรียกร้อง
                ค่าเสียหาย หรือค่าใช้จ่ายทางกฎหมายใดๆ
                ที่เกิดจากการที่ท่านละเมิดข้อตกลงนี้
                หรือการใช้งานระบบในทางที่ผิด (เช่น
                การสแกนระบบของผู้อื่นโดยไม่ได้รับอนุญาต)
              </p>

              <h3 className="text-slate-900 font-bold text-lg mt-8 mb-4">
                5. กฎหมายที่บังคับใช้
              </h3>
              <p>
                ข้อตกลงนี้อยู่ภายใต้บังคับของกฎหมายราชอาณาจักรไทย
                และอยู่ภายใต้เขตอำนาจศาลของประเทศไทย
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
