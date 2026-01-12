// worker/index.ts
/**
 * RabbitMQ Worker Service
 *
 * This is a standalone Node.js worker that runs separately from Next.js.
 * It consumes scan jobs from RabbitMQ and triggers GitLab CI/CD pipelines.
 *
 * Run with: npx tsx worker/index.ts
 * Or in production: node dist/worker/index.js
 */

import amqplib, { ChannelModel, Channel, ConsumeMessage } from "amqplib";
import {
  ScanJob,
  JobResult,
  QUEUE_NAME,
  RESULT_QUEUE,
  DEAD_LETTER_QUEUE,
} from "../lib/queue/types";

// Configuration
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const GITLAB_API_URL =
  process.env.GITLAB_API_URL || "https://gitlab.com/api/v4";
const GITLAB_PROJECT_ID = process.env.GITLAB_PROJECT_ID;
const GITLAB_TRIGGER_TOKEN = process.env.GITLAB_TRIGGER_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

// Worker state
let connection: ChannelModel | null = null;
let channel: Channel | null = null;
let isShuttingDown = false;

/**
 * Initialize worker connection
 */
async function connect(): Promise<void> {
  try {
    console.log("[Worker] Connecting to RabbitMQ...");
    const conn = await amqplib.connect(RABBITMQ_URL);
    connection = conn;
    const ch = await conn.createChannel();
    channel = ch;

    // Set prefetch to 1 for fair dispatch
    await ch.prefetch(1);

    // Assert queues
    await ch.assertQueue(DEAD_LETTER_QUEUE, { durable: true });
    await ch.assertQueue(RESULT_QUEUE, { durable: true });
    await ch.assertQueue(QUEUE_NAME, {
      durable: true,
      deadLetterExchange: "",
      deadLetterRoutingKey: DEAD_LETTER_QUEUE,
      arguments: { "x-max-priority": 10 },
    });

    // Handle connection events
    conn.on("close", () => {
      if (!isShuttingDown) {
        console.log("[Worker] Connection lost, reconnecting...");
        setTimeout(connect, 5000);
      }
    });

    conn.on("error", (err: Error) => {
      console.error("[Worker] Connection error:", err);
    });

    console.log("[Worker] Connected successfully");
  } catch (error) {
    console.error("[Worker] Failed to connect:", error);
    setTimeout(connect, 5000);
  }
}

/**
 * Process a scan job
 */
async function processJob(job: ScanJob): Promise<JobResult> {
  console.log(`[Worker] Processing job ${job.id} (${job.type})`);

  const result: JobResult = {
    jobId: job.id,
    scanHistoryId: job.scanHistoryId,
    status: "SUCCESS",
    vulnCritical: 0,
    vulnHigh: 0,
    vulnMedium: 0,
    vulnLow: 0,
    completedAt: new Date().toISOString(),
  };

  try {
    // Update scan status to RUNNING
    await updateScanStatus(job.scanHistoryId, "RUNNING");

    // Trigger GitLab pipeline
    const pipelineId = await triggerGitLabPipeline(job);

    if (!pipelineId) {
      throw new Error("Failed to trigger pipeline");
    }

    // Poll pipeline status until completion
    const pipelineResult = await waitForPipelineCompletion(pipelineId);

    // Parse results
    result.status = pipelineResult.success ? "SUCCESS" : "FAILED_BUILD";
    result.vulnCritical = pipelineResult.vulnerabilities?.critical || 0;
    result.vulnHigh = pipelineResult.vulnerabilities?.high || 0;
    result.vulnMedium = pipelineResult.vulnerabilities?.medium || 0;
    result.vulnLow = pipelineResult.vulnerabilities?.low || 0;
    result.reportJson = pipelineResult.report;
    result.buildLogs = pipelineResult.logs;

    // Check for security failures
    if (result.vulnCritical > 0) {
      result.status = "FAILED_SECURITY";
    }
  } catch (error: any) {
    console.error(`[Worker] Job ${job.id} failed:`, error);
    result.status = "FAILED_BUILD";
    result.errorMessage = error.message;
  }

  return result;
}

