// app/api/user/setup/validate/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

    // Validate tokens against external APIs
    const validationResult = await validateAllTokens(
      githubPAT,
      dockerUsername,
      dockerToken
    );

    if (!validationResult.githubValid || !validationResult.dockerValid) {
      return NextResponse.json(
        {
          error: "Token validation failed",
          githubValid: validationResult.githubValid,
          dockerValid: validationResult.dockerValid,
          errors: validationResult.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      githubValid: true,
      dockerValid: true,
      githubUsername: validationResult.githubUsername || githubUsername,
      dockerUsername: dockerUsername,
    });
  } catch (error: any) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { error: error.message || "Validation failed" },
      { status: 500 }
    );
  }
}
