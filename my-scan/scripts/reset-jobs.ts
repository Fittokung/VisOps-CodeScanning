
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning up all Scan Jobs...");

  const deleted = await prisma.scanHistory.deleteMany({
      where: {
          status: { in: ['QUEUED', 'RUNNING', 'WAITING'] }
      }
  });

  console.log(`✅ Deleted ${deleted.count} active jobs.`);
  
  // Optional: Delete all history for cleaner view
  // await prisma.scanHistory.deleteMany({});
}

main().catch(e => console.error(e));
