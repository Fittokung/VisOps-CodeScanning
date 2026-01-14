import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: pipelineId } = await params;

    // Find scan record
    const scan = await prisma.scanHistory.findFirst({
      where: { pipelineId },
      include: {
        service: {
          include: {
            group: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    // Check ownership
    if (scan.service.group.user.email !== session.user.email) {
      return NextResponse.json(
        { error: "Forbidden: Not your project" },
        { status: 403 }
      );
    }

    // Check if cancellable
    const cancellableStatuses = ["QUEUED", "PENDING", "RUNNING", "PROCESSING"];
    if (!cancellableStatuses.includes(scan.status)) {
      return NextResponse.json(
        {
          error: "Cannot cancel",
          message: `Scan is in ${scan.status} state and cannot be cancelled`,
        },
        { status: 400 }
      );
    }

    // Cancel pipeline in GitLab
    const gitlabProjectId = scan.scanId; // GitLab project ID
    const gitlabPipelineId = pipelineId;

    const gitlabToken = process.env.GITLAB_TOKEN || process.env.GITLAB_PAT;
    const gitlabUrl = (
      process.env.GITLAB_URL ||
      process.env.GITLAB_API_URL ||
      "https://gitlab.com"
    ).replace(/\/$/, "");

    console.log(
      `🔴 Attempting to cancel GitLab pipeline ${gitlabPipelineId} in project ${gitlabProjectId}`
    );

    if (gitlabToken && gitlabProjectId) {
      try {
        const cancelUrl = `${gitlabUrl}/api/v4/projects/${gitlabProjectId}/pipelines/${gitlabPipelineId}/cancel`;
        console.log(`Cancel URL: ${cancelUrl}`);

        const response = await fetch(cancelUrl, {
          method: "POST",
          headers: {
            "PRIVATE-TOKEN": gitlabToken,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `❌ GitLab cancel failed: ${response.status} - ${errorText}`
          );
          // Don't fail the entire operation if GitLab cancel fails
        } else {
          console.log(
            `✅ GitLab pipeline cancelled successfully: ${gitlabPipelineId}`
          );
        }
      } catch (error) {
        console.error("❌ Error cancelling GitLab pipeline:", error);
        // Don't fail the entire operation
      }
    } else {
      console.warn(
        "⚠️  GitLab credentials missing - cannot cancel pipeline in GitLab"
      );
    }

    // Update database status
    const updatedScan = await prisma.scanHistory.update({
      where: { id: scan.id },
      data: {
        status: "CANCELLED",
        errorMessage: "Cancelled by user",
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Scan cancelled successfully",
      scan: {
        id: updatedScan.id,
        pipelineId: updatedScan.pipelineId,
        status: updatedScan.status,
      },
    });
  } catch (error) {
    console.error("Error cancelling scan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
