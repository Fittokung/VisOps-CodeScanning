
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "admin@local";
  const password = crypto.randomBytes(12).toString("hex"); // 24 chars random string
  const hashedPassword = await bcrypt.hash(password, 12);

  console.log(`
  ---------------------------------------------------
  🔐 Creating Default Admin...
  ---------------------------------------------------
  Email:    ${email}
  Password: ${password}
  ---------------------------------------------------
  ⚠️  SAVE THIS PASSWORD SECURELY! IT WILL NOT BE SHOWN AGAIN.
  ---------------------------------------------------
  `);

  try {
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          role: "ADMIN",
          password: hashedPassword,
          status: "ACTIVE", // Ensure admin is active
        },
        create: {
          email,
          name: "Super Admin",
          role: "ADMIN",
          password: hashedPassword,
          status: "ACTIVE",
          isSetupComplete: true,
        },
      });
      console.log(`✅ Admin user '${user.email}' created/updated successfully.`);
  } catch (err) {
      console.error("❌ Failed to create admin:", err);
      process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
