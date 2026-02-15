
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Dockerfile Edit Verification...");

  // 1. Get a Service
  const service = await prisma.projectService.findFirst();
  if (!service) {
      console.log("❌ No service found. Cannot run test.");
      process.exit(1);
  }
  console.log(`🎯 Target Service: ${service.serviceName} (${service.id})`);
  console.log(`   - Current Use Custom: ${service.useCustomDockerfile}`);

  // 2. Simulate User/Admin Update
  const newContent = `# TEST DOCKERFILE CONTENT ${Date.now()}\nFROM node:18-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["npm", "start"]`;
  
  console.log("📝 Updating Dockerfile...");
  const updated = await prisma.projectService.update({
      where: { id: service.id },
      data: {
          useCustomDockerfile: true,
          dockerfileContent: newContent,
          dockerfileOverrideBy: "admin-test-script"
      }
  });

  console.log("✅ Update executed.");

  // 3. Verify Persistence
  const verified = await prisma.projectService.findUnique({
      where: { id: service.id }
  });

  if (verified?.dockerfileContent === newContent && verified?.useCustomDockerfile === true) {
      console.log("✅ VERIFICATION SUCCESS: Dockerfile content mismatch or flag not set.");
      console.log("   - Content matches expected input.");
  } else {
      console.error("❌ VERIFICATION FAILED!");
      console.error("   Expected:", newContent);
      console.error("   Got:", verified?.dockerfileContent);
  }

  process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
