// app/api/projects/create/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const MAX_SERVICES_PER_USER = 6;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      email: bodyEmail,
      groupName,
      repoUrl,
      isPrivate,
      gitUser,
      gitToken,
      serviceName,
      contextPath,
      imageName,
      dockerUser,
      dockerToken,
      isNewGroup,
      groupId,
    } = body;

    const userEmail = session?.user?.email || bodyEmail;

    if (!userEmail)
      return NextResponse.json({ error: "Email is required" }, { status: 400 });

    // 1. Fetch User
    const user = await prisma.user.findUnique({ where: { email: userEmail } });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!user.isSetupComplete)
      return NextResponse.json(
        { error: "Please complete account setup first." },
        { status: 400 }
      );

    // 2. Credential Logic
    const finalGitUser = gitUser || user.defaultGitUser;
    const finalDockerUser = dockerUser || user.defaultDockerUser;
    const finalGitToken =
      gitToken && gitToken.trim() !== ""
        ? encrypt(gitToken)
        : user.defaultGitToken;
    const finalDockerToken =
      dockerToken && dockerToken.trim() !== ""
        ? encrypt(dockerToken)
        : user.defaultDockerToken;

    if (!finalGitToken || !finalDockerToken) {
      return NextResponse.json(
        { error: "Missing Credentials." },
        { status: 400 }
      );
    }

    // 🔥 3. TRANSACTION START: ทำทุกอย่างในก้อนเดียว เพื่อป้องกันข้อมูลขยะ 🔥
    const result = await prisma.$transaction(async (tx) => {
      // A. เช็ค Quota ภายใน Transaction (นับเฉพาะ Active Group)
      // การนับตรงนี้จะแม่นยำที่สุด ณ เวลาที่กดปุ่ม
      const currentServicesCount = await tx.projectService.count({
        where: {
          group: {
            userId: user.id,
            isActive: true, // นับเฉพาะที่ Active เท่านั้น
          },
        },
      });

      if (currentServicesCount >= MAX_SERVICES_PER_USER) {
        throw new Error("QUOTA_EXCEEDED"); // ส่ง Error เพื่อให้ Rollback ไม่สร้าง Group ทิ้งไว้
      }

      let targetGroupId = groupId;

      // B. สร้าง Group (ถ้าเป็น Group ใหม่)
      if (isNewGroup) {
        if (!groupName || !repoUrl)
          throw new Error("Group Name and Repo URL are required");

        const newGroup = await tx.projectGroup.create({
          data: {
            groupName,
            repoUrl,
            isPrivate: !!isPrivate,
            gitUser: finalGitUser,
            gitToken: finalGitToken,
            isActive: true,
            userId: user.id,
          },
        });
        targetGroupId = newGroup.id;
      }

      if (!targetGroupId) throw new Error("Group ID is missing");

      // C. สร้าง Service
      // ถ้าบรรทัดนี้ Error -> Group ที่สร้างตะกี้จะหายไปเองอัตโนมัติ (ไม่กิน Quota ฟรี)
      if (!serviceName || !imageName)
        throw new Error("Service Name and Image Name are required");

      const newService = await tx.projectService.create({
        data: {
          groupId: targetGroupId,
          serviceName,
          contextPath: contextPath || ".",
          imageName,
          dockerUser: finalDockerUser,
          dockerToken: finalDockerToken,
        },
      });

      return { serviceId: newService.id };
    });

    console.log(
      `[Project Created] Service ${result.serviceId} created for User ${userEmail}`
    );
    return NextResponse.json({ success: true, serviceId: result.serviceId });
  } catch (error: any) {
    console.error("Create Project Error:", error);

    // ดักจับ Error จาก Transaction
    if (error.message === "QUOTA_EXCEEDED") {
      return NextResponse.json(
        {
          error: "Quota Exceeded",
          message: `You have reached the limit of ${MAX_SERVICES_PER_USER} services.`,
        },
        { status: 429 }
      );
    }

    const status = error.message.includes("required") ? 400 : 500;
    return NextResponse.json(
      { error: error.message || "Server Error" },
      { status }
    );
  }
}
