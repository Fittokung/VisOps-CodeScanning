import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        image: true,
        createdAt: true,
        maxProjects: true,
        accounts: {
          select: {
            provider: true,
          },
        },
        groups: {
          where: { isActive: true },
          select: {
            services: {
              select: {
                scans: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Transform data to include stats
    const usersWithStats = users.map((user) => {
      const totalProjects = user.groups.length;
      const totalServices = user.groups.reduce((acc, group) => acc + group.services.length, 0);
      const totalScans = user.groups.reduce((acc, group) => {
        return acc + group.services.reduce((sAcc, service) => sAcc + service.scans.length, 0);
      }, 0);

      // Determine provider (google or credentials)
      // If accounts is empty -> likely credentials (or manually created)
      const provider = user.accounts.length > 0 ? user.accounts[0].provider : "credentials";

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        image: user.image,
        createdAt: user.createdAt,
        maxProjects: user.maxProjects,
        provider,
        stats: {
          projects: totalProjects,
          services: totalServices,
          scans: totalScans,
        },
      };
    });

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error("[API_ADMIN_USERS]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
