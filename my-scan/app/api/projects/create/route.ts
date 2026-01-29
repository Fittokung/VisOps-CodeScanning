import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkDuplicateGlobally } from "@/lib/validators/serviceValidator";

const MAX_SERVICES_PER_USER = 6;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      // Inputs
      groupName,
      repoUrl,
      isPrivate,
      serviceName,
      contextPath,
      imageName,
      isNewGroup,
      groupId,

      // New Inputs: รับ ID จาก Dropdown แทนการรับ Token ตรงๆ
      gitCredentialId,
      dockerCredentialId,
      
      // Force parameter to override duplicate check
      force = false,
    } = body;

    // 1. Auth Check
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userEmail = session.user.email;

    // 2. User Check
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!user.isSetupComplete) {
      return NextResponse.json(
        { error: "Please complete account setup first." },
        { status: 400 }
      );
    }

    // 3. Resolve GitHub Credential
    let finalGitUser: string;
    let finalGitToken: string;

    if (gitCredentialId) {
      // กรณี User เลือกจาก Dropdown
      const cred = await prisma.credential.findFirst({
        where: {
          id: gitCredentialId,
          userId: user.id,
          provider: "GITHUB",
        },
      });

      if (!cred) {
        return NextResponse.json(
          { error: "Invalid GitHub Account selected" },
          { status: 400 }
        );
      }
      finalGitUser = cred.username;
      finalGitToken = cred.token; // Token นี้ถูก Encrypt อยู่แล้วใน DB นำไปใช้ต่อได้เลย
    } else {
      // กรณีไม่ได้เลือก (Fallback หา Default)
      const defaultCred = await prisma.credential.findFirst({
        where: {
          userId: user.id,
          provider: "GITHUB",
          isDefault: true,
        },
      });

      if (!defaultCred) {
        return NextResponse.json(
          {
            error:
              "No default GitHub account found. Please check your settings.",
          },
          { status: 400 }
        );
      }
      finalGitUser = defaultCred.username;
      finalGitToken = defaultCred.token;
    }

    // 4. Resolve Docker Credential
    let finalDockerUser: string;
    let finalDockerToken: string;

    if (dockerCredentialId) {
      // กรณี User เลือกจาก Dropdown
      const cred = await prisma.credential.findFirst({
        where: {
          id: dockerCredentialId,
          userId: user.id,
          provider: "DOCKER",
        },
      });

      if (!cred) {
        return NextResponse.json(
          { error: "Invalid Docker Account selected" },
          { status: 400 }
        );
      }
      finalDockerUser = cred.username;
      finalDockerToken = cred.token;
    } else {
      // กรณีไม่ได้เลือก (Fallback หา Default)
      const defaultCred = await prisma.credential.findFirst({
        where: {
          userId: user.id,
          provider: "DOCKER",
          isDefault: true,
        },
      });

      if (!defaultCred) {
        return NextResponse.json(
          {
            error:
              "No default Docker account found. Please check your settings.",
          },
          { status: 400 }
        );
      }
      finalDockerUser = defaultCred.username;
      finalDockerToken = defaultCred.token;
    }

    //  5. TRANSACTION START
    const result = await prisma.$transaction(async (tx) => {
      // A. เช็ค Quota (นับเฉพาะ Active Group)
      const currentServicesCount = await tx.projectService.count({
        where: {
          group: {
            userId: user.id,
            isActive: true,
          },
        },
      });

      if (currentServicesCount >= MAX_SERVICES_PER_USER) {
        throw new Error("QUOTA_EXCEEDED");
      }

      let targetGroupId = groupId;

      // B. สร้าง Group (ถ้าเป็น Group ใหม่)
      if (isNewGroup) {
        if (!groupName || !repoUrl) {
          throw new Error("Group Name and Repo URL are required");
        }

        const newGroup = await tx.projectGroup.create({
          data: {
            groupName,
            repoUrl,
            isPrivate: !!isPrivate,
            gitUser: finalGitUser,
            gitToken: finalGitToken, // Save encrypted token
            isActive: true,
            userId: user.id,
          },
        });
        targetGroupId = newGroup.id;
      }

      if (!targetGroupId) {
        throw new Error("Group ID is missing");
      }

      // C. Check for duplicate service (unless force=true)
      if (!force && isNewGroup) {
        const duplicateCheck = await checkDuplicateGlobally(
          repoUrl,
          contextPath || ".",
          imageName,
          user.id
        );

        if (duplicateCheck.isDuplicate && duplicateCheck.existingService) {
          const existing = duplicateCheck.existingService;
          // Throw special error to be caught outside transaction
          const error: any = new Error("DUPLICATE_SERVICE");
          error.existingService = existing;
          throw error;
        }
      }

      // D. สร้าง Service
      if (!serviceName || !imageName) {
        throw new Error("Service Name and Image Name are required");
      }

      const newService = await tx.projectService.create({
        data: {
          groupId: targetGroupId,
          serviceName,
          contextPath: contextPath || ".",
          imageName,
          dockerUser: finalDockerUser,
          dockerToken: finalDockerToken, // Save encrypted token
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

    // Handle duplicate service error
    if (error.message === "DUPLICATE_SERVICE") {
      return NextResponse.json(
        {
          error: "Service already exists",
          isDuplicate: true,
          existingService: error.existingService,
          suggestion:
            "This service configuration already exists. You can re-scan the existing service or create a new one anyway.",
        },
        { status: 409 }
      );
    }

    // จัดการ Error เฉพาะทาง
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
