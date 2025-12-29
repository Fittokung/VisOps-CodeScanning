// /app/api/scan/compare/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");

  if (!serviceId) {
    return NextResponse.json({ error: "Missing serviceId" }, { status: 400 });
  }

  try {
    // ดึงประวัติ 2 ครั้งล่าสุดของ Service นี้
    const history = await prisma.scanHistory.findMany({
      where: { serviceId: serviceId, status: { in: ['SUCCESS', 'BLOCKED'] } }, // เอาเฉพาะที่ Scan เสร็จแล้ว
      orderBy: { createdAt: 'desc' },
      take: 2,
      select: {
        id: true,
        createdAt: true,
        vulnCritical: true,
        status: true,
        details: true // ในนี้จะมี findings ที่เรา save ไว้จาก route status
      }
    });

    if (history.length < 2) {
      return NextResponse.json({ message: "Not enough history to compare" });
    }

    const current = history[0];
    const previous = history[1];

    // Helper ดึง Findings จาก JSON
    const getFindings = (details: any) => (details as any)?.findings || [];

    const currentFindings = getFindings(current.details);
    const prevFindings = getFindings(previous.details);

    // หาอันใหม่ (New Issues)
    const newIssues = currentFindings.filter((c: any) => 
      !prevFindings.some((p: any) => p.id === c.id && p.pkgName === c.pkgName)
    );

    // หาอันที่แก้แล้ว (Fixed Issues)
    const fixedIssues = prevFindings.filter((p: any) => 
      !currentFindings.some((c: any) => c.id === p.id && c.pkgName === c.pkgName)
    );

    return NextResponse.json({
      currentScan: { id: current.id, date: current.createdAt, critical: current.vulnCritical },
      previousScan: { id: previous.id, date: previous.createdAt, critical: previous.vulnCritical },
      diff: {
        newIssuesCount: newIssues.length,
        fixedIssuesCount: fixedIssues.length,
        newIssues,   // รายการช่องโหว่ใหม่
        fixedIssues  // รายการช่องโหว่ที่หายไป
      }
    });

  } catch (error) {
    console.error("Compare Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}