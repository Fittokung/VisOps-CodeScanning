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
      where: { pipelineId: id },
      select: {
        status: true,
        scanMode: true,
        imageTag: true,
        createdAt: true,
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
      console.error("❌ No scan data found for pipeline:", id);
      notFound();
    }

    const repoUrl = scanData?.service?.group?.repoUrl;
    const groupId = scanData?.service?.group?.id;
    const scanMode = scanData?.scanMode;
    const isScanOnly = scanMode === "SCAN_ONLY";

    return (
      <main className="w-full min-h-screen bg-slate-50/50 pb-20">
        <div className="w-full max-w-full space-y-6">
          {/* Header Section */}
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                  Scan Results
                  <span
                    className={`text-xs px-2 py-1 rounded-full border font-bold uppercase tracking-wider ${
                      isScanOnly
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {isScanOnly ? "Security Audit" : "Build & Scan"}
                  </span>
                </h1>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    <Hash size={12} className="text-slate-400" />
                    {id.substring(0, 8)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <GitBranch size={14} className="text-slate-400" />
                    <span className="font-medium text-slate-700">
                      {scanData.service.group.groupName}
                    </span>
                    <span className="text-slate-300">/</span>
                    <span className="font-medium text-slate-900">
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

              {/* Status Badge (Placeholder for logic if needed) */}
              {/* <div className="text-right hidden sm:block">
                 <div className="text-xs text-slate-400 mb-1">Started</div>
                 <div className="font-mono text-sm text-slate-700">
                    {new Date(scanData.createdAt).toLocaleString()}
                 </div>
              </div> */}
            </div>
          </div>

          {/* 1. Pipeline View (Graph & Table) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <PipelineView scanId={id} scanMode={scanMode} />
          </div>

          {/* 2. Monorepo Action (Add more services) */}
          {!isScanOnly && repoUrl && groupId && (
            <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <MonorepoAction
                repoUrl={repoUrl}
                groupId={groupId}
                status={scanData?.status || "PENDING"}
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
