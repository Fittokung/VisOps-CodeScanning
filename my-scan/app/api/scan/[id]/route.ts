import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. GET: ดึงข้อมูล Scan สำหรับ PipelineView
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const id = resolved.id;

    // ค้นหาข้อมูลจาก DB
    const scan = await prisma.scanHistory.findFirst({
      where: {
        OR: [
          { pipelineId: id }, // กรณีหาด้วย Pipeline ID
          { id: id }          // กรณีหาด้วย UUID
        ]
      },
      select: {
        id: true,
        pipelineId: true,
        status: true,
        vulnCritical: true, // ค่าที่บันทึกใน DB
        details: true,      // JSON ก้อนใหญ่ (เก็บ findings, logs)
        createdAt: true,
        service: {
          select: {
            group: { select: { repoUrl: true } }
          }
        }
      }
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    // --- Data Processing ---
    const details = (scan.details as any) || {};
    const findings = details.findings || [];
    const logs = details.logs || [];

    // คำนวณ Counts สดๆ จาก Findings (เพื่อให้ตรงกับตารางเป๊ะๆ)
    const counts = {
      critical: findings.filter((f: any) => f.severity === "critical").length,
      high: findings.filter((f: any) => f.severity === "high").length,
      medium: findings.filter((f: any) => f.severity === "medium").length,
      low: findings.filter((f: any) => f.severity === "low").length,
    };

    // คำนวณ Progress Bar แบบคร่าวๆ
    let progress = 0;
    let step = "Initializing...";
    
    switch (scan.status) {
      case "PENDING":
        progress = 10;
        step = "Queued";
        break;
      case "RUNNING":
        progress = 50;
        step = "Scanning...";
        break;
      case "WAITING_CONFIRMATION":
        progress = 90;
        step = "Waiting for Approval";
        break;
      case "SUCCESS":
        progress = 100;
        step = "Completed";
        break;
      case "BLOCKED":
        progress = 100;
        step = "Security Blocked";
        break;
      case "FAILED":
        progress = 100;
        step = "Pipeline Failed";
        break;
    }

    // สร้าง URL ไปยัง GitLab (ปรับแก้ตาม URL จริงของคุณ)
    // ถ้าใช้ GitLab.com
    // const gitlabBaseUrl = "https://gitlab.com"; 
    // ถ้าใช้ Self-hosted (ตาม IP ที่คุณเคยให้มา)
    const gitlabBaseUrl = process.env.GITLAB_API_URL || "http://10.10.184.118"; 
    const projectUrl = `${gitlabBaseUrl}/admin/projects/${process.env.GITLAB_PROJECT_ID}/pipelines/${scan.pipelineId}`;

    // --- Response ---
    return NextResponse.json({
        id: scan.id,
        pipelineId: scan.pipelineId,
        repoUrl: scan.service?.group?.repoUrl || "Unknown Repo",
        
        // ส่ง Status เป็น Uppercase เพื่อให้ตรงกับ TypeScript ใน Frontend
        status: scan.status, 
        
        step: step,
        progress: progress,
        
        counts: counts, // ส่งตัวเลขที่นับใหม่
        
        findings: findings, // ในนี้จะมี author, email ของ Gitleaks ติดไปด้วยถ้ามี
        logs: logs,
        
        vulnCritical: scan.vulnCritical, // ใช้สำหรับ Alert Blocked
        pipelineUrl: projectUrl
    });

  } catch (error: any) {
    console.error("GET Scan Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// 2. DELETE: ลบข้อมูล
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const targetId = resolved.id; 

    console.log(`[Delete] Request received for ID: ${targetId}`);

    const result = await prisma.scanHistory.deleteMany({
        where: {
            OR: [
                { id: targetId },            
                { pipelineId: targetId }     
            ]
        }
    });

    if (result.count === 0) {
        return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Deleted successfully" });

  } catch (err: any) {
    console.error("[Delete] Error:", err.message);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}