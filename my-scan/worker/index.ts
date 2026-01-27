// ✅ 1. ใส่บรรทัดนี้ไว้บนสุด เพื่อให้ Worker อ่านค่าจาก .env ได้
import "dotenv/config";

import amqp, { Channel, ConsumeMessage } from "amqplib";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import {
  ScanJob,
  BUILD_QUEUE_NAME,
  SCAN_QUEUE_NAME,
  DEAD_LETTER_QUEUE,
  RESULT_QUEUE,
} from "../lib/queue/types";

// --- Configuration ---
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
// ✅ เช็คให้ชัวร์ว่า URL มี /api/v4 ต่อท้าย
const GITLAB_API_URL =
  process.env.GITLAB_API_URL || "https://gitlab.com/api/v4";
const GITLAB_TRIGGER_TOKEN = process.env.GITLAB_TRIGGER_TOKEN;
// ✅ ใช้ ID 141 ตามที่คุณระบุ (ถ้าจะเปลี่ยนให้ไปแก้ใน .env หรือแก้ตรงนี้)
const GITLAB_PROJECT_ID = process.env.GITLAB_PROJECT_ID || "141";

// Debug: เช็คว่า Token มาจริงไหม (จะแสดงแค่ 4 ตัวท้าย)
if (!GITLAB_TRIGGER_TOKEN) {
  console.error("❌ CRITICAL: GITLAB_TRIGGER_TOKEN is missing in .env");
} else {
  console.log(`✅ Loaded Trigger Token: ...${GITLAB_TRIGGER_TOKEN.slice(-4)}`);
}

const prisma = new PrismaClient();
let connection: any = null;

async function startWorker() {
  console.log("🚀 Starting VisScan Multi-Lane Worker...");
  console.log(`   - Target Project ID: ${GITLAB_PROJECT_ID}`); // Show Project ID
  console.log(`   - Build Lane: 4 concurrent jobs`);
  console.log(`   - Scan Lane:  6 concurrent jobs`);

  try {
    const conn = (await amqp.connect(RABBITMQ_URL)) as any;
    connection = conn;

    conn.on("error", (err: any) =>
      console.error("[Worker] Connection error:", err),
    );
    conn.on("close", () => {
      console.warn("[Worker] Connection closed, reconnecting...");
      setTimeout(startWorker, 5000);
    });

    console.log("[Worker] Connected to RabbitMQ");

    // --- Channels ---
    const buildChannel = (await conn.createChannel()) as any;
    await setupQueue(buildChannel, BUILD_QUEUE_NAME);
    await buildChannel.prefetch(4);
    buildChannel.consume(BUILD_QUEUE_NAME, (msg: ConsumeMessage | null) => {
      if (msg) handleMessage(msg, buildChannel);
    });

    const scanChannel = (await conn.createChannel()) as any;
    await setupQueue(scanChannel, SCAN_QUEUE_NAME);
    await scanChannel.prefetch(6);
    scanChannel.consume(SCAN_QUEUE_NAME, (msg: ConsumeMessage | null) => {
      if (msg) handleMessage(msg, scanChannel);
    });
  } catch (error) {
    console.error("[Worker] Failed to start:", error);
    setTimeout(startWorker, 5000);
  }
}

async function setupQueue(ch: Channel, queueName: string) {
  await ch.assertQueue(DEAD_LETTER_QUEUE, { durable: true });
  await ch.assertQueue(RESULT_QUEUE, { durable: true });
  await ch.assertQueue(queueName, {
    durable: true,
    deadLetterExchange: "",
    deadLetterRoutingKey: DEAD_LETTER_QUEUE,
    arguments: { "x-max-priority": 10 },
  });
}

async function handleMessage(msg: ConsumeMessage, ch: Channel) {
  const jobContent = msg.content.toString();
  let job: ScanJob;

  try {
    job = JSON.parse(jobContent);
  } catch (e) {
    console.error("Failed to parse job JSON", e);
    ch.nack(msg, false, false);
    return;
  }

  console.log(`[Processing] Job ${job.id} (${job.type})`);

  try {
    await prisma.scanHistory.update({
      where: { id: job.scanHistoryId },
      data: { status: "RUNNING" },
    });

    const pipelineId = await triggerGitLab(job);

    await prisma.scanHistory.update({
      where: { id: job.scanHistoryId },
      data: {
        pipelineId: String(pipelineId),
        scanId: String(pipelineId),
      },
    });

    console.log(`✅ Job ${job.id} triggered pipeline ${pipelineId}`);
    ch.ack(msg);
  } catch (error: any) {
    console.error(`❌ Job ${job.id} failed:`, error.message);

    // Debug Error จาก GitLab
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        "🔴 GitLab Response Data:",
        JSON.stringify(error.response.data, null, 2),
      );
    }

    try {
      await prisma.scanHistory.update({
        where: { id: job.scanHistoryId },
        data: { status: "FAILED_TRIGGER", errorMessage: error.message },
      });
    } catch (dbError) {
      console.error("Failed to update DB status:", dbError);
    }
    ch.ack(msg);
  }
}

