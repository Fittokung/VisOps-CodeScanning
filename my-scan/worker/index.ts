// [INFO] 1. Ensure this line is at the top to load .env configs
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
// [INFO] Ensure URL has /api/v4 suffix
const GITLAB_API_URL =
  process.env.GITLAB_API_URL || "https://gitlab.com/api/v4";
const GITLAB_TRIGGER_TOKEN = process.env.GITLAB_TRIGGER_TOKEN;
// [INFO] Use ID 141 as specified (change in .env if needed)
const GITLAB_PROJECT_ID = process.env.GITLAB_PROJECT_ID;
if (!GITLAB_PROJECT_ID) {
  throw new Error("❌ CRITICAL: GITLAB_PROJECT_ID is missing in .env");
}

// Debug: Check if Token exists (showing last 4 chars)
if (!GITLAB_TRIGGER_TOKEN) {
  console.error("[CRITICAL] GITLAB_TRIGGER_TOKEN is missing in .env");
} else {
  console.log(`[INFO] Loaded Trigger Token: ...${GITLAB_TRIGGER_TOKEN.slice(-4)}`);
}

const prisma = new PrismaClient();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connection: any = null;

async function startWorker() {
  console.log("[INFO] Starting VisScan Multi-Lane Worker...");
  console.log(`   - Target Project ID: ${GITLAB_PROJECT_ID}`); // Show Project ID
  console.log(`   - Build Lane: 4 concurrent jobs`);
  console.log(`   - Scan Lane:  6 concurrent jobs`);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn = (await amqp.connect(RABBITMQ_URL)) as any;
    connection = conn;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conn.on("error", (err: any) =>
      console.error("[Worker] Connection error:", err),
    );
    conn.on("close", () => {
      console.warn("[Worker] Connection closed, reconnecting...");
      setTimeout(startWorker, 5000);
    });

    console.log("[Worker] Connected to RabbitMQ");

    // --- Channels ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buildChannel = (await conn.createChannel()) as any;
    await setupQueue(buildChannel, BUILD_QUEUE_NAME);
    // [INFO] Limit concurrent Build & Scan jobs to 4 (Quota Rule)
    // If all 4 slots are busy, new jobs will stay in RabbitMQ with status "QUEUED"
    await buildChannel.prefetch(4);
    buildChannel.consume(BUILD_QUEUE_NAME, (msg: ConsumeMessage | null) => {
      if (msg) handleMessage(msg, buildChannel);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scanChannel = (await conn.createChannel()) as any;
    await setupQueue(scanChannel, SCAN_QUEUE_NAME);
    // [INFO] Limit concurrent Scan Only jobs to 6 (Quota Rule)
    // Total concurrency = 4 (Build) + 6 (Scan) = 10 Max Users
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

// [NEW] Helper to append logs
function appendLog(currentLogs: any, status: string, message?: string) {
  const logs = Array.isArray(currentLogs) ? currentLogs : [];
  logs.push({
    status,
    timestamp: new Date().toISOString(),
    message,
  });
  return logs;
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
  
  const currentJob = await prisma.scanHistory.findUnique({ 
    where: { id: job.scanHistoryId }, 
    select: { status: true, scanLogs: true } 
  });
  
  if (!currentJob || currentJob.status === "CANCELLED" || currentJob.status === "FAILED_TRIGGER") {
      console.warn(`[Worker] Job ${job.id} was ${currentJob?.status || "deleted"}. Skipping.`);
      ch.ack(msg);
      return;
  }

  try {
    // [NEW] Concurrency Control - Wait if system is busy
    const MAX_CONCURRENT = job.type === "SCAN_AND_BUILD" ? 4 : 6;
    
    while (true) {
        const targetMode = job.type === "SCAN_AND_BUILD" ? "SCAN_AND_BUILD" : "SCAN_ONLY";
        const activeScans = await prisma.scanHistory.count({
            where: {
                status: "RUNNING",
                scanMode: targetMode
            }
        });

        // console.log(`[Queue] DEBUG: Checking Concurrency for ${targetMode}. Active: ${activeScans}, Limit: ${MAX_CONCURRENT}`);

        if (activeScans < MAX_CONCURRENT) {
            break; // Slot available
        }

        console.log(`[Queue] System Busy (${activeScans}/${MAX_CONCURRENT} active). Job ${job.id} waiting...`);
        await new Promise(r => setTimeout(r, 5000)); // Wait 5s
    }

    // Now mark as RUNNING and Trigger
     await prisma.scanHistory.update({
      where: { id: job.scanHistoryId },
      data: { 
        status: "RUNNING",
        scanLogs: appendLog(currentJob.scanLogs, "RUNNING", "System slot allocated. Triggering pipeline...")
      },
    });

    const pipelineId = await triggerGitLab(job);

    await prisma.scanHistory.update({
      where: { id: job.scanHistoryId },
      data: {
        pipelineId: String(pipelineId),
        scanId: String(pipelineId),
        scanLogs: appendLog(currentJob.scanLogs, "PIPELINE_CREATED", `Pipeline ID: ${pipelineId}`)
      },
    });

    console.log(`[INFO] Job ${job.id} triggered pipeline ${pipelineId}`);
    ch.ack(msg);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[ERROR] Job ${job.id} failed:`, errorMessage);

    // Debug Error จาก GitLab
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        "[ERROR] GitLab Response Data:",
        JSON.stringify(error.response.data, null, 2),
      );
    }

    try {
      // Re-fetch to get latest logs in case of race/interleaved updates (unlikely here but safe)
      const latestJob = await prisma.scanHistory.findUnique({ where: { id: job.scanHistoryId }, select: { scanLogs: true } });
      
      await prisma.scanHistory.update({
        where: { id: job.scanHistoryId },
        data: { 
          status: "FAILED_TRIGGER", 
          errorMessage: errorMessage,
          scanLogs: appendLog(latestJob?.scanLogs, "FAILED_TRIGGER", errorMessage)
        },
      });
    } catch (dbError) {
      console.error("Failed to update DB status:", dbError);
    }
    ch.ack(msg);
  }
}

async function triggerGitLab(job: ScanJob): Promise<number> {
  const projectId = GITLAB_PROJECT_ID;


  const projectPath = extractProjectPath(job.repoUrl);

  console.log(`[Debug] Triggering GitLab Project ID: ${projectId}`);


  const variables: Record<string, string> = {
    // --- ตัวแปรบังคับ (Critical) ---
    USER_REPO_URL: job.repoUrl, 

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
    PROJECT_NAME: projectPath, 
    FRONTEND_USER: job.username || "unknown_user", // [INFO] Use Username instead of ID
    USER_TAG: job.imageTag || "latest",

    // [NEW] Pass Trivy Scan Mode
    TRIVY_SCAN_MODE: job.trivyScanMode || "full",
  };

  if (job.imageName) variables.IMAGE_NAME = job.imageName;
  if (job.customDockerfile) variables.CUSTOM_DOCKERFILE = job.customDockerfile;

  // --- Debug Logging ---
  console.log(`[GitLab Trigger] Preparing to trigger for Job ${job.id}`);
  console.log(`   - Scan Mode: ${variables.SCAN_MODE}`);
  console.log(`   - Repo: ${variables.USER_REPO_URL}`);
  console.log(`   - Image: ${variables.IMAGE_NAME}:${variables.IMAGE_TAG}`);

  try {
    // [FIX] Fix: Use URLSearchParams to send variables as form-data
    // This is more reliable for GitLab Triggers than JSON body
    const params = new URLSearchParams();
    params.append("token", GITLAB_TRIGGER_TOKEN!);
    params.append("ref", "main");
    
    // Append variables as variables[KEY]=VALUE
    Object.entries(variables).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(`variables[${key}]`, String(value));
      }
    });

    const response = await axios.post(
      `${GITLAB_API_URL}/projects/${projectId}/trigger/pipeline`,
      params, // Send data as form-urlencoded
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 10000,
      }
    );
    return response.data.id;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
        console.error(`[ERROR] Failed URL: ${error.config?.url}`);
        if (error.response) {
            console.error(
                "[ERROR] GitLab Error Response:",
                JSON.stringify(error.response.data, null, 2)
            );
        }
    }
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

const POLLING_INTERVAL = 10000;

async function startPoller() {
  console.log("[INFO] Starting Status Poller...");
  setInterval(pollRunningScans, POLLING_INTERVAL);
}

// [NEW] Helper to download artifacts
async function fetchReportArtifacts(pipelineId: string) {
    try {
      console.log(`[Artifacts] Fetching reports for Pipeline ${pipelineId}...`);
  
      // 1. List Jobs in Pipeline to find "gitleaks_scan", "semgrep_scan", "trivy_scan"
      const jobsRes = await axios.get(
        `${GITLAB_API_URL}/projects/${GITLAB_PROJECT_ID}/pipelines/${pipelineId}/jobs`,
        { headers: { "PRIVATE-TOKEN": GITLAB_TOKEN } }
      );
  
      const jobs = jobsRes.data;
      const reportMap: Record<string, any> = {};
  
      // Define jobs and their artifact paths
      const targetJobs = [
        { name: "gitleaks_scan", artifact: "gitleaks-report.json", key: "gitleaks" },
        { name: "semgrep_scan", artifact: "semgrep-report.json", key: "semgrep" },
        { name: "trivy_scan", artifact: "trivy-report.json", key: "trivy" },
      ];
  
      for (const target of targetJobs) {
        // Find the successful job
        const job = jobs.find((j: any) => j.name === target.name && j.status === "success");
        if (!job) continue;
  
        try {
          // 2. Download Artifact File
          const fileRes = await axios.get(
            `${GITLAB_API_URL}/projects/${GITLAB_PROJECT_ID}/jobs/${job.id}/artifacts/${target.artifact}`,
            { 
                headers: { "PRIVATE-TOKEN": GITLAB_TOKEN },
                responseType: "json" // Expect JSON response
            }
          );
          
          console.log(`[Artifacts] Downloaded ${target.artifact} from Job ${job.id}`);
          reportMap[target.key] = fileRes.data;
        } catch (err) {
           console.warn(`[Artifacts] Failed to download ${target.artifact}:`, axios.isAxiosError(err) ? err.message : err);
        }
      }
  
      // 3. Update Database with explicit JSON object
      if (Object.keys(reportMap).length > 0) {
         // Find scan by pipelineId
         const scan = await prisma.scanHistory.findUnique({ where: { pipelineId } });
         if (scan) {
             await prisma.scanHistory.update({
                 where: { id: scan.id },
                 data: { 
                     reportJson: reportMap
                 }
             });
             console.log(`[Artifacts] Saved reports to DB for Scan ${scan.id}`);
         }
      }
  
    } catch (error) {
       console.error(`[Artifacts] Error processing pipeline ${pipelineId}:`, error);
    }
  }

async function pollRunningScans() {
  try {
    const runningScans = await prisma.scanHistory.findMany({
      where: {
        status: "RUNNING",
        AND: [
            { pipelineId: { not: { equals: null } } },
            { pipelineId: { not: { startsWith: "WAITING" } } }
        ]
      },
      select: { id: true, pipelineId: true, scanLogs: true, startedAt: true } // [NEW] Select startedAt
    });

    if (runningScans.length === 0) return;

    // console.log(`[Poller] Checking ${runningScans.length} running scans...`);

    const TIMEOUT_MS = 60 * 60 * 1000; // 60 Minutes

    for (const scan of runningScans) {
        if (!scan.pipelineId) continue;

        // [NEW] Zombie Detection
        if (scan.startedAt) {
            const age = Date.now() - new Date(scan.startedAt).getTime();
            if (age > TIMEOUT_MS) {
                console.warn(`[Zombie] Scan ${scan.id} (Pipeline ${scan.pipelineId}) timed out (>60m). Killing...`);
                await prisma.scanHistory.update({
                    where: { id: scan.id },
                    data: {
                        status: "FAILED",
                        errorMessage: "Job timed out (Zombie Detection)",
                        completedAt: new Date(),
                        scanLogs: appendLog(scan.scanLogs, "FAILED", "Job timed out (Zombie Detection)")
                    }
                });
                continue; // Skip GitLab check if we killed it
            }
        }
        
        try {
            // 1. Fetch Pipeline Status
            const url = `${GITLAB_API_URL}/projects/${GITLAB_PROJECT_ID}/pipelines/${scan.pipelineId}`;
            const res = await axios.get(url, {
                headers: { "PRIVATE-TOKEN": GITLAB_TOKEN },
                timeout: 5000, 
            });

            // 2. [NEW] Fetch Pipeline Jobs (Stages)
            // We fetch the jobs to visualize the stepper (Build -> Test -> Scan, etc.)
            let pipelineJobs = [];
            try {
                const jobsRes = await axios.get(
                    `${GITLAB_API_URL}/projects/${GITLAB_PROJECT_ID}/pipelines/${scan.pipelineId}/jobs`,
                    { headers: { "PRIVATE-TOKEN": GITLAB_TOKEN } }
                );
                // Map to simplified structure
                pipelineJobs = jobsRes.data.map((job: any) => ({
                    id: job.id,
                    name: job.name,
                    stage: job.stage,
                    status: job.status,
                    started_at: job.started_at,
                    finished_at: job.finished_at,
                    duration: job.duration
                }));
            } catch (jobErr) {
                 console.warn(`[Poller] Failed to fetch jobs for ${scan.pipelineId}:`, jobErr);
            }
            
            const glStatus = res.data.status; 
            let newStatus = "";
            
            if (glStatus === "success") newStatus = "SUCCESS";
            else if (glStatus === "failed") newStatus = "FAILED";
            else if (glStatus === "canceled") newStatus = "CANCELLED";
            else if (glStatus === "skipped") newStatus = "FAILED";
            
            // [UPDATE] Always update pipelineJobs even if status hasn't changed
            // This ensures the frontend stepper animates in real-time
            if (!newStatus || newStatus === "RUNNING") {
                 await prisma.scanHistory.update({
                     where: { id: scan.id },
                     data: { 
                         pipelineJobs: pipelineJobs // Update jobs progress
                     } as any
                 });
            }

            if (newStatus && newStatus !== "RUNNING") {
                 console.log(`[Poller] Scan ${scan.id} (Pipeline ${scan.pipelineId}) changed to ${newStatus}`);
                 
                     // [NEW] Fetch Artifacts on Success
                 if (newStatus === "SUCCESS") {
                    await fetchReportArtifacts(scan.pipelineId);
                    // [NEW] Update Average Duration
                    await updateServiceAverageDuration(scan.id);
                 }
                 
                 await prisma.scanHistory.update({
                     where: { id: scan.id },
                     data: { 
                         status: newStatus,
                         completedAt: new Date(),
                         scanLogs: appendLog(scan.scanLogs as any, newStatus, `Pipeline finished with status ${glStatus}`),
                         pipelineJobs: pipelineJobs // Save final state of jobs
                     } as any
                 });
            }
        } catch (error: unknown) {
            // [FIX]: Handle 404 (Deleted) and 401 (Unauthorized/Token Invalid)
            if (axios.isAxiosError(error) && error.response) {
                const status = error.response.status;
                if (status === 404) {
                     const reason = "Pipeline deleted in GitLab";
                     console.log(`[Poller] Pipeline ${scan.pipelineId} not found (404). Marking as CANCELLED.`);
                     
                     await prisma.scanHistory.update({
                         where: { id: scan.id },
                         data: { 
                             status: "CANCELLED",
                             errorMessage: reason,
                             completedAt: new Date(),
                             scanLogs: appendLog(scan.scanLogs, "CANCELLED", reason)
                         }
                     });
                } else if (status === 401 || status === 403) {
                     // [WARN] Warning only: Don't cancel scan, just log.
                     // Because a token issue shouldn't kill a running pipeline.
                     console.warn(`[Poller] checking pipeline ${scan.pipelineId} failed (Status ${status}). Check GITLAB_TOKEN permissions.`);
                } else {
                    console.error(`[Poller] Failed to check pipeline ${scan.pipelineId}:`, error.message);
                }
            } else {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`[Poller] Failed to check pipeline ${scan.pipelineId}:`, errorMessage);
            }
        }
    }
  } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[Poller] Error:", errorMessage);
  }
}

// [NEW] Helper to calculate and update average duration
async function updateServiceAverageDuration(scanHistoryId: string) {
    try {
        const currentScan = await prisma.scanHistory.findUnique({
            where: { id: scanHistoryId },
            select: { serviceId: true, startedAt: true }
        });

        if (!currentScan || !currentScan.startedAt) return;

        // Calculate current duration in seconds
        const durationSec = Math.round((Date.now() - new Date(currentScan.startedAt).getTime()) / 1000);

        // Fetch last 5 SUCCESSFUL scans for this service to calculate rolling average
        const lastScans = await prisma.scanHistory.findMany({
            where: {
                serviceId: currentScan.serviceId,
                status: "SUCCESS",
                startedAt: { not: null },
                completedAt: { not: null }
            },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { startedAt: true, completedAt: true }
        });

        let totalDuration = durationSec;
        let count = 1;

        for (const scan of lastScans) {
            if (scan.startedAt && scan.completedAt) {
                const d = Math.round((new Date(scan.completedAt).getTime() - new Date(scan.startedAt).getTime()) / 1000);
                if (d > 0) {
                    totalDuration += d;
                    count++;
                }
            }
        }

        const averageDuration = Math.round(totalDuration / count);

        await prisma.projectService.update({
            where: { id: currentScan.serviceId },
            data: { averageDuration }
        });

        console.log(`[Duration] Updated Service ${currentScan.serviceId} avg duration to ${averageDuration}s (based on ${count} scans)`);

    } catch (e) {
        console.error(`[Duration] Failed to update average duration for scan ${scanHistoryId}:`, e);
    }
}

startWorker();
startPoller();

