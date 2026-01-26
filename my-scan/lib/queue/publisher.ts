import amqp from "amqplib"; // ใช้ Default Import
import {
  ScanJob,
  BUILD_QUEUE_NAME,
  SCAN_QUEUE_NAME,
  DEAD_LETTER_QUEUE,
} from "./types";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";

// ประกาศตัวแปร Global ไว้เก็บ Connection/Channel
// ใช้ 'any' เพื่อตัดปัญหา Type ตีกัน (แต่ยังทำงานได้ปกติ)
let connection: any = null;
let channel: any = null;

async function getChannel() {
  if (channel) return channel;

  try {
    // ✅ ไม้ตาย: ใช้ 'as any' เพื่อบังคับให้ TypeScript ยอมรับค่าที่ได้
    console.log("[RabbitMQ] Connecting to:", RABBITMQ_URL);
    const conn = (await amqp.connect(RABBITMQ_URL)) as any;
    const ch = (await conn.createChannel()) as any;

    // เก็บลงตัวแปร Global
    connection = conn;
    channel = ch;

    // สร้าง Dead Letter Queue
    await ch.assertQueue(DEAD_LETTER_QUEUE, { durable: true });

    // สร้าง Queue สำหรับงาน Build (Priority 1-10)
    await ch.assertQueue(BUILD_QUEUE_NAME, {
      durable: true,
      deadLetterExchange: "",
      deadLetterRoutingKey: DEAD_LETTER_QUEUE,
      arguments: { "x-max-priority": 10 },
    });

    // สร้าง Queue สำหรับงาน Scan (Priority 1-10)
    await ch.assertQueue(SCAN_QUEUE_NAME, {
      durable: true,
      deadLetterExchange: "",
      deadLetterRoutingKey: DEAD_LETTER_QUEUE,
      arguments: { "x-max-priority": 10 },
    });

    // Handle Events
    conn.on("error", (err: any) => {
      console.error("[RabbitMQ] Connection error:", err);
      channel = null;
      connection = null;
    });

    conn.on("close", () => {
      console.warn("[RabbitMQ] Connection closed");
      channel = null;
      connection = null;
    });

    return ch;
  } catch (error) {
    console.error("[RabbitMQ] Failed to connect:", error);
    return null;
  }
}

export async function publishScanJob(job: ScanJob): Promise<boolean> {
  try {
    const ch = await getChannel();

    // Check channel availability
    if (!ch) {
      console.error("[Queue] Channel not available");
      return false;
    }

    const message = Buffer.from(JSON.stringify(job));

    // เลือก Queue ตามประเภทงาน
    const targetQueue =
      job.type === "SCAN_AND_BUILD" ? BUILD_QUEUE_NAME : SCAN_QUEUE_NAME;

    const success = ch.sendToQueue(targetQueue, message, {
      persistent: true,
      priority: job.priority || 1,
      messageId: job.id,
      timestamp: Date.now(),
      headers: { type: job.type },
    });

    if (success) {
      console.log(`[Queue] Published to ${targetQueue} | JobID: ${job.id}`);
    }

    return success;
  } catch (error) {
    console.error("[Queue] Failed to publish:", error);
    return false;
  }
}
