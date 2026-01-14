// app/api/projects/[id]/route.ts
/**
 * Project Management API - Delete (soft delete) project
 * Supports force-stop for active scans
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: projectId } = await params;

    // Parse request body for forceStop option
    let forceStop = false;
    try {
      const body = await req.json();
      forceStop = body.forceStop === true;
    } catch {
      // No body or invalid JSON - that's fine, use defaults
    }

    // Find project and verify ownership
    const project = await prisma.projectGroup.findUnique({
      where: { id: projectId },
      include: {
        services: {
          include: {
            scans: {
              where: {
                status: { in: ["QUEUED", "RUNNING"] },
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if there are active scans
    const activeScans = project.services.flatMap((service) => service.scans);
    const hasActiveScans = activeScans.length > 0;

    if (hasActiveScans && !forceStop) {
      return NextResponse.json(
        {
          error:
            "Cannot delete project with active scans. Use forceStop to cancel scans first.",
          hasActiveScans: true,
          activeCount: activeScans.length,
        },
        { status: 400 }
      );
    }

    // If forceStop is true, cancel all active scans first
    if (hasActiveScans && forceStop) {
      await prisma.scanHistory.updateMany({
        where: {
          id: { in: activeScans.map((s) => s.id) },
        },
        data: {
          status: "CANCELLED",
          completedAt: new Date(),
          errorMessage: "Cancelled: Project was deleted",
        },
      });
      console.log(
        `[Force Stop] Cancelled ${activeScans.length} active scans for project ${projectId}`
      );
    }

    // Soft delete (set isActive to false)
    await prisma.projectGroup.update({
      where: { id: projectId },
      data: { isActive: false },
    });

    console.log(
      `[Project Deleted] User ${userId} deleted project ${projectId}`
    );

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
      cancelledScans: hasActiveScans ? activeScans.length : 0,
    });
  } catch (error: any) {
    console.error("[Delete Project Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET single project details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: projectId } = await params;

    const project = await prisma.projectGroup.findUnique({
      where: { id: projectId },
      include: {
        services: {
          include: {
            scans: {
              orderBy: { startedAt: "desc" },
              take: 10,
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("[Get Project Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH update project details
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: projectId } = await params;
    const body = await req.json();

    // Find project and verify ownership
    const project = await prisma.projectGroup.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update project
    const updatedProject = await prisma.projectGroup.update({
      where: { id: projectId },
      data: {
        groupName: body.groupName || project.groupName,
        repoUrl: body.repoUrl || project.repoUrl,
      },
    });

    console.log(
      `[Project Updated] User ${userId} updated project ${projectId}`
    );

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error: any) {
    console.error("[Update Project Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
