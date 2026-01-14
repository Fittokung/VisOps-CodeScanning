import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      // User Info (Use session if available, fallback to body for testing)
      email: bodyEmail,

      // Group Info
      groupName,
      repoUrl,
      isPrivate,
      gitUser,
      gitToken,

      // Service Info
      serviceName,
      contextPath,
      imageName,
      dockerUser,
      dockerToken,

      // Flags
      isNewGroup,
      groupId
    } = body;

    const userEmail = session?.user?.email || bodyEmail;

    if (!userEmail) {
       return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Fetch User to get Default Credentials
    const user = await prisma.user.findUnique({
        where: { email: userEmail }
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Logic: Priority = Payload > Default
    // Note: user.default... is already encrypted in DB.
    // body... is plain text, needs encryption.

    const finalGitUser = gitUser || user.defaultGitUser;
    const finalDockerUser = dockerUser || user.defaultDockerUser;

    let finalGitToken = null;
    if (gitToken) {
        finalGitToken = encrypt(gitToken);
    } else {
        finalGitToken = user.defaultGitToken;
    }

    let finalDockerToken = null;
    if (dockerToken) {
        finalDockerToken = encrypt(dockerToken);
    } else {
        finalDockerToken = user.defaultDockerToken;
    }

    // 3. Check Quota
    const currentServicesCount = await prisma.projectService.count({
      where: {
        group: {
            user: { email: userEmail }
        }
      }
    });

    if (currentServicesCount >= 6) {
      return NextResponse.json({
        error: "Quota Exceeded",
        message: "You have reached the limit of 6 services. Please delete unused services."
      }, { status: 403 });
    }

    // 4. Prepare Target Group ID
    let targetGroupId = groupId;

    if (isNewGroup) {
      if (!groupName || !repoUrl) {
        return NextResponse.json({ error: "Group Name and Repo URL are required" }, { status: 400 });
      }

      // Create Group linked to User (NextAuth)
      const newGroup = await prisma.projectGroup.create({
        data: {
          groupName,
          repoUrl,
          isPrivate: !!isPrivate,
          gitUser: finalGitUser,
          gitToken: finalGitToken,
          user: {
            connect: { email: userEmail }
          }
        }
      });
      targetGroupId = newGroup.id;
    }

    if (!targetGroupId) {
        return NextResponse.json({ error: "Group ID is missing" }, { status: 400 });
    }

    // 5. Create Service
    if (!serviceName || !imageName) {
        return NextResponse.json({ error: "Service Name and Image Name are required" }, { status: 400 });
    }

    const newService = await prisma.projectService.create({
      data: {
        groupId: targetGroupId,
        serviceName,
        contextPath: contextPath || ".",
        imageName,

        dockerUser: finalDockerUser,
        dockerToken: finalDockerToken,
      }
    });

    return NextResponse.json({ success: true, serviceId: newService.id });

  } catch (error: any) {
    console.error("Create Project Error:", error);
    return NextResponse.json({ error: "Server Error", details: error.message }, { status: 500 });
  }
}