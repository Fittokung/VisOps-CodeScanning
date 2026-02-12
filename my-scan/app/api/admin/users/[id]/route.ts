import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: userId } = await params;

    // 1. Auth Check: Must be ADMIN
    // 1. Auth Check: Must be ADMIN
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Fetch User with Relations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        isSetupComplete: true,
        // Get Provider from accounts if available
        accounts: {
          select: { provider: true },
        },
        // Detailed Projects & Services
        groups: {
          select: {
            id: true,
            groupName: true,
            repoUrl: true,
            createdAt: true,
            isActive: true,
            services: {
              select: {
                id: true,
                serviceName: true,
                imageName: true,
                lastScanAt: true,
                // Recent Scans (Limit 5 per service for overview, or fetch all if needed)
                scans: {
                  orderBy: { createdAt: "desc" },
                  take: 5,
                  select: {
                    id: true,
                    status: true,
                    vulnCritical: true,
                    vulnHigh: true,
                    createdAt: true,
                    pipelineId: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        // Support Tickets? (Optional)
        supportTickets: {
            orderBy: { createdAt: "desc" },
            take: 5
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Transform / Aggregate Data
    // Calculate total stats
    const totalProjects = user.groups.length;
    const totalServices = user.groups.reduce((acc, g) => acc + g.services.length, 0);
    const allScans = user.groups.flatMap(g => g.services.flatMap(s => s.scans));
    const totalScans = allScans.length; // This is just "recent" scans if we limited above. 
    // To get TRUE total, we might need a separate count query or remove 'take'.
    // For performance, let's keep 'take' on the nested relation but maybe run a separate count if needed.
    // Actually, for "User Details", showing all projects is fine, but showing ALL scans might be too much JSON.
    // Let's stick to the structure above for now. Admin can see "Recent Activity".

    const userData = {
      ...user,
      provider: user.accounts[0]?.provider || "credentials",
      stats: {
        projects: totalProjects,
        services: totalServices,
        // scans: totalScans (approx)
      }
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error("[API_ADMIN_USER_DETAILS]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
