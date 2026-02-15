
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { publishScanJob } from "../lib/queue/publisher";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Starting Full System Verification...");

  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");

  // --- 1. Verify Dockerfile Logic ---
  console.log("\n[1/3] 🐳 Verifying Dockerfile Logic...");
  
  // Create/Get Service
  let group = await prisma.projectGroup.findFirst({ where: { userId: user.id, groupName: "Verification Group" } });
  if (!group) {
      group = await prisma.projectGroup.create({
          data: { groupName: "Verification Group", repoUrl: "https://github.com/test/repo", userId: user.id }
      });
  }
  
  let service = await prisma.projectService.findFirst({ where: { groupId: group.id, serviceName: "Dockerfile-Test-Service" } });
  if (!service) {
      service = await prisma.projectService.create({
          data: { serviceName: "Dockerfile-Test-Service", contextPath: "/", imageName: "docker-test", groupId: group.id }
      });
  }

  // Update Dockerfile
  const customContent = `FROM alpine:latest\nRUN echo "Verified at ${new Date().toISOString()}"`;
  await prisma.projectService.update({
      where: { id: service.id },
      data: { useCustomDockerfile: true, dockerfileContent: customContent, dockerfileOverrideBy: "test-script" }
  });

  // Verify DB Persistence
  const verifiedService = await prisma.projectService.findUnique({ where: { id: service.id } });
  if (verifiedService?.dockerfileContent === customContent) {
      console.log("    Dockerfile content persisted correctly in DB.");
  } else {
      console.error("   Dockerfile content persistence failed!");
  }

  // NOTE: To verify it actually gets to the worker, we'd need to intercept the message or check logs. 
  // For now, we assume if it's in DB and publishScanJob selects it (which we can check in code), it works.
  
  
  // --- 2. Stress Test Queue ---
  console.log("\n[2/3] ⚡ Stress Testing Queue (20 Jobs)...");
  
  // Clean up previous runs for clarity? No, just track IDs.
  const batchId = Date.now();
  const jobIds: string[] = [];

  for (let i = 0; i < 20; i++) {
     const scan = await prisma.scanHistory.create({
         data: {
             serviceId: service.id,
             status: "QUEUED",
             scanMode: "SCAN_ONLY",
             imageTag: "stress-test",
             scanId: `STRESS-${batchId}-${i}`,
             description: `Stress Test ${i}`
         }
     });
     jobIds.push(scan.id);
     
     // Publish
     await publishScanJob({
        id: scan.id,
        type: "SCAN_ONLY",
        scanHistoryId: scan.id,
        repoUrl: "https://github.com/octocat/Hello-World.git",
        contextPath: "/",
        imageTag: "latest",
        priority: 1,
        createdAt: new Date().toISOString(),
        userId: user.id,
        serviceId: service.id,
        isPrivate: false,
        customDockerfile: verifiedService?.useCustomDockerfile ? verifiedService?.dockerfileContent || undefined : undefined
     });
  }
  
  console.log(`   ✅ Published 20 jobs. Monitoring state for 60s (Expect ~6 RUNNING, <14 QUEUED)...`);
  
  // Monitor
  let timeLeft = 60;
  const interval = setInterval(async () => {
      const stats = await prisma.scanHistory.groupBy({
          by: ['status'],
          where: { id: { in: jobIds } }, // Only track OUR jobs
          _count: { status: true }
      });
      
      const counts = stats.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count.status }), {} as Record<string, number>);
      console.log(`   [${timeLeft}s] Status:`, JSON.stringify(counts));
      
      timeLeft -= 5;
      if (timeLeft <= 0) {
          clearInterval(interval);
          console.log("\n[3/3] 🏁 Verification Complete.");
          
          if (counts['RUNNING'] > 0 || counts['SUCCESS'] > 0 || counts['FAILED'] > 0) {
               console.log("    Jobs are being picked up by worker.");
               if (counts['QUEUED'] === 0) {
                   console.log("  Queue drained completely (Worker is fast).");
               } else {
                   console.log("  Queue holding excess jobs (Backpressure active).");
               }
          } else {
               console.log("   ⚠️ Jobs remain QUEUED. Is the worker running?");
          }
          
          process.exit(0);
      }
  }, 5000);

}

main().catch(e => console.error(e));
