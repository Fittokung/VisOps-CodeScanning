export interface ScanJob {
  id: string;
  type: "SCAN_ONLY" | "SCAN_AND_BUILD";
  priority: number; // Lower = higher priority (1-10)
  createdAt: string;
  userId: string;
  username?: string;
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
  customDockerfile?: string;

  // Encrypted Credentials (resolved from user settings)
  gitToken?: string;
  dockerToken?: string;
  dockerUser?: string;
}

export interface JobResult {
  jobId: string;
  scanHistoryId: string;
  status:
    | "SUCCESS"
    | "FAILED_SECURITY"
    | "FAILED_BUILD"
    | "CANCELLED"
    | "FAILED_TRIGGER";

  // Vulnerability Counts
  vulnCritical?: number;
  vulnHigh?: number;
  vulnMedium?: number;
  vulnLow?: number;

  // Optional Details
  reportJson?: object;
  buildLogs?: string;
  errorMessage?: string;
  pipelineId?: string;

  completedAt: string;
}

// Queue Configuration
export const BUILD_QUEUE_NAME = "scan_jobs_build";
export const SCAN_QUEUE_NAME = "scan_jobs_scan";
export const RESULT_QUEUE = "scan_results";
export const DEAD_LETTER_QUEUE = "scan_jobs_dlq";
