// lib/queue/publisher.ts
/**
 * RabbitMQ Publisher for Next.js API Routes
 * Handles publishing scan jobs to the queue
 */

import { ScanJob, QUEUE_NAME, DEAD_LETTER_QUEUE } from "./types";

// Connection configuration
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";

let channel: any = null;
let connection: any = null;

/**
 * Get or create a RabbitMQ channel
 * Uses lazy initialization for serverless environments
 */
async function getChannel() {
  if (channel && connection) {
    return channel;
  }

  try {
    // Dynamic import for amqplib to avoid issues in Edge runtime
    const amqp = await import("amqplib");

    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Assert queues exist with proper configuration
    await channel.assertQueue(DEAD_LETTER_QUEUE, { durable: true });

    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
      deadLetterExchange: "",
      deadLetterRoutingKey: DEAD_LETTER_QUEUE,
      arguments: {
        "x-max-priority": 10, // Enable priority queue
      },
    });

    // Handle connection close
    connection.on("close", () => {
      channel = null;
      connection = null;
      console.log("[RabbitMQ] Connection closed");
    });

    connection.on("error", (err: Error) => {
      console.error("[RabbitMQ] Connection error:", err);
      channel = null;
      connection = null;
    });

    console.log("[RabbitMQ] Publisher connected");
    return channel;
  } catch (error) {
    console.error("[RabbitMQ] Failed to connect:", error);
    throw error;
  }
}

/**
 * Publish a scan job to the queue
 */
export async function publishScanJob(job: ScanJob): Promise<boolean> {
  try {
    const ch = await getChannel();

    const message = Buffer.from(JSON.stringify(job));

    const success = ch.sendToQueue(QUEUE_NAME, message, {
      persistent: true, // Survive broker restart
      priority: job.priority,
      messageId: job.id,
      timestamp: Date.now(),
      headers: {
        userId: job.userId,
        type: job.type,
      },
    });

    if (success) {
      console.log(
        `[Queue] Published job ${job.id} with priority ${job.priority}`
      );
    }

    return success;
  } catch (error) {
    console.error("[Queue] Failed to publish job:", error);
    return false;
  }
}

/**
 * Get queue status
 */
export async function getQueueStatus(): Promise<{
  pending: number;
  consumers: number;
}> {
  try {
    const ch = await getChannel();
    const queueInfo = await ch.checkQueue(QUEUE_NAME);

    return {
      pending: queueInfo.messageCount,
      consumers: queueInfo.consumerCount,
    };
  } catch (error) {
    console.error("[Queue] Failed to get status:", error);
    return { pending: 0, consumers: 0 };
  }
}

/**
 * Close connection (for cleanup)
 */
export async function closeConnection(): Promise<void> {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    channel = null;
    connection = null;
    console.log("[RabbitMQ] Publisher disconnected");
  } catch (error) {
    console.error("[RabbitMQ] Error closing connection:", error);
  }
}
