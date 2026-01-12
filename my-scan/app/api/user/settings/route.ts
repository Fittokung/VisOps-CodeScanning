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

    // Build update data - implements UPSERT logic
    // Always update username fields if provided (even empty string to clear)
    // Only update token fields if a new value is provided (not empty)
    const updateData: Record<string, string | boolean | null> = {};

    // Git credentials - upsert logic
    if (gitUser !== undefined) {
      updateData.defaultGitUser = gitUser;
    }
    if (gitToken && gitToken.trim() !== "") {
      // Only update token if new value provided - this overwrites any existing token
      updateData.defaultGitToken = encrypt(gitToken.trim());
    }

    // Docker credentials - upsert logic
    if (dockerUser !== undefined) {
      updateData.defaultDockerUser = dockerUser;
    }
    if (dockerToken && dockerToken.trim() !== "") {
      // Only update token if new value provided - this overwrites any existing token
      updateData.defaultDockerToken = encrypt(dockerToken.trim());
    }

    // Docker Organization settings
    if (isDockerOrganization !== undefined) {
      updateData.isDockerOrganization = isDockerOrganization;
    }
    if (dockerOrgName !== undefined) {
      updateData.dockerOrgName = dockerOrgName || null;
    }

    // Verify user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found. Please log in again." },
        { status: 404 }
      );
    }

    // Perform upsert - update existing or insert new values
    await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
    });

    console.log(
      `[Settings Updated] User ${session.user.email} updated credentials`
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
