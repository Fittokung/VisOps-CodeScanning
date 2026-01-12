// app/api/webhook/route.ts
/**
 * GitLab Pipeline Webhook Handler
 * - Receives status updates from GitLab CI/CD pipeline stages
 * - Merges findings from multiple security tools (GitLeaks, Semgrep, Trivy)
 * - Updates scan status and vulnerability counts
 * - Handles final success/failure determination
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface WebhookPayload {
  pipelineId: string | number;
  status: string;
  stage?: string;
  jobName?: string;
  tool?: string; // "gitleaks" | "semgrep" | "trivy"
  report?: any; // Full report JSON from security tools
  secretsFound?: number; // Gitleaks
  findingsCount?: number; // Semgrep
  vulnCritical?: number;
  vulnHigh?: number;
  vulnMedium?: number;
  vulnLow?: number;
  vulnerabilities?: any[]; // Detailed vulnerability list for BLOCKED status
  details?: {
    findings?: any[];
    logs?: string[];
    errorMessage?: string;
    [key: string]: any;
  };
}

export async function POST(req: Request) {
  try {
    let body: WebhookPayload;
    let reportFromFile: any = null;

    // Check if request is FormData (with file) or JSON
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData with file upload
      const formData = await req.formData();
      body = {
        pipelineId: formData.get("pipelineId") as string,
        status: formData.get("status") as string,
        stage: formData.get("stage") as string | undefined,
        jobName: formData.get("jobName") as string | undefined,
        tool: formData.get("tool") as string | undefined,
        secretsFound: formData.get("secretsFound")
          ? Number(formData.get("secretsFound"))
          : undefined,
        findingsCount: formData.get("findingsCount")
          ? Number(formData.get("findingsCount"))
          : undefined,
        vulnCritical: formData.get("vulnCritical")
          ? Number(formData.get("vulnCritical"))
          : undefined,
        vulnHigh: formData.get("vulnHigh")
          ? Number(formData.get("vulnHigh"))
          : undefined,
        vulnMedium: formData.get("vulnMedium")
          ? Number(formData.get("vulnMedium"))
          : undefined,
        vulnLow: formData.get("vulnLow")
          ? Number(formData.get("vulnLow"))
          : undefined,
      };

      // Parse report file if provided
      const reportFile = formData.get("reportFile") as File | null;
      if (reportFile) {
        const reportText = await reportFile.text();
        try {
          reportFromFile = JSON.parse(reportText);
        } catch (err) {
          console.error("[Webhook] Failed to parse report file:", err);
        }
      }
    } else {
      // Handle regular JSON
      body = (await req.json()) as WebhookPayload;
    }

    console.log(
      `[Webhook] Received: Pipeline ${body.pipelineId}, Status: ${
        body.status
      }, Stage: ${body.stage || "N/A"}, Tool: ${body.tool || "N/A"}`
    );

    const {
      pipelineId,
      status,
      stage,
      jobName,
      tool,
      report,
      secretsFound,
      findingsCount,
      vulnCritical,
      vulnHigh,
      vulnMedium,
      vulnLow,
      vulnerabilities,
      details,
    } = body;

    // Use report from file if available, otherwise use report from body
    const finalReport = reportFromFile || report;

    // Validate required fields
    if (!pipelineId || !status) {
      return NextResponse.json(
        { error: "Missing pipelineId or status" },
        { status: 400 }
      );
    }

    // Find scan record by pipeline ID
    const scanRecord = await prisma.scanHistory.findFirst({
      where: { pipelineId: pipelineId.toString() },
    });

    if (!scanRecord) {
      console.error(
        `[Webhook] Scan record not found for pipeline ${pipelineId}`
      );
      return NextResponse.json(
        { error: "Scan record not found" },
        { status: 404 }
      );
    }

    // Merge findings and logs from multiple pipeline stages
    const currentDetails: any = scanRecord.details || {
      findings: [],
      logs: [],
      stages: {},
      vulnerabilities: [],
      gitleaksReport: null,
      semgrepReport: null,
      trivyReport: null,
    };
    const newFindings = details?.findings || [];
    const newLogs = details?.logs || [];

    // Store security tool reports
    if (tool === "gitleaks" && finalReport) {
      currentDetails.gitleaksReport = finalReport;
      currentDetails.secretsFound = secretsFound || 0;
      console.log(`[Webhook] Gitleaks: ${secretsFound} secrets found`);
    } else if (tool === "semgrep" && finalReport) {
      currentDetails.semgrepReport = finalReport;
      currentDetails.codeIssuesFound = findingsCount || 0;
      console.log(`[Webhook] Semgrep: ${findingsCount} code issues found`);
    } else if (tool === "trivy" && finalReport) {
      currentDetails.trivyReport = finalReport;
    }

    // Store detailed vulnerabilities if provided (from BLOCKED release)
    if (vulnerabilities && Array.isArray(vulnerabilities)) {
      currentDetails.criticalVulnerabilities = vulnerabilities;
      currentDetails.blockedAt = new Date().toISOString();
    }

    // Deduplicate findings based on unique identifier (file + line + rule)
    const existingFindings = currentDetails.findings || [];
    const findingMap = new Map();

    [...existingFindings, ...newFindings].forEach((finding: any) => {
      const key = `${finding.file || ""}:${finding.line || ""}:${
        finding.ruleId || finding.type || ""
      }`;
      if (!findingMap.has(key)) {
        findingMap.set(key, finding);
      }
    });

    const mergedFindings = Array.from(findingMap.values());
    const mergedLogs = [...(currentDetails.logs || []), ...newLogs];

    // Track stage completion
    const stages = currentDetails.stages || {};
    if (stage) {
      stages[stage] = {
        status,
        jobName,
        completedAt: new Date().toISOString(),
      };
    }

    // Calculate vulnerability counts
    let totalCritical = scanRecord.vulnCritical || 0;
    let totalHigh = scanRecord.vulnHigh || 0;
    let totalMedium = scanRecord.vulnMedium || 0;
    let totalLow = scanRecord.vulnLow || 0;

    if (vulnCritical !== undefined) totalCritical += Number(vulnCritical);
    if (vulnHigh !== undefined) totalHigh += Number(vulnHigh);
    if (vulnMedium !== undefined) totalMedium += Number(vulnMedium);
    if (vulnLow !== undefined) totalLow += Number(vulnLow);

    // Determine final status
    let finalStatus = status.toUpperCase();

    // Map GitLab pipeline statuses to our system
    const statusMapping: { [key: string]: string } = {
      PENDING: "QUEUED",
      RUNNING: "RUNNING",
      SUCCESS: "SUCCESS",
      FAILED: "FAILED",
      CANCELED: "FAILED",
      SKIPPED: "RUNNING", // Continue if stage skipped
    };

    finalStatus = statusMapping[finalStatus] || finalStatus;

    // Override with FAILED_SECURITY if critical vulnerabilities found
    if (
      totalCritical > 0 &&
      (finalStatus === "SUCCESS" || finalStatus === "RUNNING")
    ) {
      finalStatus = "FAILED_SECURITY";
    }

    // Handle BLOCKED status from release stage
    if (status.toUpperCase() === "BLOCKED") {
      finalStatus = "FAILED_SECURITY";
    }

    // Handle CANCELLED/CANCELED status from GitLab
    if (
      status.toUpperCase() === "CANCELLED" ||
      status.toUpperCase() === "CANCELED"
    ) {
      finalStatus = "CANCELLED";
    }

    // Prepare update data
    console.log("[Webhook] CurrentDetails before update:", {
      hasGitleaksReport: !!currentDetails.gitleaksReport,
      hasSemgrepReport: !!currentDetails.semgrepReport,
      secretsFound: currentDetails.secretsFound,
      codeIssuesFound: currentDetails.codeIssuesFound,
    });

    const updateData: any = {
      status: finalStatus,
      updatedAt: new Date(),
      vulnCritical: totalCritical,
      vulnHigh: totalHigh,
      vulnMedium: totalMedium,
      vulnLow: totalLow,
      details: {
        ...currentDetails,
        findings: mergedFindings,
        logs: mergedLogs,
        stages,
        errorMessage: details?.errorMessage || currentDetails.errorMessage,
      },
    };

    console.log("[Webhook] UpdateData details:", {
      hasGitleaksReport: !!updateData.details.gitleaksReport,
      hasSemgrepReport: !!updateData.details.semgrepReport,
      secretsFound: updateData.details.secretsFound,
      codeIssuesFound: updateData.details.codeIssuesFound,
    });

    // Set completion time if final status
    if (
      [
        "SUCCESS",
        "FAILED",
        "FAILED_SECURITY",
        "CANCELLED",
        "CANCELED",
      ].includes(finalStatus)
    ) {
      updateData.completedAt = new Date();

      // Auto-delete old scans (keep only 2 most recent per service)
      try {
        const allScans = await prisma.scanHistory.findMany({
          where: { serviceId: scanRecord.serviceId },
          orderBy: { startedAt: "desc" },
          select: { id: true },
        });

        if (allScans.length > 2) {
          const scansToDelete = allScans.slice(2).map((s) => s.id);
          await prisma.scanHistory.deleteMany({
            where: { id: { in: scansToDelete } },
          });
          console.log(
            `[Webhook] Auto-deleted ${scansToDelete.length} old scans for service ${scanRecord.serviceId}`
          );
        }
      } catch (err) {
        console.error("[Webhook] Failed to delete old scans:", err);
      }
    }

    // Update scan history
    await prisma.scanHistory.update({
      where: { id: scanRecord.id },
      data: updateData,
    });

    console.log(
      `[Webhook] Updated scan ${scanRecord.id}: Status=${finalStatus}, Findings=${mergedFindings.length}, Critical=${totalCritical}`
    );

    return NextResponse.json({
      success: true,
      scanId: scanRecord.id,
      status: finalStatus,
      totalFindings: mergedFindings.length,
      criticalVulnerabilities: totalCritical,
    });
  } catch (err: any) {
    console.error("[Webhook] Error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: err.message,
      },
      { status: 500 }
    );
  }
}
