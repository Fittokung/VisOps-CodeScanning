import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { checkUserQuota } from "@/lib/quotaManager";
import { publishScanJob } from "@/lib/queue/publisher";
import { ScanJob } from "@/lib/queue/types";
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
      scanMode = "SCAN_AND_BUILD",
      imageTag = "latest",
      repoUrl: manualRepoUrl,
      contextPath: manualContextPath,
      imageName: manualImageName,
      projectName: manualProjectName,
    } = body;

    // Validate scan mode
    if (!["SCAN_ONLY", "SCAN_AND_BUILD"].includes(scanMode)) {
      return NextResponse.json({ error: "Invalid scan mode" }, { status: 400 });
    }

    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
      },
    });

    const credentials = await prisma.credential.findMany({
      where: {
        userId: userId,
        isDefault: true,
      },
    });

    const gitCred = credentials.find((c) => c.provider === "GITHUB");
    const dockerCred = credentials.find((c) => c.provider === "DOCKER");

    if (!gitCred || !dockerCred) {
      return NextResponse.json(
        {
          error:
            "Missing Default Credentials. Please go to Settings and set default GitHub & Docker accounts.",
        },
        { status: 400 },
      );
    }

    let finalConfig: any = {};
    let projectId: string | undefined;

    // --- Logic การหา Service หรือ Manual Scan ---
    if (serviceId) {
      const service = await prisma.projectService.findUnique({
        where: { id: serviceId },
        include: { group: { include: { user: true } } },
      });

      if (!service)
        return NextResponse.json(
          { error: "Service not found" },
          { status: 404 },
        );
      if (service.group.userId !== userId)
        return NextResponse.json({ error: "Access denied" }, { status: 403 });

      const activeScan = await prisma.scanHistory.findFirst({
        where: { serviceId: serviceId, status: { in: ["QUEUED", "RUNNING"] } },
      });

      if (activeScan) {
        return NextResponse.json(
          { error: "Scan in progress", activeScanId: activeScan.id },
          { status: 429 },
        );
      }

      projectId = service.id;
      finalConfig = {
        repoUrl: service.group.repoUrl,
        contextPath: service.contextPath || ".",
        imageName: service.imageName,
        projectName: service.group.groupName,
        customDockerfile: service.dockerfileContent,
      };
    } else {
      if (!manualRepoUrl || !manualImageName) {
        return NextResponse.json(
          { error: "repoUrl and imageName required" },
          { status: 400 },
        );
      }
      const quotaCheck = await checkUserQuota(userId);
      if (!quotaCheck.canCreate)
        return NextResponse.json({ error: "Quota exceeded" }, { status: 429 });

      finalConfig = {
        repoUrl: manualRepoUrl,
        contextPath: manualContextPath || ".",
        imageName: manualImageName,
        projectName: manualProjectName || "manual-scan",
      };

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
    }

    const githubToken = decrypt(gitCred.token);
    const dockerToken = decrypt(dockerCred.token);

    // Create History
    const scanHistory = await prisma.scanHistory.create({
      data: {
        serviceId: projectId!,
        scanMode: scanMode,
        scanId: `WAITING-${Date.now()}`,
        pipelineId: `WAITING-${Date.now()}`,
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

    // Prepare Job
    const job: ScanJob = {
      id: scanHistory.id,
      type: scanMode === "SCAN_AND_BUILD" ? "SCAN_AND_BUILD" : "SCAN_ONLY",
      priority: 1,
      createdAt: new Date().toISOString(),
      userId,

      username: userProfile?.name || userProfile?.email || "Unknown User",

      serviceId: projectId!,
      scanHistoryId: scanHistory.id,

      repoUrl: finalConfig.repoUrl,
      contextPath: finalConfig.contextPath,
      isPrivate: true,

      imageName: finalConfig.imageName,
      imageTag: imageTag,
      customDockerfile: finalConfig.customDockerfile,

      gitToken: githubToken,
      dockerToken: dockerToken,
      dockerUser: dockerCred.username,
    };

    const published = await publishScanJob(job);

    if (!published) {
      await prisma.scanHistory.update({
        where: { id: scanHistory.id },
        data: {
          status: "FAILED_TRIGGER",
          errorMessage: "Failed to enqueue job",
        },
      });
      throw new Error("Failed to publish job");
    }

    if (AUTO_CLEANUP_ENABLED && projectId) {
      cleanupOldScans(projectId).catch((err) =>
        console.error("Cleanup error:", err),
      );
    }

    return NextResponse.json({
      success: true,
      scanId: scanHistory.id,
      status: "QUEUED",
      message: "Job queued successfully",
    });
  } catch (error: any) {
    console.error("[Scan Start Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

async function cleanupOldScans(serviceId: string) {
  try {
    const allScans = await prisma.scanHistory.findMany({
      where: { serviceId },
      orderBy: { startedAt: "desc" },
      select: { id: true, startedAt: true },
    });
    if (allScans.length > MAX_SCANS_PER_SERVICE) {
      const scansToDelete = allScans.slice(MAX_SCANS_PER_SERVICE);
      await prisma.scanHistory.deleteMany({
        where: { id: { in: scansToDelete.map((s) => s.id) } },
      });
    }
    if (MAX_SCAN_AGE_DAYS > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - MAX_SCAN_AGE_DAYS);
      await prisma.scanHistory.deleteMany({
        where: { serviceId, startedAt: { lt: cutoffDate } },
      });
    }
  } catch (err) {
    console.error("Auto cleanup failed:", err);
  }
}
