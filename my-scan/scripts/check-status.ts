
import { PrismaClient } from "@prisma/client";
import amqp from "amqplib";

const prisma = new PrismaClient();
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";

async function checkSystem() {
  console.log("🔍 Checking System Status...");
  
  // 1. Check DB Connection & Job Counts
  try {
    const running = await prisma.scanHistory.count({ where: { status: "RUNNING" } });
    const queued = await prisma.scanHistory.count({ where: { status: "QUEUED" } });
    const failed = await prisma.scanHistory.count({ where: { status: "FAILED" } });
    const success = await prisma.scanHistory.count({ where: { status: "SUCCESS" } });
    
    console.log(`\n📊 Database Job Stats:`);
    console.log(`   - RUNNING: ${running}`);
    console.log(`   - QUEUED:  ${queued}`);
    console.log(`   - SUCCESS: ${success}`);
    console.log(`   - FAILED:  ${failed}`);
    
  } catch (e) {
    console.error("❌ Database Check Failed:", e);
  }

  // 2. Check RabbitMQ
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    const ch = await conn.createChannel();
    
    const buildQ = await ch.assertQueue("build-job-queue", { durable: true });
    const scanQ = await ch.assertQueue("scan-job-queue", { durable: true });
    
    console.log(`\nMZ️ RabbitMQ Queues:`);
    console.log(`   - Build Queue: ${buildQ.messageCount} waiting, ${buildQ.consumerCount} consumers`);
    console.log(`   - Scan Queue:  ${scanQ.messageCount} waiting, ${scanQ.consumerCount} consumers`);
    
    await conn.close();
  } catch (e) {
    console.error("❌ RabbitMQ Check Failed:", e);
  }
}

checkSystem();
