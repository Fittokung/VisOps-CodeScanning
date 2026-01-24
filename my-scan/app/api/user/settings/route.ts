// /app/api/user/settings/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      defaultGitUser: true,
      defaultGitToken: true,
      defaultDockerUser: true,
      defaultDockerToken: true,
      isDockerOrganization: true,
      dockerOrgName: true,
    },
  });

  return NextResponse.json({
    gitUser: user?.defaultGitUser || "",
    dockerUser: user?.defaultDockerUser || "",
    // Only send flags for security - don't expose actual tokens
    hasGitToken: !!user?.defaultGitToken,
    hasDockerToken: !!user?.defaultDockerToken,
    isDockerOrganization: user?.isDockerOrganization || false,
    dockerOrgName: user?.dockerOrgName || "",
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      gitUser,
      gitToken,
      dockerUser,
      dockerToken,
      isDockerOrganization,
      dockerOrgName,
    } = body;

    // Build update data
    // Only update fields that are explicitly provided
    const updateData: any = {};

    // Git credentials
    if (gitUser !== undefined) {
      updateData.defaultGitUser = gitUser;
    }
    if (gitToken && gitToken.trim() !== "") {
      updateData.defaultGitToken = encrypt(gitToken.trim());
    }

    // Docker credentials
    if (dockerUser !== undefined) {
      updateData.defaultDockerUser = dockerUser;
    }
    if (dockerToken && dockerToken.trim() !== "") {
      updateData.defaultDockerToken = encrypt(dockerToken.trim());
    }

    // Docker Organization settings
    if (isDockerOrganization !== undefined) {
      updateData.isDockerOrganization = isDockerOrganization;
    }
    if (dockerOrgName !== undefined) {
      updateData.dockerOrgName = dockerOrgName || null;
    }

    // *** FIX: Use upsert instead of findUnique + update ***
    // This handles the case where the session exists but the DB record is missing.
    await prisma.user.upsert({
      where: { email: session.user.email },
      // Case 1: User exists -> Update the fields
      update: updateData,
      // Case 2: User does not exist -> Create new user with these settings
      create: {
        email: session.user.email,
        name: session.user.name || session.user.email.split("@")[0], // Fallback name
        ...updateData,
      },
    });

    console.log(
      `[Settings Updated] User ${session.user.email} updated credentials (Upsert)`
    );

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
      updated: Object.keys(updateData),
    });
  } catch (error: any) {
    console.error("[Settings Update Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
