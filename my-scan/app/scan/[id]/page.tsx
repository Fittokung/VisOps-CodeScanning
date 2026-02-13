import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PipelineView from "@/components/PipelineView";
import MonorepoAction from "@/components/MonorepoAction";
import Link from "next/link";
import { ArrowLeft, GitBranch, Hash, Shield, Package } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

// บังคับให้โหลดข้อมูลใหม่เสมอ (ไม่ cache หน้าเว็บ)
export const dynamic = "force-dynamic";

export default async function ScanPage(props: Props) {
  const params = await props.params;
  const id = params.id;

  if (!id) {
    console.error("❌ No pipeline ID provided");
    notFound();
  }

  try {
    const scanData = await prisma.scanHistory.findFirst({
      where: {
        OR: [
          { id: id }, // รองรับกรณี URL เป็น UUID (เช่น /scan/550e8400-...)
          { pipelineId: id }, // รองรับกรณี URL เป็น Pipeline ID
        ],
      },
      select: {
        id: true, // ✅ ดึง id (UUID) ออกมาด้วยเพื่อส่งให้ PipelineView
        status: true,
        scanMode: true,
        imageTag: true,
        createdAt: true,
        pipelineId: true, // ✅ ดึง pipelineId ออกมาใช้แสดงผล
        service: {
          select: {
            serviceName: true,
            group: {
              select: {
                id: true,
                repoUrl: true,
                groupName: true,
              },
            },
          },
        },
      },
    });

    if (!scanData) {
      console.error("❌ No scan data found for ID:", id);
      notFound();
    }

    const repoUrl = scanData?.service?.group?.repoUrl;
    const groupId = scanData?.service?.group?.id;
    const scanMode = scanData?.scanMode;
    const isScanOnly = scanMode === "SCAN_ONLY";

    return (
      <main className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20">
        <div className="w-full max-w-full space-y-6">
          {/* Header Section */}
          <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm font-medium transition w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                  Scan Results
                  <span
                    className={`text-xs px-2 py-1 rounded-full border font-bold uppercase tracking-wider ${
                      isScanOnly
                        ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/30"
                        : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/30"
                    }`}
                  >
                    {isScanOnly ? "Security Audit" : "Scan & Build"}
                  </span>
                </h1>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    <Hash size={12} className="text-slate-400" />
                    {/* ใช้ pipelineId ถ้ามี ถ้าไม่มีใช้ id แทน */}
                    {(scanData.pipelineId || scanData.id).substring(0, 8)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <GitBranch size={14} className="text-slate-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {scanData.service.group.groupName}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">/</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {scanData.service.serviceName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Package size={14} className="text-slate-400" />
                    <span className="font-mono text-xs">
                      {scanData.imageTag}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 1. Pipeline View (Graph & Table) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <PipelineView scanId={scanData.id} scanMode={scanMode} />
          </div>

          {/* 2. Monorepo Action (Add more services) */}
          {!isScanOnly && repoUrl && groupId && (
            <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <MonorepoAction
                repoUrl={repoUrl}
                groupId={groupId}
                status={scanData?.status || "PENDING"}
                scanId={scanData.id}
              />
            </div>
          )}
        </div>
      </main>
    );
  } catch (error) {
    console.error("💥 Error in ScanPage:", error);
    throw error;
  }
}
