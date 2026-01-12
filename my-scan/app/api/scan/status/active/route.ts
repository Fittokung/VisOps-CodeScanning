// app/api/scan/status/active/route.ts
/**
 * Get active scans for real-time polling
 * Extends session timeout if there are active scans
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get all active scans for user's projects
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

    // Response includes flag to extend session if there are active scans
    return NextResponse.json({
      success: true,
      activeScans,
      hasActiveScans: activeScans.length > 0,
      extendSession: activeScans.length > 0, // Signal to frontend to keep session alive
    });
  } catch (error: any) {
    console.error("[Active Scans Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
