import { prisma } from "@/lib/prisma";

// --- Types ---
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingService?: {
    id: string;
    serviceName: string;
    imageName: string;
    contextPath: string;
    groupId: string;
    groupName: string;
    repoUrl: string;
    lastScan?: {
      id: string;
      pipelineId: string | null;
      status: string;
      imageTag: string;
      startedAt: Date | null;
      vulnCritical: number;
      vulnHigh: number;
    };
  };
}

/**
 * Check if a service with the same name/image/path already exists in a specific project
 * Used when adding a new service to an existing project
 */
export async function checkDuplicateInProject(
  projectId: string,
  serviceName: string,
  imageName: string,
  contextPath: string,
): Promise<DuplicateCheckResult> {
  try {
    const existingService = await prisma.projectService.findFirst({
      where: {
        groupId: projectId,
        OR: [
          { serviceName: serviceName },
          {
            AND: [
              { imageName: imageName },
              { contextPath: contextPath },
            ],
          },
        ],
      },
      include: {
        group: {
          select: {
            id: true,
            groupName: true,
            repoUrl: true,
          },
        },
        scans: {
          orderBy: { startedAt: "desc" },
          take: 1,
          select: {
            id: true,
            pipelineId: true,
            status: true,
            imageTag: true,
            startedAt: true,
            vulnCritical: true,
            vulnHigh: true,
          },
        },
      },
    });

    if (!existingService) {
      return { isDuplicate: false };
    }

    return {
      isDuplicate: true,
      existingService: {
        id: existingService.id,
        serviceName: existingService.serviceName,
        imageName: existingService.imageName,
        contextPath: existingService.contextPath,
        groupId: existingService.groupId,
        groupName: existingService.group.groupName,
        repoUrl: existingService.group.repoUrl,
        lastScan: existingService.scans[0] || undefined,
      },
    };
  } catch (error) {
    console.error("[Validator] Error checking duplicate in project:", error);
    return { isDuplicate: false };
  }
}

/**
 * Check if a service with the same repo/path/image already exists globally for this user
 * Used for standalone scans (Scan Only / Scan & Build)
 */
export async function checkDuplicateGlobally(
  repoUrl: string,
  contextPath: string,
  imageName: string,
  userId: string,
): Promise<DuplicateCheckResult> {
  try {
    // Normalize repo URL (remove trailing .git and slashes)
    const normalizedRepoUrl = repoUrl
      .replace(/\.git$/, "")
      .replace(/\/$/, "")
      .toLowerCase();

    const existingService = await prisma.projectService.findFirst({
      where: {
        imageName: imageName,
        contextPath: contextPath,
        group: {
          userId: userId,
          isActive: true,
          repoUrl: {
            contains: normalizedRepoUrl.split("/").pop() || normalizedRepoUrl,
          },
        },
      },
      include: {
        group: {
          select: {
            id: true,
            groupName: true,
            repoUrl: true,
          },
        },
        scans: {
          orderBy: { startedAt: "desc" },
          take: 1,
          select: {
            id: true,
            pipelineId: true,
            status: true,
            imageTag: true,
            startedAt: true,
            vulnCritical: true,
            vulnHigh: true,
          },
        },
      },
    });

    // Double-check repo URL match (case-insensitive)
    if (
      existingService &&
      existingService.group.repoUrl
        .replace(/\.git$/, "")
        .replace(/\/$/, "")
        .toLowerCase() !== normalizedRepoUrl
    ) {
      return { isDuplicate: false };
    }

    if (!existingService) {
      return { isDuplicate: false };
    }

    return {
      isDuplicate: true,
      existingService: {
        id: existingService.id,
        serviceName: existingService.serviceName,
        imageName: existingService.imageName,
        contextPath: existingService.contextPath,
        groupId: existingService.groupId,
        groupName: existingService.group.groupName,
        repoUrl: existingService.group.repoUrl,
        lastScan: existingService.scans[0] || undefined,
      },
    };
  } catch (error) {
    console.error("[Validator] Error checking duplicate globally:", error);
    return { isDuplicate: false };
  }
}
