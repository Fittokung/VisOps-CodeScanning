// app/api/admin/dockerfile/override/route.ts
/**
 * Admin Dockerfile Override
 * Allows admin to inject custom Dockerfile for a specific project
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

    const userRole = (session.user as any).role;
    const adminId = (session.user as any).id;

    // Only admins can override Dockerfile
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { serviceId, dockerfileContent, reason } = await req.json();

    if (!serviceId || !dockerfileContent) {
      return NextResponse.json(
        { error: "serviceId and dockerfileContent are required" },
        { status: 400 }
      );
    }

    // Update service with admin override
    const updatedService = await prisma.projectService.update({
      where: { id: serviceId },
      data: {
        dockerfileContent: dockerfileContent,
        useCustomDockerfile: true,
        dockerfileOverrideBy: adminId,
      }
    });

    // Log the override action
    console.log(`Admin ${adminId} overrode Dockerfile for service ${serviceId}. Reason: ${reason || 'N/A'}`);

    return NextResponse.json({
      success: true,
      message: "Dockerfile override applied successfully",
      service: updatedService,
    });

  } catch (error: any) {
    console.error("Dockerfile override error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to override Dockerfile" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;

    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get('serviceId');

    if (!serviceId) {
      return NextResponse.json(
        { error: "serviceId is required" },
        { status: 400 }
      );
    }

    // Remove override
    const updatedService = await prisma.projectService.update({
      where: { id: serviceId },
      data: {
        dockerfileContent: null,
        useCustomDockerfile: false,
        dockerfileOverrideBy: null,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Dockerfile override removed. Will use repository Dockerfile.",
      service: updatedService,
    });

  } catch (error: any) {
    console.error("Dockerfile override removal error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove override" },
      { status: 500 }
    );
  }
}
