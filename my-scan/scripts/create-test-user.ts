
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const prisma = new PrismaClient();

async function main() {
  const rl = readline.createInterface({ input, output });

  console.log("🛠️  Create Test User (Development Only) 🛠️");
  console.log("------------------------------------------");

  try {
    const name = await rl.question("Enter Name (default: Test User): ") || "Test User";
    const email = await rl.question("Enter Email (default: user@example.com): ") || "user@example.com";
    const password = await rl.question("Enter Password (default: password123): ") || "password123";
    
    // Validate Role
    let role = await rl.question("Enter Role (user/ADMIN) (default: user): ") || "user";
    if (role.toLowerCase() === "admin") role = "ADMIN";
    if (role !== "user" && role !== "ADMIN") {
      console.log("⚠️  Invalid role. Defaulting to 'user'.");
      role = "user";
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        password: hashedPassword,
        role,
        status: "ACTIVE", // Auto-approve test users
        isSetupComplete: true,
      },
      create: {
        name,
        email,
        password: hashedPassword,
        role,
        status: "ACTIVE",
        isSetupComplete: true,
      },
    });

    console.log("\n✅ User created successfully!");
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password: ${password}`);
    console.log("\n👉 You can now login with these credentials at /login");

  } catch (error) {
    console.error("❌ Error creating user:", error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
