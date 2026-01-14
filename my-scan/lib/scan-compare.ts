// lib/scan-compare.ts
import { ScanHistory } from "@prisma/client";

// --- Types ---
export interface Finding {
  type: string;
  file: string;
  line: number;
  ruleId: string;
  severity: string;
  message: string;
}

export interface ComparisonSummary {
  newFindings: Finding[];
  resolvedFindings: Finding[];
  persistentFindings: Finding[];
  summary: {
    newCount: number;
    resolvedCount: number;
    persistentCount: number;
  };
}

// --- Main Comparison Logic ---
export function compareScanResults(scan1: any, scan2: any): ComparisonSummary {
  // 1. Extract & Normalize
  const findings1 = extractAllFindings(scan1);
  const findings2 = extractAllFindings(scan2);

  // 2. Create Maps (Key = Unique ID of finding)
  const createKey = (f: Finding) => `${f.file}:${f.line}:${f.ruleId}`;
  const map1 = new Map(findings1.map((f) => [createKey(f), f]));
  const map2 = new Map(findings2.map((f) => [createKey(f), f]));

  const newFindings: Finding[] = [];
  const resolvedFindings: Finding[] = [];
  const persistentFindings: Finding[] = [];

  // 3. Compare Logic
  // Check Current (Map2) against Previous (Map1)
  map2.forEach((finding, key) => {
    if (!map1.has(key)) {
      newFindings.push(finding); // New in Scan 2
    } else {
      persistentFindings.push(finding); // Exists in both
    }
  });

  // Check Previous (Map1) against Current (Map2)
  map1.forEach((finding, key) => {
    if (!map2.has(key)) {
      resolvedFindings.push(finding); // Missing in Scan 2 = Fixed
    }
  });

  return {
    newFindings,
    resolvedFindings,
    persistentFindings,
    summary: {
      newCount: newFindings.length,
      resolvedCount: resolvedFindings.length,
      persistentCount: persistentFindings.length,
    },
  };
}

// --- Helpers ---

export function formatScanSummary(scan: ScanHistory) {
  return {
    id: scan.id,
    imageTag: scan.imageTag,
    status: scan.status,
    scannedAt: scan.startedAt,
    vulnerabilities: {
      total: scan.vulnCritical + scan.vulnHigh + scan.vulnMedium + scan.vulnLow,
      critical: scan.vulnCritical,
      high: scan.vulnHigh,
    },
  };
}

function normalizeSeverity(sev: string): string {
  if (!sev) return "LOW";
  const s = sev.toUpperCase();
  if (s === "ERROR" || s === "CRITICAL") return "CRITICAL";
  if (s === "WARNING" || s === "HIGH") return "HIGH";
  if (s === "NOTE" || s === "INFO" || s === "LOW") return "LOW";
  return s; // Default
}

function extractAllFindings(scan: any): Finding[] {
  let findings: Finding[] = [];
  const details = (scan.details as any) || {};

  // 1. SARIF (Trivy Standard)
  if (scan.reportJson && (scan.reportJson as any).runs) {
    (scan.reportJson as any).runs.forEach((run: any) => {
      if (run.results) {
        findings = findings.concat(
          run.results.map((r: any) => ({
            type: "Container/Dependency",
            file:
              r.locations?.[0]?.physicalLocation?.artifactLocation?.uri ||
              "Unknown",
            line: r.locations?.[0]?.physicalLocation?.region?.startLine || 0,
            ruleId: r.ruleId || "UNKNOWN_RULE",
            severity: normalizeSeverity(r.level),
            message: r.message?.text || "No description",
          }))
        );
      }
    });
  }

  // 2. Gitleaks (Secrets)
  if (details.gitleaksReport && Array.isArray(details.gitleaksReport)) {
    findings = findings.concat(
      details.gitleaksReport.map((s: any) => ({
        type: "Secret",
        file: s.File || "Unknown",
        line: s.StartLine || 0,
        ruleId: s.RuleID || "SECRET-LEAK",
        severity: "CRITICAL",
        message: s.Description || `Secret match: ${s.Match}`,
      }))
    );
  }

  // 3. Semgrep (Code Issues)
  if (
    details.semgrepReport?.results &&
    Array.isArray(details.semgrepReport.results)
  ) {
    findings = findings.concat(
      details.semgrepReport.results.map((r: any) => ({
        type: "Code Issue",
        file: r.path || "Unknown",
        line: r.start?.line || 0,
        ruleId: r.check_id || "CODE-ISSUE",
        severity: normalizeSeverity(r.extra?.severity),
        message: r.extra?.message || "Code vulnerability found",
      }))
    );
  }

  // 4. Legacy Fallback
  if (findings.length === 0 && details.findings) {
    findings = details.findings.map((f: any) => ({
      type: "Legacy",
      file: f.file || f.pkgName || "Unknown",
      line: f.line || 0,
      ruleId: f.ruleId || f.vulnerabilityID || "UNKNOWN",
      severity: normalizeSeverity(f.severity),
      message: f.message || f.description || f.title || "",
    }));
  }

  return findings;
}
