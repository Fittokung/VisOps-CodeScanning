// app/api/user/setup/complete/route.ts
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

    // Validate input
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

    // Encrypt tokens before storing
    const encryptedGithubPAT = encrypt(githubPAT);
    const encryptedDockerToken = encrypt(dockerToken);

    const userId = (session.user as any).id;

    // Verify user exists before updating
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found. Please log in again." },
        { status: 404 }
      );
    }

    // Update user with encrypted tokens and mark setup as complete
    // Save to both old fields (for backward compatibility) and settings fields
    await prisma.user.update({
      where: { id: userId },
      data: {
        githubPAT: encryptedGithubPAT,
        githubUsername: githubUsername || validationResult.githubUsername,
        dockerToken: encryptedDockerToken,
        dockerUsername: dockerUsername,
        // Also save to settings fields so they appear in /settings page
        defaultGitUser: githubUsername || validationResult.githubUsername,
        defaultGitToken: encryptedGithubPAT,
        defaultDockerUser: dockerUsername,
        defaultDockerToken: encryptedDockerToken,
        isSetupComplete: true,
      },
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
