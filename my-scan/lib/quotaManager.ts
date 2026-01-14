// lib/quotaManager.ts
import { prisma } from './prisma';

const MAX_ACTIVE_PROJECTS = 6;

/**
 * Checks if user has reached their project quota
 * Returns true if user can create more projects
 */
export async function checkUserQuota(userId: string): Promise<{
  canCreate: boolean;
  currentCount: number;
  maxAllowed: number;
  error?: string;
}> {
  try {
    // Count active projects for this user
    const activeProjectCount = await prisma.projectGroup.count({
      where: {
        userId: userId,
        isActive: true
      }
    });

    const canCreate = activeProjectCount < MAX_ACTIVE_PROJECTS;

    return {
      canCreate,
      currentCount: activeProjectCount,
      maxAllowed: MAX_ACTIVE_PROJECTS,
      error: canCreate ? undefined : `Quota exceeded: You have ${activeProjectCount}/${MAX_ACTIVE_PROJECTS} active projects. Please delete a project before creating a new one.`
    };
  } catch (error: any) {
    return {
      canCreate: false,
      currentCount: 0,
      maxAllowed: MAX_ACTIVE_PROJECTS,
      error: `Failed to check quota: ${error.message}`
    };
  }
}

/**
 * Checks if user can submit a new scan for a specific project
 * Prevents concurrent scans for the same project
 */
export async function checkScanQuota(serviceId: string): Promise<{
  canScan: boolean;
  error?: string;
}> {
  try {
    // Check if there's already a scan in progress for this service
    const activeScan = await prisma.scanHistory.findFirst({
      where: {
        serviceId: serviceId,
        status: {
          in: ['QUEUED', 'PROCESSING']
        }
      }
    });

    if (activeScan) {
      return {
        canScan: false,
        error: 'A scan is already in progress for this project. Please wait for it to complete.'
      };
    }

    return { canScan: true };
  } catch (error: any) {
    return {
      canScan: false,
      error: `Failed to check scan status: ${error.message}`
    };
  }
}

/**
 * Archives/deactivates a project (soft delete)
 * Frees up quota for user
 */
export async function archiveProject(projectId: string, userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Verify ownership
    const project = await prisma.projectGroup.findFirst({
      where: {
        id: projectId,
        userId: userId
      }
    });

    if (!project) {
      return {
        success: false,
        error: 'Project not found or you do not have permission to delete it'
      };
    }

    // Soft delete
    await prisma.projectGroup.update({
      where: { id: projectId },
      data: { isActive: false }
    });

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to archive project: ${error.message}`
    };
  }
}
