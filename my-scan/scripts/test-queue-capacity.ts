
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { publishScanJob } from "../lib/queue/publisher"; // Adjust path if needed

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Queue Capacity Test...");

  // 1. Get or Create a Test Service
  const user = await prisma.user.findFirst();
  if (!user) {
      console.error("❌ No user found in DB. Cannot run test.");
      process.exit(1);
  }

  let group = await prisma.projectGroup.findFirst({ where: { userId: user.id } });
  if (!group) {
       console.log("⚠️ No project group found, creating dummy group...");
       group = await prisma.projectGroup.create({
           data: {
               groupName: "Test Group",
               repoUrl: "https://github.com/test/repo",
               userId: user.id
           }
       });
  }

  let service = await prisma.projectService.findFirst({ where: { groupId: group.id } });
  if (!service) {
      console.log("⚠️ No service found, creating dummy service...");
      service = await prisma.projectService.create({
          data: {
              serviceName: "Test Service",
              contextPath: "/",
              imageName: "test-image",
              groupId: group.id
          }
      });
  }

  console.log(`🎯 Using Service: ${service.serviceName} (${service.id})`);

  // 2. Blast jobs (Worker limit is 4 (Build) + 6 (Scan) = 10)
  // We will trigger SCAN_ONLY jobs, which has a limit of 6.
  // Triggering 8 jobs should result in 6 RUNNING and 2 QUEUED.
  const jobsToCreate = 8;
  console.log(`🔥 Queueing ${jobsToCreate} SCAN_ONLY jobs (Limit is 6)...`);

  for (let i = 0; i < jobsToCreate; i++) {
    const scan = await prisma.scanHistory.create({
      data: {
        serviceId: service.id,
        imageTag: "test-queue",
        status: "QUEUED",
        scanMode: "SCAN_ONLY",
        scanId: `TEST-${Date.now()}-${i}`, // [FIX] Added required field
        description: "Queue Load Test"
      }
    });

    await publishScanJob({
      id: scan.id,
      type: "SCAN_ONLY",
      scanHistoryId: scan.id,
      repoUrl: "https://github.com/test/repo.git",
      contextPath: "/",
      imageTag: "test",
      priority: 1,
      createdAt: new Date().toISOString(),
      userId: user.id,
      serviceId: service.id,
      isPrivate: false
    });
    console.log(`   - [${i+1}/${jobsToCreate}] Job Created: ${scan.id.slice(0,8)}...`);
  }

  console.log("✅ All jobs published. Monitoring status for 20 seconds...");

  // 3. Monitor Status
  let timeLeft = 20;
  const interval = setInterval(async () => {
    try {
        const stats = await prisma.scanHistory.groupBy({
        by: ['status'],
        where: {
            status: { in: ['QUEUED', 'RUNNING'] } // Check all active jobs
        },
        _count: { status: true }
        });
        
        // Format output
        const statusStr = stats.map(s => `${s.status}: ${s._count.status}`).join(' | ');
        console.log(`[${timeLeft}s] 📊 Active Jobs: ${statusStr || "None"}`);
    } catch (err) {
        console.error("Error fetching stats:", err);
    }
    
    timeLeft -= 2;
    if (timeLeft <= 0) {
        clearInterval(interval);
        console.log("🛑 Test finished.");
        process.exit(0);
    }
  }, 2000);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