async function triggerGitLab(job: ScanJob): Promise<number> {
  const projectId = GITLAB_PROJECT_ID;

  // สร้างชื่อ Project สวยๆ จาก URL (เอาไว้แสดงผล)
  const projectPath = extractProjectPath(job.repoUrl);

  console.log(`[Debug] Triggering GitLab Project ID: ${projectId}`);

  // ✅ แก้ไข: เพิ่มตัวแปรที่ขาดหายไป (USER_REPO_URL, PROJECT_NAME, FRONTEND_USER)
  const variables: Record<string, string> = {
    // --- ตัวแปรบังคับ (Critical) ---
    USER_REPO_URL: job.repoUrl, // 👈 ตัวนี้สำคัญสุด! ถ้าไม่มีคือพัง (exit 1)

    // --- ตัวแปรสำหรับ Logic ---
    SCAN_MODE: job.type === "SCAN_AND_BUILD" ? "SCAN_AND_BUILD" : "SCAN_ONLY",
    CONTEXT_PATH: job.contextPath,
    IMAGE_TAG: job.imageTag || "latest",
    SCAN_HISTORY_ID: job.scanHistoryId,

    // --- ตัวแปรสำหรับ Credentials ---
    GIT_TOKEN: job.gitToken || "",
    DOCKER_PASSWORD: job.dockerToken || "",
    DOCKER_USER: job.dockerUser || "",

    // --- ตัวแปรสำหรับแสดงผลชื่อ Pipeline (Display) ---
    PROJECT_NAME: projectPath, // 👈 แก้ชื่อหาย
    FRONTEND_USER: job.userId, // 👈 แก้ "by ..." หาย
    USER_TAG: job.imageTag || "latest",
  };

  if (job.imageName) variables.IMAGE_NAME = job.imageName;
  if (job.customDockerfile) variables.CUSTOM_DOCKERFILE = job.customDockerfile;

  try {
    const response = await axios.post(
      `${GITLAB_API_URL}/projects/${projectId}/trigger/pipeline`,
      {
        variables: variables,
      },
      {
        params: {
          token: GITLAB_TRIGGER_TOKEN,
          ref: "main",
        },
      },
    );
    return response.data.id;
  } catch (error: any) {
    console.error(`❌ Failed URL: ${error.config?.url}`);
    throw error;
  }
}

function extractProjectPath(url: string): string {
  let cleanUrl = url.replace(/^https?:\/\//, "");
  cleanUrl = cleanUrl.substring(cleanUrl.indexOf("/") + 1);
  return cleanUrl.replace(/\.git$/, "");
}


// ... (keep existing imports)

const GITLAB_TOKEN = process.env.GITLAB_TOKEN;

// ... (keep existing setup)

// ✅ Increase polling interval to avoid rate limits
const POLLING_INTERVAL = 10000;

async function startPoller() {
  console.log("🔄 Starting Status Poller...");
  setInterval(pollRunningScans, POLLING_INTERVAL);
}

async function pollRunningScans() {
  try {
    const runningScans = await prisma.scanHistory.findMany({
      where: {
        status: "RUNNING",
        AND: [
            { pipelineId: { not: { equals: null } } },
            // Exclude waiting/pending IDs generated locally
            { pipelineId: { not: { startsWith: "WAITING" } } }
        ]
      },
      select: { id: true, pipelineId: true }
    });

    if (runningScans.length === 0) return;

    console.log(`[Poller] Checking ${runningScans.length} running scans...`);

    for (const scan of runningScans) {
        if (!scan.pipelineId) continue;
        
        try {
            const url = `${GITLAB_API_URL}/projects/${GITLAB_PROJECT_ID}/pipelines/${scan.pipelineId}`;
            const res = await axios.get(url, {
                headers: { "PRIVATE-TOKEN": GITLAB_TOKEN }
            });
            
            const glStatus = res.data.status; // success, failed, running, etc.
            let newStatus = "";
            
            if (glStatus === "success") newStatus = "SUCCESS";
            else if (glStatus === "failed") newStatus = "FAILED";
            else if (glStatus === "canceled") newStatus = "CANCELLED";
            else if (glStatus === "skipped") newStatus = "FAILED";
            
            if (newStatus && newStatus !== "RUNNING") {
                 console.log(`[Poller] Scan ${scan.id} (Pipeline ${scan.pipelineId}) changed to ${newStatus}`);
                 
                 // TODO: Fetch report artifacts here if possible
                 
                 await prisma.scanHistory.update({
                     where: { id: scan.id },
                     data: { 
                         status: newStatus,
                         completedAt: new Date()
                     }
                 });
            }
        } catch (error: any) {
            console.error(`[Poller] Failed to check pipeline ${scan.pipelineId}:`, error.message);
        }
    }
  } catch (error) {
      console.error("[Poller] Error:", error);
  }
}

startWorker();
startPoller();

