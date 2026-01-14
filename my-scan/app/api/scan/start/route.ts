// app/api/scan/start/route.ts
/**
 * Consolidated Scan Start API
 * - Triggers GitLab CI/CD pipeline
 * - Supports authenticated users with encrypted tokens
 * - Quota enforcement (6 active projects max)
 * - Prevents concurrent scans for same project
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { checkUserQuota } from "@/lib/quotaManager";
import {
  MAX_SCANS_PER_SERVICE,
  AUTO_CLEANUP_ENABLED,
  MAX_SCAN_AGE_DAYS,
} from "@/lib/scanConfig";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    const {
      serviceId,
      scanMode = "SCAN_AND_BUILD", // Default mode
      imageTag = "latest",
      trivyScanMode = "fast", // Trivy scan mode: "fast" or "full"
      // For manual/test scans (optional)
      repoUrl: manualRepoUrl,
      contextPath: manualContextPath,
      imageName: manualImageName,
      projectName: manualProjectName,
    } = body;

    // Validate scan mode
    if (!["SCAN_ONLY", "SCAN_AND_BUILD"].includes(scanMode)) {
      return NextResponse.json(
        { error: "Invalid scan mode. Must be SCAN_ONLY or SCAN_AND_BUILD" },
        { status: 400 }
      );
    }

    // Get user with encrypted tokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        githubPAT: true,
        githubUsername: true,
        dockerToken: true,
        dockerUsername: true,
        isDockerOrganization: true,
        dockerOrgName: true,
        isSetupComplete: true,
      },
    });

    if (!user || !user.isSetupComplete) {
      return NextResponse.json(
        { error: "Please complete setup first at /setup" },
        { status: 400 }
      );
    }

    if (!user.githubPAT || !user.dockerToken) {
      return NextResponse.json(
        { error: "Missing GitHub or Docker credentials" },
        { status: 400 }
      );
    }

    let finalConfig: any = {};
    let projectId: string | undefined;
    let projectGroupId: string | undefined;

    // Case 1: Scanning existing service (from database)
    if (serviceId) {
      const service = await prisma.projectService.findUnique({
        where: { id: serviceId },
        include: {
          group: {
            include: { user: true },
          },
        },
      });

      if (!service) {
        return NextResponse.json(
          { error: "Service not found" },
          { status: 404 }
        );
      }

      // Verify ownership
      if (service.group.userId !== userId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Check for active scans on this service (prevent concurrent scans)
      const activeScan = await prisma.scanHistory.findFirst({
        where: {
          serviceId: serviceId,
          status: { in: ["QUEUED", "RUNNING"] },
        },
      });

      if (activeScan) {
        return NextResponse.json(
          {
            error: "A scan is already in progress for this service",
            activeScanId: activeScan.id,
          },
          { status: 429 }
        );
      }

      projectId = service.id;
      projectGroupId = service.groupId;

      finalConfig = {
        repoUrl: service.group.repoUrl,
        contextPath: service.contextPath || ".",
        imageName: service.imageName,
        projectName: service.group.groupName,
        customDockerfile: service.dockerfileContent, // Admin override if exists
      };
    }
    // Case 2: Manual scan (no serviceId)
    else {
      // Validate required fields for manual scan
      if (!manualRepoUrl || !manualImageName) {
        return NextResponse.json(
          { error: "repoUrl and imageName are required for manual scans" },
          { status: 400 }
        );
      }

      // Check quota for new projects
      const quotaCheck = await checkUserQuota(userId);
      if (!quotaCheck.canCreate) {
        return NextResponse.json(
          {
            error: "Project quota exceeded",
            message: quotaCheck.error,
            currentCount: quotaCheck.currentCount,
            maxCount: quotaCheck.maxAllowed,
          },
          { status: 429 }
        );
      }

      finalConfig = {
        repoUrl: manualRepoUrl,
        contextPath: manualContextPath || ".",
        imageName: manualImageName,
        projectName: manualProjectName || "manual-scan",
      };

      // Auto-create project group and service for manual scans
      // This tracks them in the database for history
      const newGroup = await prisma.projectGroup.create({
        data: {
          userId,
          groupName: finalConfig.projectName,
          repoUrl: finalConfig.repoUrl,
          isActive: true,
        },
      });

      const newService = await prisma.projectService.create({
        data: {
          groupId: newGroup.id,
          serviceName: finalConfig.imageName,
          imageName: finalConfig.imageName,
          contextPath: finalConfig.contextPath,
        },
      });

      projectId = newService.id;
      projectGroupId = newGroup.id;
    }

    // Decrypt user tokens
    const githubToken = decrypt(user.githubPAT);
    const dockerToken = decrypt(user.dockerToken);

    // Prepare GitLab pipeline variables
    const variables = [
      { key: "USER_REPO_URL", value: finalConfig.repoUrl },
      { key: "BUILD_CONTEXT", value: finalConfig.contextPath },
      { key: "USER_TAG", value: imageTag },
      { key: "PROJECT_NAME", value: finalConfig.imageName },

      // User credentials (decrypted)
      { key: "GIT_USERNAME", value: user.githubUsername || "" },
      { key: "GIT_TOKEN", value: githubToken },
      // Docker credentials - use Organization name if configured
      {
        key: "DOCKER_USER",
        value:
          user.isDockerOrganization && user.dockerOrgName
            ? user.dockerOrgName
            : user.dockerUsername || "",
      },
      { key: "DOCKER_PASSWORD", value: dockerToken },

      // Backend webhook URL
      {
        key: "BACKEND_HOST_URL",
        value: process.env.NEXT_PUBLIC_BASE_URL || "",
      },

      // Scan mode
      { key: "SCAN_MODE", value: scanMode },

      // Trivy scan mode (for GitLab CI variable)
      { key: "TRIVY_SCAN_MODE", value: trivyScanMode },

      // Custom Dockerfile if provided by admin
      { key: "CUSTOM_DOCKERFILE", value: finalConfig.customDockerfile || "" },
    ];

    // Validate GitLab configuration
    if (
      !process.env.GITLAB_PROJECT_ID ||
      !process.env.GITLAB_TOKEN ||
      !process.env.GITLAB_API_URL
    ) {
      throw new Error(
        "GitLab configuration incomplete. Check environment variables."
      );
    }

    // Trigger GitLab pipeline
    const gitlabRes = await fetch(
      `${process.env.GITLAB_API_URL}/api/v4/projects/${process.env.GITLAB_PROJECT_ID}/pipeline`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "PRIVATE-TOKEN": process.env.GITLAB_TOKEN,
        },
        body: JSON.stringify({
          ref: "main",
          variables: variables,
        }),
      }
    );

    const pipelineData = await gitlabRes.json();

    if (!gitlabRes.ok) {
      console.error("GitLab Pipeline Trigger Failed:", pipelineData);

      if (gitlabRes.status === 401 || gitlabRes.status === 403) {
        return NextResponse.json(
          { error: "GitLab authentication failed. Contact administrator." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to start scan",
          details: pipelineData.message || "Unknown error",
        },
        { status: 400 }
      );
    }

    // Create scan history record
    // Note: projectId is now guaranteed to exist (either from existing service or newly created)
    const scanHistory = await prisma.scanHistory.create({
      data: {
        serviceId: projectId!, // Non-null assertion safe here
        scanMode: scanMode,
        scanId: process.env.GITLAB_PROJECT_ID!, // ใช้ GitLab Project ID จริงแทน
        pipelineId: pipelineData.id.toString(),
        imageTag: imageTag,
        status: "QUEUED",
        startedAt: new Date(),
        details: {
          repoUrl: finalConfig.repoUrl,
          contextPath: finalConfig.contextPath,
          imageName: finalConfig.imageName,
          projectName: finalConfig.projectName,
        },
      },
    });

    // 🗑️ Auto-cleanup: Keep only last N scans per service
    if (AUTO_CLEANUP_ENABLED) {
      const allScans = await prisma.scanHistory.findMany({
        where: { serviceId: projectId! },
        orderBy: { startedAt: "desc" },
        select: { id: true, startedAt: true },
      });

      // Count-based cleanup: Keep only last N scans
      if (allScans.length > MAX_SCANS_PER_SERVICE) {
        const scansToDelete = allScans.slice(MAX_SCANS_PER_SERVICE);
        const deleteIds = scansToDelete.map((s) => s.id);

        await prisma.scanHistory.deleteMany({
          where: { id: { in: deleteIds } },
        });

        console.log(
          `[Scan Cleanup - Count] Deleted ${deleteIds.length} old scans for service ${projectId}. Keeping last ${MAX_SCANS_PER_SERVICE} scans.`
        );
      }

      // Age-based cleanup: Delete scans older than MAX_SCAN_AGE_DAYS
      if (MAX_SCAN_AGE_DAYS > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - MAX_SCAN_AGE_DAYS);

        const oldScans = await prisma.scanHistory.findMany({
          where: {
            serviceId: projectId!,
            startedAt: { lt: cutoffDate },
          },
          select: { id: true },
        });

        if (oldScans.length > 0) {
          const oldScanIds = oldScans.map((s) => s.id);

          await prisma.scanHistory.deleteMany({
            where: { id: { in: oldScanIds } },
          });

          console.log(
            `[Scan Cleanup - Age] Deleted ${oldScans.length} scans older than ${MAX_SCAN_AGE_DAYS} days for service ${projectId}.`
          );
        }
      }
    }

    console.log(
      `[Scan] Pipeline ${pipelineData.id} started for user ${userId}`
    );

    return NextResponse.json({
      success: true,
      scanId: scanHistory.id,
      pipelineId: pipelineData.id,
      webUrl: pipelineData.web_url,
      status: "QUEUED",
      message: "Scan started successfully. Pipeline is processing...",
    });
  } catch (error: any) {
    console.error("[Scan Start Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
