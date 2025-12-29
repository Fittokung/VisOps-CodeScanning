import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[Webhook] Payload:", JSON.stringify(body, null, 2));

    const { pipelineId, status, vulnCritical, details } = body;

    if (!pipelineId || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const scanRecord = await prisma.scanHistory.findFirst({
        where: { pipelineId: pipelineId.toString() }
    });

    if (!scanRecord) {
        return NextResponse.json({ error: "Record Not Found" }, { status: 404 });
    }

    // --- LOGIC ใหม่: Merge Findings ---
    const currentDetails: any = scanRecord.details || { findings: [], logs: [] };
    const newFindings = details?.findings || [];
    const newLogs = details?.logs || [];

    // รวมของเก่า + ของใหม่ (กรองอันที่ซ้ำออกถ้าจำเป็น แต่เบื้องต้น concat ไปเลย)
    const mergedFindings = [...(currentDetails.findings || []), ...newFindings];
    const mergedLogs = [...(currentDetails.logs || []), ...newLogs];

    const updateData: any = {
        status: status,
        updatedAt: new Date(),
        details: {
            ...currentDetails,
            findings: mergedFindings, // บันทึกแบบรวม
            logs: mergedLogs
        }
    };

    if (vulnCritical !== undefined) {
        updateData.vulnCritical = Number(vulnCritical);
    }

    await prisma.scanHistory.update({
      where: { id: scanRecord.id },
      data: updateData
    });

    console.log(`[Webhook] Pipeline ${pipelineId} updated. Total Findings: ${mergedFindings.length}`);
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("[Webhook] Error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}