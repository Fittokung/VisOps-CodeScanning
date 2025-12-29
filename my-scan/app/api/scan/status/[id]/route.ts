// /app/api/scan/status/[id]/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";
import { prisma } from "@/lib/prisma"; 

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
  if (s === "ERROR") return "critical"; // ปรับ Semgrep Error ให้เป็น Critical
  if (s === "WARNING") return "medium";
  if (s === "INFO") return "low";
  return "medium";
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
    const scanRecord = await prisma.scanHistory.findFirst({
        where: { pipelineId: id }, // ค้นด้วย Pipeline ID
        include: { service: { include: { group: true } } }
    }) as any;

    if (!scanRecord) {
        return NextResponse.json({ error: "Pipeline not found in database" }, { status: 404 });
    }

    const projectId = scanRecord.scanId; // ได้ Project ID แล้ว (เช่น 55)

    // ✅ STEP 2: เรียก GitLab API ด้วย Project ID ที่ถูกต้อง
    // URL: /projects/{projectId}/pipelines/{pipelineId}
    const pipelineRes = await axios.get(
      `${baseUrl}/api/v4/projects/${projectId}/pipelines/${id}`,
      {
        headers: { "PRIVATE-TOKEN": token },
        httpsAgent: agent
      }
    );

    const pipeline = pipelineRes.data;
    const gitlabStatus = pipeline.status;
    
    // คำนวณ Duration
    let durationString = "Pending...";
    if (pipeline.created_at && pipeline.updated_at) {
        const start = new Date(pipeline.created_at).getTime();
        const end = gitlabStatus === 'running' || gitlabStatus === 'pending' ? Date.now() : new Date(pipeline.updated_at).getTime();
        durationString = formatDuration((end - start) / 1000);
    }

    let counts = { critical: 0, high: 0, medium: 0, low: 0 };
    let findings: VulnerabilityFinding[] = [];
    let logs: string[] = [`Pipeline: ${id}`, `Status: ${gitlabStatus.toUpperCase()}`];
    
    // เก็บ Raw Reports สำหรับให้ User Download
    let rawReports: Record<string, any> = {}; 

    // Status ที่จะส่งกลับ Frontend
    let finalStatus = gitlabStatus === "success" ? "done" : gitlabStatus;

    // 3. ถ้าสถานะเป็น Success ให้ไปดึงไฟล์ Artifacts มาเช็ค Critical
    if (gitlabStatus === "success") {
      logs.push("Fetching reports from Trivy, Gitleaks, Semgrep...");
      
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
             if(!report.Results) return;
             report.Results.forEach((res: any) => {
               if(res.Vulnerabilities) {
                 res.Vulnerabilities.forEach((v: any) => {
                   const sev = v.Severity.toLowerCase();
                   findings.push({
                     id: v.VulnerabilityID,
                     pkgName: v.PkgName,
                     installedVersion: v.InstalledVersion,
                     fixedVersion: v.FixedVersion,
                     severity: sev,
                     title: v.Title || v.Description?.slice(0,50),
                     sourceTool: "Trivy"
                   });
                   incrementCount(sev);
                 });
               }
             });
          }
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
                 commit: leak.Commit
               });
               incrementCount("critical");
             });
          }
        },
        {
          name: "Semgrep",
          jobName: "semgrep_scan",
          artifact: "semgrep-report.json",
          parser: (report: any) => {
             rawReports["semgrep"] = report;
             if(!report.results) return;
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
                 sourceTool: "Semgrep"
               });
               incrementCount(normalizedSev);
             });
          }
        }
      ];

      const incrementCount = (sev: string) => {
         if(sev === 'critical') counts.critical++;
         else if(sev === 'high') counts.high++;
         else if(sev === 'medium') counts.medium++;
         else if(sev === 'low') counts.low++;
      };

      // วนลูปดึงข้อมูลจาก Scanner
      await Promise.all(scanners.map(async (scanner) => {
        const job = jobs.find((j: any) => j.name === scanner.jobName);
        if (!job) {
          logs.push(`Job '${scanner.jobName}' not found.`);
          return;
        }

        try {
          const res = await axios.get(
            `${baseUrl}/api/v4/projects/${projectId}/jobs/${job.id}/artifacts/${scanner.artifact}`,
            { headers: { "PRIVATE-TOKEN": token }, httpsAgent: agent, responseType: "json" }
          );
          
          logs.push(`Parsed ${scanner.name} report.`);
          scanner.parser(res.data);
          
        } catch (err) {
          logs.push(`Failed to fetch/parse ${scanner.name}.`);
        }
      }));
      
      logs.push(`Total findings: ${findings.length}`);

      // ============================================
      // 🛑 BLOCKING LOGIC
      // ============================================
      if (counts.critical > 0) {
        finalStatus = "BLOCKED";
        logs.push("🚨 Security Policy: Pipeline BLOCKED due to critical vulnerabilities.");
      }

      // 4. Update Database
      await prisma.scanHistory.update({
        where: { id: scanRecord.id },
        data: {
          status: finalStatus,
          vulnCritical: counts.critical,
          details: {
            findings: findings,
            logs: logs,
            rawReports: rawReports
          }
        }
      });
    }

    // Response กลับไป Frontend
    return NextResponse.json({
      id: pipeline.id.toString(),
      repoUrl: scanRecord.service?.group?.repoUrl || "Unknown Repo",
      status: finalStatus,
      step: finalStatus === "BLOCKED" ? "Security Blocked" : (gitlabStatus === "success" ? "All Scans Completed" : "Scanning..."),
      progress: (gitlabStatus === "success" || finalStatus === "BLOCKED") ? 100 : 50,
      counts,
      findings,
      logs,
      buildStatus: gitlabStatus,
      pipelineUrl: pipeline.web_url,
      scanDuration: durationString,
      rawReports: rawReports
    });

  } catch (error: any) {
    console.error("API Error:", error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
         return NextResponse.json({ error: "Pipeline not found in GitLab" }, { status: 404 });
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}