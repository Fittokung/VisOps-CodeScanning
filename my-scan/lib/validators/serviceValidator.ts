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

    console.log("[Validator] Checking duplicate for:", {
      normalizedRepoUrl,
      contextPath,
      imageName,
      userId,
    });

    // Find all services with matching imageName and contextPath for this user
    const matchingServices = await prisma.projectService.findMany({
      where: {
        imageName: imageName,
        contextPath: contextPath,
        group: {
          userId: userId,
          isActive: true,
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

    console.log("[Validator] Found matching services:", matchingServices.length);

    // Filter by exact repo URL match
    const existingService = matchingServices.find((service) => {
      const serviceRepoUrl = service.group.repoUrl
        .replace(/\.git$/, "")
        .replace(/\/$/, "")
        .toLowerCase();
      console.log("[Validator] Comparing:", serviceRepoUrl, "===", normalizedRepoUrl);
      return serviceRepoUrl === normalizedRepoUrl;
    });

    if (!existingService) {
      console.log("[Validator] No duplicate found");
      return { isDuplicate: false };
    }

    console.log("[Validator] Duplicate found:", existingService.id);

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
