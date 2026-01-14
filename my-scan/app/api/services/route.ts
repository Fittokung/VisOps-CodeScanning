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

    // Query project groups with services
    const whereClause = isAdmin ? {} : { userId: userId };

    const groups = await prisma.projectGroup.findMany({
      where: { ...whereClause, isActive: true },
      include: {
        services: {
          include: {
            scans: {
              take: 1,
              orderBy: { startedAt: "desc" },
              where: {
                status: {
                  in: ["SUCCESS", "PASSED", "FAILED_SECURITY", "BLOCKED"],
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
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform data to match expected format
    const transformedGroups = groups.map((group) => ({
      id: group.id,
      groupName: group.groupName,
      repoUrl: group.repoUrl,
      services: group.services.map((service) => ({
        id: service.id,
        serviceName: service.serviceName,
        contextPath: service.contextPath,
        lastScan: service.scans[0]
          ? {
              id: service.scans[0].id,
              pipelineId: service.scans[0].pipelineId || "",
              status: service.scans[0].status,
              imageTag: service.scans[0].imageTag,
              createdAt:
                service.scans[0].startedAt?.toISOString() ||
                new Date().toISOString(),
              vulnCritical: service.scans[0].vulnCritical,
            }
          : undefined,
      })),
    }));

    return NextResponse.json(transformedGroups);
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
