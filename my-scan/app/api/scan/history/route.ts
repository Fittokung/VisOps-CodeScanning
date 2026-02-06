/**
 * Scan History API
 * - GET: Fetch history (Used by Dashboard & Compare Page)
 * - DELETE: Clean up failed scans
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
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");
    const projectId = searchParams.get("projectId"); 
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build query
    const where: any = {
      service: {
        group: {
          userId: userId,
        },
      },
    };

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (projectId) {
      where.service.group.id = projectId; // ✅ Filter by Project (Group)
    }

    // Fetch scans
    const scans = await prisma.scanHistory.findMany({
      where,
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
      orderBy: { startedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      history: scans,
      total: scans.length,
    });
  } catch (error: any) {
    console.error("[Scan History Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a failed scan from history
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get("scanId");

    if (!scanId) {
      return NextResponse.json(
        { error: "Scan ID is required" },
        { status: 400 }
      );
    }

    // Find the scan and verify ownership
    const scan = await prisma.scanHistory.findFirst({
      where: {
        id: scanId,
        service: {
          group: {
            userId: userId,
          },
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    // Only allow deleting failed scans
    const deletableStatuses = [
      "FAILED",
      "FAILED_SECURITY",
      "FAILED_BUILD",
      "CANCELLED",
      "ERROR",
    ];

    if (!deletableStatuses.includes(scan.status)) {
      return NextResponse.json(
        { error: "Only failed or cancelled scans can be deleted" },
        { status: 400 }
      );
    }

    // Delete the scan
    await prisma.scanHistory.delete({
      where: { id: scanId },
    });

    return NextResponse.json({
      success: true,
      message: "Scan deleted successfully",
    });
  } catch (error: any) {
    console.error("[Delete Scan Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
