// force-admin.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = "fitto36074@gmail.com"; // แก้เป็น Email ของคุณ
  const user = await prisma.user.update({
    where: { email: email },
    data: {
      role: "admin",
      status: "APPROVED",
    },
  });
  console.log("Success! User is now Admin and Approved:", user);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
