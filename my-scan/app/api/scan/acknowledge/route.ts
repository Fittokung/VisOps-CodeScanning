// app/api/scan/acknowledge/route.ts
/**
 * Acknowledge and handle FAILED_SECURITY scans
 * User acknowledges critical vulnerabilities
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scanId, action } = await req.json();

    if (!scanId || !action) {
      return NextResponse.json(
        { error: "scanId and action are required" },
        { status: 400 }
      );
    }

    // Validate action
    if (!['acknowledge', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'acknowledge' or 'delete'" },
        { status: 400 }
      );
    }

    // Get scan and verify ownership - support both id and pipelineId
    const scan = await prisma.scanHistory.findFirst({
      where: {
        OR: [
          { id: scanId },
          { pipelineId: scanId },
        ],
      },
      include: {
        service: {
          include: {
            group: true
          }
        }
      }
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    // Verify ownership
    const userId = (session.user as any).id;
    if (scan.service.group.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if scan is in FAILED_SECURITY status
    if (scan.status !== 'FAILED_SECURITY') {
      return NextResponse.json(
        { error: "Only FAILED_SECURITY scans can be acknowledged" },
        { status: 400 }
      );
    }

    if (action === 'acknowledge') {
      // Mark as acknowledged but keep record
      await prisma.scanHistory.update({
        where: { id: scan.id },
        data: {
          isCriticalAcknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy: userId,
        }
      });

      return NextResponse.json({
        success: true,
        message: "Critical vulnerabilities acknowledged. Record preserved for audit.",
      });
    }

    if (action === 'delete') {
      // Soft delete: Keep record but mark as not latest
      await prisma.scanHistory.update({
        where: { id: scan.id },
        data: {
          isLatest: false,
          isCriticalAcknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy: userId,
        }
      });

      return NextResponse.json({
        success: true,
        message: "Scan archived. The record is preserved but hidden from main view.",
      });
    }

  } catch (error: any) {
    console.error("Acknowledge error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to acknowledge scan" },
      { status: 500 }
    );
  }
}
