import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";
import https from "https";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolved = await params;
    const scanId = resolved.id;

    console.log(`🔄 Force Sync requested for Scan: ${scanId}`);

    // 1. หาข้อมูล Scan
    const scan = await prisma.scanHistory.findUnique({
      where: { id: scanId },
    });

    if (!scan || !scan.pipelineId) {
      return NextResponse.json(
        { error: "Scan not found or no pipelineId" },
        { status: 404 },
      );
    }

    // 2. ถาม GitLab (Config)
    const gitlabBaseUrl = process.env.GITLAB_API_URL || "http://10.10.184.118";
    const projectId = process.env.GITLAB_PROJECT_ID || "141";
    const token = process.env.GITLAB_TOKEN;
    const agent = new https.Agent({ rejectUnauthorized: false });

    const targetUrl = `${gitlabBaseUrl}/api/v4/projects/${projectId}/pipelines/${scan.pipelineId}`;
    console.log(`🚀 [Debug] Requesting URL: ${targetUrl}`);
    console.log(
      `🔑 [Debug] Using Token: ${token ? "YES (Has Token)" : "NO (Missing Token)"}`,
    );

    const gitlabRes = await axios.get(targetUrl, {
      headers: { "PRIVATE-TOKEN": token },
      httpsAgent: agent,
    });

    const gitlabStatus = gitlabRes.data.status.toUpperCase();
    console.log(`📡 GitLab Status: ${gitlabStatus}`);

    // 4. แปลง Status
    let newStatus = scan.status;

    if (["SUCCESS", "PASSED", "MANUAL"].includes(gitlabStatus)) {
      newStatus = "SUCCESS";
    } else if (["FAILED", "CANCELED", "SKIPPED"].includes(gitlabStatus)) {
      newStatus = "FAILED";
    } else if (gitlabStatus === "RUNNING" || gitlabStatus === "PENDING") {
      newStatus = "RUNNING";
    }

    // 5. อัปเดต DB ถ้าสถานะเปลี่ยน
    if (newStatus !== scan.status) {
      await prisma.scanHistory.update({
        where: { id: scanId },
        data: { status: newStatus },
      });
      console.log(`✅ DB Updated: ${newStatus}`);
    } else {
      console.log(`Running... Status unchanged.`);
    }

    return NextResponse.json({ success: true, newStatus });
  } catch (error: any) {
    console.error("❌ Sync Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
