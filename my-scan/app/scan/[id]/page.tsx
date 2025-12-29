import { prisma } from "@/lib/prisma";
import PipelineView from "@/components/PipelineView";
import ConfirmBuildButton from "@/components/ReleaseButton";
import MonorepoAction from "@/components/MonorepoAction";
import ScanStatusAlert from "@/components/ScanStatusAlert"; 

type Props = { 
  params: Promise<{ id: string }> 
};

// บังคับให้โหลดข้อมูลใหม่เสมอ (ไม่ cache หน้าเว็บ)
export const dynamic = "force-dynamic";

export default async function ScanPage(props: Props) {
  const params = await props.params;
  const id = params.id; // ✅ ค่านี้คือ pipelineId

  if (!id) return <div>Missing ID</div>;

  // ✅ แก้ไขการดึงข้อมูล: ค้นหาด้วย pipelineId
  const scanData = await prisma.scanHistory.findFirst({
    where: { pipelineId: id }, // เปลี่ยนจาก scanId เป็น pipelineId
    select: { 
        status: true,
        service: {
            select: {
                group: {
                    select: {
                        repoUrl: true
                    }
                }
            }
        }
    }
  });

  // สร้างตัวแปร repoUrl เพื่อให้เรียกใช้ง่ายๆ ใน JSX
  const repoUrl = scanData?.service?.group?.repoUrl;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* ส่วนหัว */}
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Scan Results</h1>
           <p className="text-slate-500 text-sm">Pipeline ID: {id}</p>
        </div>

        {/* ส่วนแจ้งเตือน Real-time (ส่ง pipelineId ไป) */}
        <ScanStatusAlert scanId={id} />

        {/* 1. แสดงผลกราฟและตาราง Pipeline */}
        <PipelineView scanId={id} />

        {/* 2. ส่วน Monorepo Action */}
        {repoUrl && (
            <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <MonorepoAction 
                    repoUrl={repoUrl} 
                    status={scanData?.status || "PENDING"} 
                />
            </div>
        )}

        {/* 3. ปุ่มกดยืนยัน Release */}
        {scanData?.status !== "BLOCKED" && (
            <div className="border-t border-slate-200 pt-8">
                <ConfirmBuildButton scanId={id} />
            </div>
        )}

      </div>
    </main>
  );
}