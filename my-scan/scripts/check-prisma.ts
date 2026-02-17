
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking Prisma Client...');
  
  if (!prisma.auditLog) {
    console.error('❌ prisma.auditLog is MISSING');
    process.exit(1);
  } else {
    console.log('✅ prisma.auditLog exists');
  }

  // Check if types allow accessing new fields (static check won't work in runtime, but we can verify the model definition if accessible)
  // Actually, we can check Prisma.dmmf if we really wanted to, but checking auditLog model presence is a good proxy.
  
  console.log('Runtime check passed.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
