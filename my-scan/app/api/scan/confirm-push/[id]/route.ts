import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id)
      return NextResponse.json({ error: "missing id" }, { status: 400 });

    // 1. Look up scan record to get scan mode
    // Support both ID (UUID) and PipelineID
    const scanRecord = await prisma.scanHistory.findFirst({
      where: {
        OR: [
          { id: id },
          { pipelineId: id }
        ]
      },
    });

    if (!scanRecord) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    const { pipelineId } = scanRecord;
    if (!pipelineId) {
        return NextResponse.json({ error: "Scan has no pipeline ID" }, { status: 400 });
    }




    // Use Global Project ID from env
    const projectId = process.env.GITLAB_PROJECT_ID; 

    // Remove trailing slash if present
    const baseUrl = process.env.GITLAB_API_URL?.replace(/\/$/, "");
    const token = process.env.GITLAB_TOKEN;
    const agent = new https.Agent({ rejectUnauthorized: false });

    console.log(`🚀 Release Request received for Pipeline: ${pipelineId}`);
    console.log(`📦 GitLab Project ID: ${projectId}`);

    // 2. Find the specific pipeline
    // URL is already .../api/v4 in .env, so we append /projects/...
    const pipelineRes = await axios.get(
      `${baseUrl}/projects/${projectId}/pipelines/${pipelineId}`,
      {
        headers: { "PRIVATE-TOKEN": token },
        httpsAgent: agent,
      }
    );

    if (!pipelineRes.data) {
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      );
    }

    console.log(`Pipeline ${pipelineId} status: ${pipelineRes.data.status}`);

    // 3. Get jobs for this specific pipeline
    const jobsRes = await axios.get(
      `${baseUrl}/projects/${projectId}/pipelines/${pipelineId}/jobs`,
      {
        headers: { "PRIVATE-TOKEN": token },
        httpsAgent: agent,
      }
    );

    const manualJob = jobsRes.data.find(
      (j: any) =>
        j.name === "push_to_hub" &&
        (j.status === "manual" ||
          j.status === "created" ||
          j.status === "skipped" || 
          j.status === "success") // If already success, we might re-trigger or handle differently? existing logic says trigger.
    );

    console.log(`Jobs found: ${jobsRes.data.length}`);
    console.log(
      `Manual jobs:`,
      jobsRes.data
        .filter((j: any) => j.name === "push_to_hub")
        .map((j: any) => ({ id: j.id, name: j.name, status: j.status }))
    );

    if (!manualJob) {
      return NextResponse.json(
        {
          error: "No manual release job found. (Did the scan finish?)",
        },
        { status: 400 }
      );
    }

    // 4. Trigger the manual job
    console.log(`Triggering Job ID: ${manualJob.id} (${manualJob.name})...`);

    const playRes = await axios.post(
      `${baseUrl}/projects/${projectId}/jobs/${manualJob.id}/play`,
      {},
      {
        headers: { "PRIVATE-TOKEN": token },
        httpsAgent: agent,
      }
    );

    // Update DB to show image is pushed (optimistic, or wait for webhook)
    await prisma.scanHistory.update({
        where: { id: scanRecord.id },
        data: { imagePushed: true }
    });

    return NextResponse.json({
      success: true,
      message: "Docker Push Triggered",
      buildStatus: playRes.data.status,
    });
  } catch (err: any) {
    console.error("❌ API ERROR:", err.message);
    console.error("Error details:", err.response?.data || err.stack);
    return NextResponse.json(
      {
        error:
          err.response?.data?.message ||
          err.message ||
          "Failed to release build",
      },
      { status: 500 }
    );
  }
}
