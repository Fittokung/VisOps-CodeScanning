import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["admin@example.com", "dev@southth.com"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userEmail = session.user.email || "";
    const isAdmin = ADMIN_EMAILS.includes(userEmail);

    const services = await prisma.projectService.findMany({
      where: {
        group: {
          // ถ้าไม่ใช่ Admin ให้ดูได้แค่ของตัวเอง
          ...(isAdmin ? {} : { userId: userId }),
          isActive: true,
        },
      },
      include: {
        group: {
          select: {
            repoUrl: true,
            groupName: true,
          },
        },
        scans: {
          take: 1,
          orderBy: { startedAt: "desc" },
          where: {
            status: {
              in: [
                "QUEUED",
                "RUNNING",
                "SCANNED",
                "SUCCESS",
                "PASSED",
                "FAILED",
                "FAILED_SECURITY",
                "BLOCKED",
              ],
            },
          },
          select: {
            id: true,
            pipelineId: true,
            status: true,
            imageTag: true,
            vulnCritical: true,
            vulnHigh: true,
            vulnMedium: true,
            vulnLow: true,
            startedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform data
    const transformedServices = services.map((service) => ({
      id: service.id,
      serviceName: service.serviceName,
      imageName: service.imageName,
      repoUrl: service.group.repoUrl, // ดึง repoUrl มาจาก Group
      contextPath: service.contextPath,
      createdAt: service.createdAt,
      _count: {
        scans: 1, // หรือจะ query count จริงๆ ก็ได้ถ้าต้องการความแม่นยำ
      },
      scans: service.scans.map((scan) => ({
        id: scan.id,
        pipelineId: scan.pipelineId || "",
        status: scan.status,
        imageTag: scan.imageTag,
        vulnCritical: scan.vulnCritical || 0,
        vulnHigh: scan.vulnHigh || 0,
        vulnMedium: scan.vulnMedium || 0,
        vulnLow: scan.vulnLow || 0,
        completedAt: scan.startedAt?.toISOString() || new Date().toISOString(),
      })),
    }));

    return NextResponse.json({ services: transformedServices });
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
