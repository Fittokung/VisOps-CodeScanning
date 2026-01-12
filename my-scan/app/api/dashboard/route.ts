// app/api/dashboard/route.ts
/**
 * Dashboard API - Get user's projects and active scans
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

    // Fetch user's projects with services and latest scans
    const projects = await prisma.projectGroup.findMany({
      where: {
        userId: userId,
        isActive: true, // Only active projects
      },
      include: {
        services: {
          include: {
            scans: {
              take: 5, // Latest 5 scans per service
              orderBy: { startedAt: "desc" },
              select: {
                id: true,
                pipelineId: true,
                status: true,
                scanMode: true,
                imageTag: true,
                vulnCritical: true,
                vulnHigh: true,
                vulnMedium: true,
                vulnLow: true,
                startedAt: true,
                completedAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch active scans (QUEUED or RUNNING)
    const activeScans = await prisma.scanHistory.findMany({
      where: {
        service: {
          group: {
            userId: userId,
          },
        },
        status: { in: ["QUEUED", "RUNNING"] },
      },
      include: {
        service: {
          select: {
            serviceName: true,
            imageName: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      projects,
      activeScans,
      quota: {
        used: projects.length,
        max: 6,
      },
    });
  } catch (error: any) {
    console.error("[Dashboard API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
