
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const services = await prisma.projectService.findMany({
    select: {
      id: true,
      serviceName: true,
      imageName: true,
      contextPath: true,
      detectedLanguage: true,
      useCustomDockerfile: true,
    }
  });

  console.log("Services found:", services.length);
  console.table(services);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