/**
 * Trigger GitLab CI/CD pipeline
 */
async function triggerGitLabPipeline(job: ScanJob): Promise<string | null> {
  try {
    const response = await fetch(
      `${GITLAB_API_URL}/projects/${GITLAB_PROJECT_ID}/trigger/pipeline`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: GITLAB_TRIGGER_TOKEN,
          ref: "main",
          variables: {
            SCAN_ID: job.scanHistoryId,
            REPO_URL: job.repoUrl,
            CONTEXT_PATH: job.contextPath,
            IMAGE_NAME: job.imageName || "",
            IMAGE_TAG: job.imageTag || "latest",
            SCAN_MODE: job.type,
            GIT_TOKEN: job.gitToken || "",
            DOCKER_USER: job.dockerUser || "",
            DOCKER_TOKEN: job.dockerToken || "",
            CUSTOM_DOCKERFILE: job.customDockerfile || "",
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Pipeline trigger failed: ${error.message}`);
    }

    const data = await response.json();
    return data.id?.toString();
  } catch (error) {
    console.error("[Worker] Failed to trigger pipeline:", error);
    return null;
  }
}

/**
 * Wait for pipeline completion
 */
async function waitForPipelineCompletion(pipelineId: string): Promise<{
  success: boolean;
  vulnerabilities?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  report?: object;
  logs?: string;
}> {
  const maxAttempts = 120; // 10 minutes with 5s intervals
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(
        `${GITLAB_API_URL}/projects/${GITLAB_PROJECT_ID}/pipelines/${pipelineId}`,
        {
          headers: {
            "PRIVATE-TOKEN": process.env.GITLAB_ACCESS_TOKEN || "",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch pipeline status");
      }

      const pipeline = await response.json();

      if (["success", "failed", "canceled"].includes(pipeline.status)) {
        // Fetch artifacts/results
        return {
          success: pipeline.status === "success",
          // TODO: Parse actual vulnerability results from artifacts
          vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
        };
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    } catch (error) {
      console.error("[Worker] Pipeline poll error:", error);
      attempts++;
    }
  }

  throw new Error("Pipeline timeout");
}

/**
 * Update scan status in database
 */
async function updateScanStatus(
  scanHistoryId: string,
  status: string
): Promise<void> {
  // TODO: Use Prisma or direct database connection
  console.log(`[Worker] Updating scan ${scanHistoryId} status to ${status}`);
}

/**
 * Start consuming jobs
 */
async function startConsuming(): Promise<void> {
  if (!channel) {
    console.error("[Worker] No channel available");
    return;
  }

  console.log("[Worker] Starting to consume jobs...");

  channel.consume(
    QUEUE_NAME,
    async (msg: ConsumeMessage | null) => {
      if (!msg || !channel) return;

      try {
        const job: ScanJob = JSON.parse(msg.content.toString());
        console.log(`[Worker] Received job ${job.id}`);

        // Process the job
        const result = await processJob(job);

        // Publish result
        channel.sendToQueue(RESULT_QUEUE, Buffer.from(JSON.stringify(result)), {
          persistent: true,
        });

        // Update database
        await updateScanStatus(job.scanHistoryId, result.status);

        // Acknowledge the message
        channel.ack(msg);
        console.log(
          `[Worker] Job ${job.id} completed with status ${result.status}`
        );
      } catch (error: any) {
        console.error("[Worker] Job processing error:", error);

        // Reject and requeue on transient errors, or send to DLQ
        const requeue = error.transient === true;
        channel.nack(msg, false, requeue);
      }
    },
    { noAck: false }
  );
}

/**
 * Graceful shutdown
 */
async function shutdown(): Promise<void> {
  console.log("[Worker] Shutting down...");
  isShuttingDown = true;

  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
  } catch (error) {
    console.error("[Worker] Error during shutdown:", error);
  }

  process.exit(0);
}

// Handle signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Main
async function main(): Promise<void> {
  console.log("[Worker] Starting scan worker...");

  await connect();
  await startConsuming();

  console.log("[Worker] Worker is running. Press Ctrl+C to stop.");
}

main().catch(console.error);
