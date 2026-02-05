export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type Vulnerability = {
  id: string;
  pkgName: string;
  installedVersion: string;
  fixedVersion?: string;
  severity: Severity;
  title?: string;
  description?: string;
  sourceTool: "Trivy" | "Gitleaks" | "Semgrep";
  author?: string;
  email?: string;
  commit?: string;
};

export type Run = {
  id: string;
  pipelineId: string;
  repoUrl: string;
  status: string;
  step: string;
  progress: number;
  scanMode: string;
  counts: { critical: number; high: number; medium: number; low: number };
  findings: Vulnerability[];
  logs?: string[];
  pipelineUrl?: string;
  scanDuration?: string;
  rawReports?: {
    gitleaks?: any;
    semgrep?: any;
    trivy?: any;
  };
  criticalVulnerabilities?: Array<{
    id: string;
    pkgName: string;
    installedVersion: string;
    fixedVersion?: string;
    title: string;
    description?: string;
    severity: string;
  }>;
  serviceId?: string;
  imageTag?: string;
};

export type ComparisonData = {
  canCompare: boolean;
  comparison?: {
    latest: {
      vulnerabilities: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        total: number;
      };
      scannedAt: string;
      imageTag: string;
    };
    previous: {
      vulnerabilities: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        total: number;
      };
      scannedAt: string;
      imageTag: string;
    };
    changes: { critical: number; high: number; medium: number; low: number };
    trend: "improved" | "degraded" | "same";
    details: {
      fixed: number;
      new: number;
      persisting: number;
      fixedList: any[];
      newList: any[];
      persistingList: any[];
    };
  };
};
