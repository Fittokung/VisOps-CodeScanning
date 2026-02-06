// lib/constants.ts
// Centralized application constants for easy configuration

// ============================================
// Scan Configuration
// ============================================
export const ScanModes = {
  SCAN_ONLY: 'SCAN_ONLY',
  SCAN_AND_BUILD: 'SCAN_AND_BUILD',
} as const;

export type ScanMode = typeof ScanModes[keyof typeof ScanModes];

export const ScanStatus = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  FAILED_SECURITY: 'FAILED_SECURITY',
  FAILED_TRIGGER: 'FAILED_TRIGGER',
  CANCELLED: 'CANCELLED',
} as const;

export type ScanStatusType = typeof ScanStatus[keyof typeof ScanStatus];

// ============================================
// User Status
// ============================================
export const UserStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type UserStatusType = typeof UserStatus[keyof typeof UserStatus];

// ============================================
// User Roles
// ============================================
export const UserRoles = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof UserRoles[keyof typeof UserRoles];

// ============================================
// Quota & Limits
// ============================================
export const Limits = {
  MAX_ACTIVE_PROJECTS: 6,
  MAX_SCANS_PER_SERVICE: 10,
  MAX_SCAN_AGE_DAYS: 30,
  MAX_CONCURRENT_SCANS_PER_SERVICE: 1,
  
  // Rate limits
  API_REQUESTS_PER_MINUTE: 60,
  SCAN_REQUESTS_PER_MINUTE: 5,
  
  // Timeouts (in milliseconds)
  TOKEN_VALIDATION_TIMEOUT: 10000,
  WEBHOOK_TIMEOUT: 5000,
  STATUS_POLL_INTERVAL: 5000,
} as const;

// ============================================
// Security Tools
// ============================================
export const SecurityTools = {
  GITLEAKS: 'gitleaks',
  SEMGREP: 'semgrep',
  TRIVY: 'trivy',
} as const;

export type SecurityTool = typeof SecurityTools[keyof typeof SecurityTools];

// ============================================
// Severity Levels
// ============================================
export const Severity = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO',
} as const;

export type SeverityLevel = typeof Severity[keyof typeof Severity];

export const SeverityOrder: Record<SeverityLevel, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

// ============================================
// Credential Providers
// ============================================
export const CredentialProviders = {
  GITHUB: 'GITHUB',
  DOCKER: 'DOCKER',
} as const;

export type CredentialProvider = typeof CredentialProviders[keyof typeof CredentialProviders];

// ============================================
// Ticket Status
// ============================================
export const TicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type TicketStatusType = typeof TicketStatus[keyof typeof TicketStatus];

// ============================================
// Supported Stacks (for auto-detection)
// ============================================
export const SupportedStacks = {
  JAVA_MAVEN: 'java-maven',
  JAVA_GRADLE: 'java-gradle',
  NODE: 'node',
  GO: 'go',
  PYTHON: 'python',
  DOCKER_ONLY: 'docker-only',
  UNKNOWN: 'unknown',
} as const;

export type SupportedStack = typeof SupportedStacks[keyof typeof SupportedStacks];
