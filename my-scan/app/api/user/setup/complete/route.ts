import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { validateAllTokens } from "@/lib/tokenValidator";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { githubPAT, githubUsername, dockerUsername, dockerToken } =
      await req.json();

    // Validate input presence
    if (!githubPAT || !githubUsername || !dockerUsername || !dockerToken) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Re-validate tokens before saving (security best practice)
    const validationResult = await validateAllTokens(
      githubPAT,
      dockerUsername,
      dockerToken
    );

    if (!validationResult.githubValid || !validationResult.dockerValid) {
      return NextResponse.json(
        {
          error: "Token validation failed during save",
          errors: validationResult.errors,
        },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const finalGitUsername = validationResult.githubUsername || githubUsername;

    // Use Transaction to ensure both credentials and user status are updated atomically
    await prisma.$transaction(async (tx) => {
      // 1. Create Default GitHub Credential
      await tx.credential.create({
        data: {
          userId,
          name: "Default GitHub",
          provider: "GITHUB",
          username: finalGitUsername,
          token: encrypt(githubPAT), // Encrypt before saving
          isDefault: true,
        },
      });

      // 2. Create Default Docker Credential
      await tx.credential.create({
        data: {
          userId,
          name: "Default Docker",
          provider: "DOCKER",
          username: dockerUsername,
          token: encrypt(dockerToken), // Encrypt before saving
          isDefault: true,
        },
      });

      // 3. Mark User as Setup Complete
      await tx.user.update({
        where: { id: userId },
        data: {
          isSetupComplete: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Setup completed successfully",
    });
  } catch (error: any) {
    console.error("Setup completion error:", error);
    return NextResponse.json(
      { error: error.message || "Setup failed" },
      { status: 500 }
    );
  }
}
