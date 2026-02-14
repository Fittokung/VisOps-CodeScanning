import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PipelineView from "@/components/PipelineView";
import MonorepoAction from "@/components/MonorepoAction";
import Link from "next/link";
import { ArrowLeft, GitBranch, Hash, Package, Timer, Download, Rocket } from "lucide-react";
import ScanTimeline from "@/components/ScanTimeline";
import PipelineStepper from "@/components/PipelineStepper";

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
        id: true, // ดึง id (UUID) ออกมาด้วยเพื่อส่งให้ PipelineView
        status: true,
        scanMode: true,
        imageTag: true,
        createdAt: true,
        startedAt: true, // [NEW]
        completedAt: true, // [NEW]
        scanLogs: true, // [NEW]
        pipelineJobs: true, // [NEW] For Stepper
        imagePushed: true, // [NEW] For Stepper Status
        pipelineId: true, //  ดึง pipelineId ออกมาใช้แสดงผล
        vulnCritical: true, // [NEW]
        vulnHigh: true, // [NEW]
        vulnMedium: true, // [NEW]
        vulnLow: true, // [NEW]
        details: true, // [NEW] Storage for findings and reports
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

    // Transform to match Run type expected by PipelineView
    const details = (scanData.details as any) || {};
    const formattedScanData = {
      ...scanData,
      counts: {
        critical: scanData.vulnCritical || 0,
        high: scanData.vulnHigh || 0,
        medium: scanData.vulnMedium || 0,
        low: scanData.vulnLow || 0,
      },
      rawReports: details, // Assuming details contains the report keys directly
      findings: details.findings || [],
    };

    const repoUrl = scanData?.service?.group?.repoUrl;
    const groupId = scanData?.service?.group?.id;
    const scanMode = scanData?.scanMode;
    const isScanOnly = scanMode === "SCAN_ONLY";

    return (
      <main className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20">
        <div className="w-full max-w-full space-y-6">
          {/* Header Section */}
          <div className="flex flex-col gap-4 mb-2">
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
                  {scanData.service.serviceName}
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                      isScanOnly
                        ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/30"
                        : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/30"
                    }`}
                  >
                    {isScanOnly ? "Audit" : "Build & Scan"}
                  </span>
                </h1>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    <Hash size={12} className="text-slate-400" />
                    {(scanData.pipelineId || scanData.id).substring(0, 8)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <GitBranch size={14} className="text-slate-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {scanData.service.group.groupName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Package size={14} className="text-slate-400" />
                    <span className="font-mono text-xs">
                      {scanData.imageTag}
                    </span>
                  </div>

                  {/* Duration Display */}
                  {scanData.startedAt && (
                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-medium ml-2 pl-2 border-l border-slate-300 dark:border-slate-700">
                      <Timer size={14} className="text-slate-400" />
                      <span className="font-mono text-xs">
                        {(() => {
                          const start = new Date(scanData.startedAt);
                          const end = scanData.completedAt ? new Date(scanData.completedAt) : new Date();
                          const diff = Math.max(0, end.getTime() - start.getTime());
                          const mins = Math.floor(diff / 60000);
                          const secs = Math.floor((diff % 60000) / 1000);
                          return `${mins}m ${secs}s`;
                        })()}
                      </span>
                    </div>
                  )}

                  {/* [NEW] Deployed Badge */}
                  {scanData.imagePushed && (
                     <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-300 dark:border-slate-700 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        <Rocket size={14} />
                        <span className="text-xs font-bold uppercase tracking-wide">Deployed</span>
                     </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* [NEW] Download Actions (Moved from StatusHeader) - Restored */}
          {formattedScanData.status === 'SUCCESS' && (
             <div className="flex justify-end gap-2 mb-2">
                 {(formattedScanData.rawReports as any)?.gitleaks && (
                    <ScanDownloadButton 
                        label="Gitleaks" 
                        data={(formattedScanData.rawReports as any).gitleaks} 
                        color="purple" 
                    />
                 )}
                 {(formattedScanData.rawReports as any)?.semgrep && (
                    <ScanDownloadButton 
                        label="Semgrep" 
                        data={(formattedScanData.rawReports as any).semgrep} 
                        color="emerald" 
                    />
                 )}
                 {(formattedScanData.rawReports as any)?.trivy && (
                    <ScanDownloadButton 
                        label="Trivy" 
                        data={(formattedScanData.rawReports as any).trivy} 
                        color="blue" 
                    />
                 )}
             </div>
          )}
          
          <div className="space-y-6">
             {/* 1. Pipeline View (Graph & Table) */}
             <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
               <PipelineView 
                  scanId={scanData.id} 
                  scanMode={scanMode} 
                  initialData={formattedScanData} // [Use Formatted Data]
               />
             </div>
             
             {/* [NEW] Scan Timeline (Now Full Width) */}
             <ScanTimeline logs={scanData.scanLogs as any} status={scanData.status} />
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

// [NEW] Helper Component for Download Buttons
function ScanDownloadButton({ label, data, color }: { label: string, data: any, color: 'purple' | 'emerald' | 'blue' }) {
  const handleDownload = () => {
    if (!data) return alert("Report not available");
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${label.toLowerCase()}-report.json`;
    link.click();
  };

  const colorClasses = {
      purple: "text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 dark:text-purple-300 dark:bg-purple-900/20 dark:border-purple-900/50",
      emerald: "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-900/50",
      blue: "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-900/50"
  };

  return (
    <button
      onClick={handleDownload}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition ${colorClasses[color]}`}
    >
      <Download size={14} /> {label}
    </button>
  );
}


