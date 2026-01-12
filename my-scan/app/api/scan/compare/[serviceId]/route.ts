import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compareScanResults, formatScanSummary } from "@/lib/scan-compare";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { serviceId } = await params;

    // 1. Fetch Service
    const service = await prisma.projectService.findUnique({
      where: { id: serviceId },
      include: { group: true },
    });

    if (!service || service.group.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 2. Fetch Latest 2 Scans
    const scans = await prisma.scanHistory.findMany({
      where: {
        serviceId,
        status: { in: ["SUCCESS", "PASSED", "FAILED_SECURITY", "BLOCKED"] },
      },
      orderBy: { startedAt: "desc" },
      take: 2,
    });

    // กรณีมี Scan ไม่ครบ 2 อัน
    if (scans.length < 2) {
      return NextResponse.json({
        canCompare: false,
        latest: scans[0] ? formatScanSummary(scans[0]) : null,
        message: "Need at least 2 scans to compare",
      });
    }

    const [latest, previous] = scans; // latest = index 0, previous = index 1

    // 3. Logic เปรียบเทียบ (เทียบของเก่า ไปหา ของใหม่)
    const comparisonResult = compareScanResults(previous, latest);

    return NextResponse.json({
      canCompare: true,
      serviceName: service.serviceName,
      contextPath: service.contextPath,
      groupName: service.group.groupName,

      // ส่งค่าแบบเดียวกันกับ POST
      scan1: formatScanSummary(previous), // Baseline
      scan2: formatScanSummary(latest), // Target

      // Spread ค่าออกมาเลย ไม่ต้องซ้อนใน details หรือ comparison
      newFindings: comparisonResult.newFindings,
      resolvedFindings: comparisonResult.resolvedFindings,
      persistentFindings: comparisonResult.persistentFindings,
      summary: comparisonResult.summary,
    });
  } catch (error: any) {
    console.error("[Compare Service Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
