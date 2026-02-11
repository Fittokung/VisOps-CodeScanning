import "dotenv/config";
import amqp, { Channel, ConsumeMessage } from "amqplib";
import { prisma } from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { checkScanQuota } from "../lib/quotaManager";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const TEST_QUEUE = "test-queue-logic";

async function main() {
    console.log("🚀 Starting Queue Logic Test...");
    
    // 1. App-Level Quota Test (checkScanQuota)
    console.log("\n[Test 1] Testing App-Level Concurrency Limit (checkScanQuota)...");
    await testAppLevelQuota();

    // 2. RabbitMQ-Level Queue Test (Prefetch)
    console.log("\n[Test 2] Testing RabbitMQ Concurrency (Prefetch)...");
    await testRabbitMqQueue();

    // Cleanup
    await prisma.$disconnect();
    console.log("\n✅ Test Complete.");
    process.exit(0);
}

async function testAppLevelQuota() {
    // Create a dummy service
    const userId = (await prisma.user.findFirst())?.id;
    if(!userId) throw new Error("No user found in DB");

    const group = await prisma.projectGroup.create({
        data: { userId, groupName: "Test Group", repoUrl: "http://test.com", isActive: true }
    });
    const service = await prisma.projectService.create({
        data: { groupId: group.id, serviceName: "Test Service", imageName: "test", contextPath: "." }
    });

    console.log(`   - Created Service: ${service.id}`);

    // Create a fake running scan
    const scan = await prisma.scanHistory.create({
        data: {
            serviceId: service.id,
            scanId: "TEST-RUNNING",
            status: "RUNNING",
            pipelineId: "12345", // Mock ID
            imageTag: "latest"
        }
    });
    console.log(`   - Simulating RUNNING scan: ${scan.id}`);

    // Try to start another
    const check = await checkScanQuota(service.id);
    if(check.canScan) {
        console.error("   ❌ Failed: Quota check allowed concurrent scan!");
    } else {
        console.log(`   ✅ Passed: Quota check blocked new scan. Reason: "${check.error}"`);
    }

    // Cleanup DB
    await prisma.scanHistory.delete({ where: { id: scan.id } });
    await prisma.projectService.delete({ where: { id: service.id } });
    await prisma.projectGroup.delete({ where: { id: group.id } });
}

async function testRabbitMqQueue() {
    const conn = await amqp.connect(RABBITMQ_URL);
    const ch = await conn.createChannel();
    
    await ch.assertQueue(TEST_QUEUE, { durable: false });
    await ch.purgeQueue(TEST_QUEUE); // Clear old msgs

    // Set Prefetch to 2 (Only process 2 at a time)
    await ch.prefetch(2);
    console.log("   - Set Prefetch to 2. Publishing 5 jobs...");

    // Publish 5 jobs
    for(let i=1; i<=5; i++) {
        ch.sendToQueue(TEST_QUEUE, Buffer.from(JSON.stringify({ id: i })), { persistent: false });
        console.log(`     -> Published Job ${i}`);
    }

    // Start Mock Consumer
    console.log("   - Starting Consumer... (Watch the processing order)");
    
    let processedFiles = 0;
    
    ch.consume(TEST_QUEUE, async (msg: ConsumeMessage | null) => {
        if(!msg) return;
        const content = JSON.parse(msg.content.toString());
        console.log(`     [Consumer] Picked up Job ${content.id}. Processing (Time: 1s)...`);
        
        // Simulate checking checking
        await new Promise(r => setTimeout(r, 1000));
        
        console.log(`     [Consumer] Finished Job ${content.id}`);
        ch.ack(msg);
        
        processedFiles++;
        if(processedFiles === 5) {
            console.log("   ✅ All jobs processed.");
            await ch.close();
            await conn.close();
        }
    });

    // Wait for completion
    await new Promise(r => setTimeout(r, 7000));
}

main().catch(console.error);
