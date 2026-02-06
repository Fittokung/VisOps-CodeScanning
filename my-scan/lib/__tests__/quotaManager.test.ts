// lib/__tests__/quotaManager.test.ts
// Unit tests for quota management module

// Store mocks for later access - use jest.fn() directly in mock factory to avoid hoisting
jest.mock('@/lib/prisma', () => {
  return {
    prisma: {
      projectGroup: {
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      scanHistory: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    },
  };
});

jest.mock('@/lib/gitlab', () => ({
  getPipelineStatus: jest.fn(),
}));

// Import after mocks are set up
import { prisma } from '@/lib/prisma';
import { getPipelineStatus } from '@/lib/gitlab';
import { checkUserQuota, checkScanQuota, archiveProject } from '../quotaManager';

// Get references to mocked functions
const mockPrisma = jest.mocked(prisma);
const mockGetPipelineStatus = jest.mocked(getPipelineStatus);

describe('QuotaManager Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkUserQuota', () => {
    it('should return canCreate: true when user has less than 6 projects', async () => {
      (mockPrisma.projectGroup.count as jest.Mock).mockResolvedValue(3);
      
      const result = await checkUserQuota('user-123');
      
      expect(result.canCreate).toBe(true);
      expect(result.currentCount).toBe(3);
      expect(result.maxAllowed).toBe(6);
      expect(result.error).toBeUndefined();
    });

    it('should return canCreate: false when user has 6 projects', async () => {
      (mockPrisma.projectGroup.count as jest.Mock).mockResolvedValue(6);
      
      const result = await checkUserQuota('user-123');
      
      expect(result.canCreate).toBe(false);
      expect(result.currentCount).toBe(6);
      expect(result.error).toContain('Quota exceeded');
    });

    it('should return canCreate: false when user has more than 6 projects', async () => {
      (mockPrisma.projectGroup.count as jest.Mock).mockResolvedValue(10);
      
      const result = await checkUserQuota('user-123');
      
      expect(result.canCreate).toBe(false);
      expect(result.currentCount).toBe(10);
    });

    it('should return canCreate: true when user has 0 projects', async () => {
      (mockPrisma.projectGroup.count as jest.Mock).mockResolvedValue(0);
      
      const result = await checkUserQuota('user-123');
      
      expect(result.canCreate).toBe(true);
      expect(result.currentCount).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      (mockPrisma.projectGroup.count as jest.Mock).mockRejectedValue(new Error('Database connection failed'));
      
      const result = await checkUserQuota('user-123');
      
      expect(result.canCreate).toBe(false);
      expect(result.error).toContain('Failed to check quota');
    });
  });

  describe('checkScanQuota', () => {
    it('should return canScan: true when no active scans exist', async () => {
      (mockPrisma.scanHistory.findFirst as jest.Mock).mockResolvedValue(null);
      
      const result = await checkScanQuota('service-123');
      
      expect(result.canScan).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return canScan: false when a scan is QUEUED', async () => {
      (mockPrisma.scanHistory.findFirst as jest.Mock).mockResolvedValue({
        id: 'scan-1',
        status: 'QUEUED',
        pipelineId: null,
      });
      
      const result = await checkScanQuota('service-123');
      
      expect(result.canScan).toBe(false);
      expect(result.error).toContain('queue');
    });

    it('should return canScan: false when scan is RUNNING on GitLab', async () => {
      (mockPrisma.scanHistory.findFirst as jest.Mock).mockResolvedValue({
        id: 'scan-1',
        status: 'RUNNING',
        pipelineId: 'pipeline-123',
      });
      (mockGetPipelineStatus as jest.Mock).mockResolvedValue({ id: 123, status: 'running' });
      
      const result = await checkScanQuota('service-123');
      
      expect(result.canScan).toBe(false);
      expect(result.error).toContain('GitLab');
    });

    it('should auto-fix ghost jobs (pipeline not found in GitLab)', async () => {
      (mockPrisma.scanHistory.findFirst as jest.Mock).mockResolvedValue({
        id: 'scan-1',
        status: 'RUNNING',
        pipelineId: 'pipeline-123',
      });
      (mockGetPipelineStatus as jest.Mock).mockResolvedValue(null);
      (mockPrisma.scanHistory.update as jest.Mock).mockResolvedValue({});
      
      const result = await checkScanQuota('service-123');
      
      expect(result.canScan).toBe(true);
      expect(mockPrisma.scanHistory.update).toHaveBeenCalledWith({
        where: { id: 'scan-1' },
        data: expect.objectContaining({ status: 'FAILED_TRIGGER' }),
      });
    });

    it('should auto-fix jobs marked RUNNING but actually finished', async () => {
      (mockPrisma.scanHistory.findFirst as jest.Mock).mockResolvedValue({
        id: 'scan-1',
        status: 'RUNNING',
        pipelineId: 'pipeline-123',
      });
      (mockGetPipelineStatus as jest.Mock).mockResolvedValue({ id: 123, status: 'success' });
      (mockPrisma.scanHistory.update as jest.Mock).mockResolvedValue({});
      
      const result = await checkScanQuota('service-123');
      
      expect(result.canScan).toBe(true);
      expect(mockPrisma.scanHistory.update).toHaveBeenCalledWith({
        where: { id: 'scan-1' },
        data: expect.objectContaining({ status: 'SUCCESS' }),
      });
    });

    it('should handle database errors gracefully', async () => {
      (mockPrisma.scanHistory.findFirst as jest.Mock).mockRejectedValue(new Error('DB Error'));
      
      const result = await checkScanQuota('service-123');
      
      expect(result.canScan).toBe(false);
      expect(result.error).toContain('Failed to check scan status');
    });
  });

  describe('archiveProject', () => {
    it('should successfully archive owned project', async () => {
      (mockPrisma.projectGroup.findFirst as jest.Mock).mockResolvedValue({
        id: 'project-1',
        userId: 'user-123',
      });
      (mockPrisma.projectGroup.update as jest.Mock).mockResolvedValue({});
      
      const result = await archiveProject('project-1', 'user-123');
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockPrisma.projectGroup.update).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: { isActive: false },
      });
    });

    it('should fail when project is not found', async () => {
      (mockPrisma.projectGroup.findFirst as jest.Mock).mockResolvedValue(null);
      
      const result = await archiveProject('project-1', 'user-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail when user does not own the project', async () => {
      (mockPrisma.projectGroup.findFirst as jest.Mock).mockResolvedValue(null);
      
      const result = await archiveProject('project-1', 'wrong-user');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('permission');
    });

    it('should handle database errors gracefully', async () => {
      (mockPrisma.projectGroup.findFirst as jest.Mock).mockRejectedValue(new Error('DB Error'));
      
      const result = await archiveProject('project-1', 'user-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to archive');
    });
  });
});
