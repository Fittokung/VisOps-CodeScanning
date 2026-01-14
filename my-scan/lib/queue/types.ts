// lib/queue/types.ts
/**
 * Queue Types for RabbitMQ-based Job Processing
 */

export interface ScanJob {
  id: string;
  type: "SCAN_ONLY" | "SCAN_AND_BUILD";
  priority: number; // Lower = higher priority (1-10)
  createdAt: string;
  userId: string;

  // Scan Configuration
  serviceId: string;
  scanHistoryId: string;

  // Repository Info
  repoUrl: string;
  contextPath: string;
  isPrivate: boolean;

  // Build Info (for SCAN_AND_BUILD)
  imageName?: string;
  imageTag?: string;
  dockerUser?: string;
  customDockerfile?: string;

  // Encrypted Credentials (resolved from user settings)
  gitToken?: string;
  dockerToken?: string;
}

export interface JobResult {
  jobId: string;
  scanHistoryId: string;
  status: "SUCCESS" | "FAILED_SECURITY" | "FAILED_BUILD" | "CANCELLED";

  // Vulnerability Counts
  vulnCritical: number;
  vulnHigh: number;
  vulnMedium: number;
  vulnLow: number;

  // Optional Details
  reportJson?: object;
  buildLogs?: string;
  errorMessage?: string;

  completedAt: string;
}

export interface QueueStatus {
  connected: boolean;
  pendingJobs: number;
  processingJobs: number;
  failedJobs: number;
}

export const QUEUE_NAME = "scan_jobs";
export const RESULT_QUEUE = "scan_results";
export const DEAD_LETTER_QUEUE = "scan_jobs_dlq";
