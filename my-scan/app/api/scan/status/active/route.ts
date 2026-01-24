// app/api/scan/status/active/route.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// บังคับให้เป็น Dynamic route เสมอ (สำคัญสำหรับ API ที่มีการ Polling)
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // ใช้ getToken แทน getServerSession เพื่อเลี่ยง Error headers() ใน Next.js 15
    // getToken จะอ่านค่าจาก Request โดยตรง ไม่ผ่าน Global headers store
    const token = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // ตรวจสอบว่ามี Token และมี ID หรือไม่
    // (อิงตาม auth.ts ของคุณที่ map token.id ไว้)
    if (!token || !token.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.id as string;

    const activeScans = await prisma.scanHistory.findMany({
      where: {
        service: {
          group: {
            userId: userId,
          },
        },
        status: {
          in: ["QUEUED", "RUNNING"],
        },
      },
      select: {
        id: true,
        pipelineId: true,
        status: true,
        startedAt: true,
        service: {
          select: {
            serviceName: true,
            imageName: true,
            group: {
              select: {
                groupName: true,
              },
            },
          },
        },
      },
      orderBy: {
        startedAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      activeScans,
      hasActiveScans: activeScans.length > 0,
      extendSession: activeScans.length > 0,
    });
  } catch (error: any) {
    console.error("[Active Scans Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
