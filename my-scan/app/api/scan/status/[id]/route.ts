// /app/api/scan/status/[id]/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";
import { prisma } from "@/lib/prisma";
import { deleteBlockedImage } from "@/lib/imageCleanup";

// --- Types ---
type VulnerabilityFinding = {
  id: string;
  pkgName: string;
  installedVersion: string;
  fixedVersion?: string;
  severity: string;
  title?: string;
  sourceTool: "Trivy" | "Gitleaks" | "Semgrep";
  author?: string;
  email?: string;
  commit?: string;
};

function mapSemgrepSeverity(sev: string): string {
  const s = sev.toUpperCase();
  if (s === "ERROR") return "high";
  if (s === "WARNING") return "medium";
  if (s === "INFO") return "low";
  return "medium"; // default fallback
}

function formatDuration(seconds: number) {
  if (!seconds) return "N/A";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // รับ Pipeline ID จาก URL (เช่น 180)
  const { id } = await params;

  const baseUrl = process.env.GITLAB_API_URL?.replace(/\/$/, "");
  const token = process.env.GITLAB_TOKEN;
  const agent = new https.Agent({ rejectUnauthorized: false });

  if (!baseUrl || !token) {
    return NextResponse.json({ error: "Missing Config" }, { status: 500 });
  }

  try {
    // ✅ STEP 1: ค้นหาใน Database ก่อน เพื่อเอา Project ID (scanId) ที่ถูกต้อง
    // เพราะเราไม่รู้ว่า Pipeline 180 นี้ เป็นของ Project ไหน
    const scanRecord = (await prisma.scanHistory.findFirst({
      where: {
          OR: [
              { pipelineId: id },
              { id: id }
          ]
      },
      include: { service: { include: { group: true } } },
    })) as any;

    if (!scanRecord) {
      return NextResponse.json(
        { error: "Pipeline/Scan not found in database" },
        { status: 404 }
      );
    }


    const projectId = process.env.GITLAB_PROJECT_ID; // Use configured project ID

    // ✅ STEP 2: ลองเรียก GitLab API ก่อนเสมอ เพื่อเช็คสถานะจริง
    // ถ้า pipeline ยังไม่มีใน GitLab จะ catch error แล้ว return QUEUED status
    console.log(`🔍 Fetching Pipeline ${id} from Project ${projectId}`);

    let pipelineRes;
    try {
      pipelineRes = await axios.get(
        `${baseUrl}/api/v4/projects/${projectId}/pipelines/${id}`,
        {
          headers: { "PRIVATE-TOKEN": token },
          httpsAgent: agent,
        }
      );
    } catch (gitlabError: any) {
      // ถ้า GitLab ยังไม่มี pipeline นี้ (404) → แสดงว่ายังอยู่ใน Queue จริงๆ
      if (gitlabError.response?.status === 404) {
        console.log(
          `⏳ Pipeline ${id} not yet created in GitLab, still in queue`
        );
        return NextResponse.json({
          id: id,
          repoUrl: scanRecord.service?.group?.repoUrl || "Unknown Repo",
          status: "QUEUED",
          step: "Waiting in queue...",
          progress: 0,
          counts: { critical: 0, high: 0, medium: 0, low: 0 },
          findings: [],
          logs: [
            `Scan ${id} is waiting in queue`,
            "Worker will create the pipeline shortly...",
          ],
          buildStatus: "queued",
          pipelineUrl: null,
          scanDuration: "Pending...",
          rawReports: {},
          isQueued: true,
        });
      }
      // ถ้าเป็น error อื่นๆ → throw ต่อไป
      throw gitlabError;
    }

    // ✅ ถ้า GitLab มี pipeline แล้ว → update status ใน database ถ้ายัง QUEUED
    if (scanRecord.status === "QUEUED" || scanRecord.status === "PENDING") {
      await prisma.scanHistory.update({
        where: { id: scanRecord.id },
        data: { status: "RUNNING" },
      });
    }

    const pipeline = pipelineRes.data;
    // ⚠️ IMPORTANT: Normalize status to UPPERCASE for consistent comparison
    const gitlabStatus = pipeline.status.toUpperCase();

    // คำนวณ Duration
    let durationString = "Pending...";
    if (pipeline.created_at && pipeline.updated_at) {
      const start = new Date(pipeline.created_at).getTime();
      const end =
        gitlabStatus === "RUNNING" || gitlabStatus === "PENDING"
          ? Date.now()
          : new Date(pipeline.updated_at).getTime();
      durationString = formatDuration((end - start) / 1000);
    }

    let counts = { critical: 0, high: 0, medium: 0, low: 0 };
    let findings: VulnerabilityFinding[] = [];
    let logs: string[] = [`Pipeline: ${id}`, `Status: ${gitlabStatus}`];

    // เก็บ Raw Reports สำหรับให้ User Download
    let rawReports: Record<string, any> = {};

    // Status ที่จะส่งกลับ Frontend (keep UPPERCASE for consistency)
    let finalStatus = gitlabStatus === "SUCCESS" ? "SUCCESS" : gitlabStatus;

    // 3. ถ้าสถานะเป็น Success หรือ Manual (waiting for approval) ให้ดึงไฟล์ Artifacts
    if (gitlabStatus === "SUCCESS" || gitlabStatus === "MANUAL") {
      logs.push("Fetching reports from Trivy, Gitleaks, Semgrep...");
      console.log(
        `[${id}] GitLab Status: ${gitlabStatus} - Starting artifact fetch...`
      );

      const jobsRes = await axios.get(
        `${baseUrl}/api/v4/projects/${projectId}/pipelines/${id}/jobs`,
        { headers: { "PRIVATE-TOKEN": token }, httpsAgent: agent }
      );

      const jobs = jobsRes.data;

      const scanners = [
        {
          name: "Trivy",
          jobName: "trivy_scan",
          artifact: "trivy-report.json",
          parser: (report: any) => {
            rawReports["trivy"] = report;
            if (!report.Results) return;
            report.Results.forEach((res: any) => {
              if (res.Vulnerabilities) {
                res.Vulnerabilities.forEach((v: any) => {
                  const sev = v.Severity.toLowerCase();
                  findings.push({
                    id: v.VulnerabilityID,
                    pkgName: v.PkgName,
                    installedVersion: v.InstalledVersion,
                    fixedVersion: v.FixedVersion,
                    severity: sev,
                    title: v.Title || v.Description?.slice(0, 50),
                    sourceTool: "Trivy",
                  });
                  incrementCount(sev);
                });
              }
            });
          },
        },
        {
          name: "Gitleaks",
          jobName: "gitleaks_scan",
          artifact: "gitleaks-report.json",
          parser: (report: any) => {
            rawReports["gitleaks"] = report;
            const leaks = Array.isArray(report) ? report : [];
            leaks.forEach((leak: any) => {
              findings.push({
                id: leak.RuleID || "SECRET-LEAK",
                pkgName: leak.File || "Unknown File",
                installedVersion: "N/A",
                fixedVersion: "Revoke Secret",
                severity: "critical",
                title: `Secret exposed in ${leak.File}`,
                sourceTool: "Gitleaks",
                author: leak.Author,
                email: leak.Email,
                commit: leak.Commit,
              });
              incrementCount("critical");
            });
          },
        },
        {
          name: "Semgrep",
          jobName: "semgrep_scan",
          artifact: "semgrep-report.json",
          parser: (report: any) => {
            rawReports["semgrep"] = report;
            if (!report.results) return;
            report.results.forEach((res: any) => {
              const semgrepSev = res.extra?.severity || "WARNING";
              const normalizedSev = mapSemgrepSeverity(semgrepSev);

              findings.push({
                id: res.check_id || "SAST-ISSUE",
                pkgName: res.path || "Source Code",
                installedVersion: `Line ${res.start?.line}`,
                fixedVersion: "Code Fix",
                severity: normalizedSev,
                title: res.extra?.message?.slice(0, 60) || "Code Issue",
                sourceTool: "Semgrep",
              });
              incrementCount(normalizedSev);
            });
          },
        },
      ];

      const incrementCount = (sev: string) => {
        if (sev === "critical") counts.critical++;
        else if (sev === "high") counts.high++;
        else if (sev === "medium") counts.medium++;
        else if (sev === "low") counts.low++;
      };

      // วนลูปดึงข้อมูลจาก Scanner
      await Promise.all(
        scanners.map(async (scanner) => {
          const job = jobs.find((j: any) => j.name === scanner.jobName);
          if (!job) {
            console.log(
              `[${id}] Job '${scanner.jobName}' not found in pipeline`
            );
            logs.push(`Job '${scanner.jobName}' not found.`);
            return;
          }

          console.log(`[${id}] Found job: ${scanner.jobName} (ID: ${job.id})`);

          try {
            const res = await axios.get(
              `${baseUrl}/api/v4/projects/${projectId}/jobs/${job.id}/artifacts/${scanner.artifact}`,
              {
                headers: { "PRIVATE-TOKEN": token },
                httpsAgent: agent,
                responseType: "json",
              }
            );

            console.log(
              `[${id}] ✅ Fetched ${scanner.name} - Found ${
                Array.isArray(res.data) ? res.data.length : "N/A"
              } items`
            );
            logs.push(`Parsed ${scanner.name} report.`);
            scanner.parser(res.data);
          } catch (err) {
            console.error(`[${id}] ❌ Failed to fetch ${scanner.name}:`, err);
            logs.push(`Failed to fetch/parse ${scanner.name}.`);
          }
        })
      );

      console.log(`[${id}] Total findings collected: ${findings.length}`);
      console.log(
        `[${id}] Counts - Critical: ${counts.critical}, High: ${counts.high}, Medium: ${counts.medium}, Low: ${counts.low}`
      );
      logs.push(`Total findings: ${findings.length}`);

      // ============================================
      // 🛑 BLOCKING LOGIC
      // ============================================
      if (counts.critical > 0) {
        finalStatus = "BLOCKED";
        logs.push(
          "🚨 Security Policy: Pipeline BLOCKED due to critical vulnerabilities."
        );

        // 🗑️ Auto-delete blocked image
        try {
          const imageInfo = {
            projectId: projectId || "",
            pipelineId: id,
            imageName: scanRecord.service?.imageName,
            imageTag: "latest", // or extract from scan metadata
          };

          console.log(
            `🗑️  Attempting to delete blocked image for pipeline ${id}`
          );
          const deleteResult = await deleteBlockedImage(imageInfo);

          if (deleteResult.success) {
            logs.push(`🗑️  ${deleteResult.message}`);
          } else {
            logs.push(`⚠️  Failed to delete image: ${deleteResult.message}`);
          }
        } catch (cleanupError: any) {
          console.error(`Error during image cleanup:`, cleanupError);
          logs.push(`⚠️  Image cleanup error: ${cleanupError.message}`);
        }
      }

      // 4. Update Database
      await prisma.scanHistory.update({
        where: { id: scanRecord.id },
        data: {
          status: finalStatus,
          vulnCritical: counts.critical,
          vulnHigh: counts.high,
          vulnMedium: counts.medium,
          vulnLow: counts.low,
          details: {
            findings: findings,
            logs: logs,
            rawReports: rawReports,
          },
        },
      });
    }

    // Response กลับไป Frontend
    return NextResponse.json({
      id: pipeline.id.toString(),
      repoUrl: scanRecord.service?.group?.repoUrl || "Unknown Repo",
      status: finalStatus,
      step:
        finalStatus === "BLOCKED"
          ? "Security Blocked"
          : gitlabStatus === "SUCCESS" || gitlabStatus === "MANUAL"
          ? "All Scans Completed"
          : "Scanning...",
      progress:
        gitlabStatus === "SUCCESS" ||
        gitlabStatus === "MANUAL" ||
        finalStatus === "BLOCKED"
          ? 100
          : 50,
      counts,
      findings,
      logs,
      buildStatus: gitlabStatus,
      pipelineUrl: pipeline.web_url,
      scanDuration: durationString,
      rawReports: rawReports,
      criticalVulnerabilities:
        (scanRecord.details as any)?.criticalVulnerabilities || [],
      serviceId: scanRecord.serviceId,
      imagePushed: scanRecord.imagePushed,
    });
  } catch (error: any) {
    console.error("API Error:", error);

    if (axios.isAxiosError(error) && error.response?.status === 404) {
      // ✅ Pipeline ไม่พบใน GitLab → ส่ง response ที่มีข้อมูลเพิ่มเติม
      return NextResponse.json(
        {
          error: "Pipeline not found in GitLab",
          details:
            "This pipeline may have been deleted from GitLab or the project ID is incorrect.",
          pipelineId: id,
          status: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: "Server Error",
        message: error.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
