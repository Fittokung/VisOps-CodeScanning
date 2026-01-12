import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const body = await req.json();
    const { scanId1, scanId2 } = body;

    // Fetch scans
    const scan1 = await prisma.scanHistory.findUnique({
      where: { id: scanId1 },
      include: { service: { include: { group: true } } },
    });
    const scan2 = await prisma.scanHistory.findUnique({
      where: { id: scanId2 },
      include: { service: { include: { group: true } } },
    });

    if (!scan1 || !scan2)
      return NextResponse.json({ error: "Scans not found" }, { status: 404 });

    const findings1 = extractAllFindings(scan1);
    const findings2 = extractAllFindings(scan2);

    const createKey = (f: any) => `${f.file}:${f.line}:${f.ruleId}`;
    const map1 = new Map(findings1.map((f) => [createKey(f), f]));
    const map2 = new Map(findings2.map((f) => [createKey(f), f]));

    const newFindings: any[] = [];
    const resolvedFindings: any[] = [];
    const persistentFindings: any[] = [];

    // หาของใหม่ (มีใน 2 แต่ไม่มีใน 1)
    map2.forEach((f, k) => {
      if (!map1.has(k)) newFindings.push(f);
      else persistentFindings.push(f);
    });

    // หาของที่แก้แล้ว (มีใน 1 แต่หายไปจาก 2)
    map1.forEach((f, k) => {
      if (!map2.has(k)) resolvedFindings.push(f);
    });

    return NextResponse.json({
      success: true,
      scan1: formatScanSummary(scan1),
      scan2: formatScanSummary(scan2),
      newFindings,
      resolvedFindings,
      persistentFindings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- HELPERS ---
function formatScanSummary(scan: any) {
  return {
    id: scan.id,
    imageTag: scan.imageTag,
    status: scan.status,
    startedAt: scan.startedAt,
    vulnCritical: scan.vulnCritical,
    vulnHigh: scan.vulnHigh,
  };
}

function extractAllFindings(scan: any): any[] {
  let findings: any[] = [];
  const details = (scan.details as any) || {};

  // 1. SARIF (Trivy)
  if (scan.reportJson && (scan.reportJson as any).runs) {
    (scan.reportJson as any).runs.forEach((run: any) => {
      if (run.results) {
        findings = findings.concat(
          run.results.map((r: any) => ({
            file:
              r.locations?.[0]?.physicalLocation?.artifactLocation?.uri ||
              "Unknown",
            line: r.locations?.[0]?.physicalLocation?.region?.startLine || 0,
            ruleId: r.ruleId || "UNKNOWN",
            severity: r.level?.toUpperCase() || "LOW",
            message: r.message?.text || "",
          }))
        );
      }
    });
  }
  // 2. Fallback Legacy
  if (findings.length === 0 && details.findings) {
    findings = details.findings.map((f: any) => ({
      file: f.file || f.pkgName,
      line: f.line || 0,
      ruleId: f.ruleId || f.vulnerabilityID,
      severity: f.severity?.toUpperCase() || "LOW",
      message: f.message || f.description || f.title,
    }));
  }
  return findings;
}
