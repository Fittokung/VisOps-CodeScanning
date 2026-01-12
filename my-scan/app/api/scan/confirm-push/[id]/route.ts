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
    const pipelineId = id;

    if (!pipelineId)
      return NextResponse.json({ error: "missing id" }, { status: 400 });

    // 1. Look up scan record to get GitLab project ID
    const scanRecord = await prisma.scanHistory.findFirst({
      where: { pipelineId: pipelineId },
    });

    if (!scanRecord) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    // Get GitLab project ID from the scan record (stored as scanId)
    const projectId = scanRecord.scanId; // This is the GitLab project ID (e.g., 141)

    const baseUrl = process.env.GITLAB_API_URL?.replace(/\/$/, "");
    const token = process.env.GITLAB_TOKEN;
    const agent = new https.Agent({ rejectUnauthorized: false });

    console.log(`🚀 Release Request received for Pipeline: ${pipelineId}`);
    console.log(`📦 GitLab Project ID: ${projectId}`);

    // 2. Find the specific pipeline
    const pipelineRes = await axios.get(
      `${baseUrl}/api/v4/projects/${projectId}/pipelines/${pipelineId}`,
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
      `${baseUrl}/api/v4/projects/${projectId}/pipelines/${pipelineId}/jobs`,
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
          j.status === "skipped")
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
      `${baseUrl}/api/v4/projects/${projectId}/jobs/${manualJob.id}/play`,
      {},
      {
        headers: { "PRIVATE-TOKEN": token },
        httpsAgent: agent,
      }
    );

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
