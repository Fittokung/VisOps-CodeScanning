
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "admin@local";
  const password = crypto.randomBytes(12).toString("hex"); // 24 chars random string
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { email },
        data: {
          role: "ADMIN",
        },
      });
      console.log(`
      ---------------------------------------------------
      ✅ User found: ${email}
      👑 Promoted to ADMIN successfully.
      🔑 Password: [UNCHANGED]
      ---------------------------------------------------
      `);
    } else {
      await prisma.user.create({
        data: {
          email,
          name: "Super Admin",
          role: "admin",
          password: hashedPassword,
          status: "ACTIVE",
          isSetupComplete: true,
        },
      });
      console.log(`
      ---------------------------------------------------
      ✅ Admin user created: ${email}
      🔑 Password: ${password}
      ---------------------------------------------------
      ⚠️  SAVE THIS PASSWORD SECURELY!
      ---------------------------------------------------
      `);
    }
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
