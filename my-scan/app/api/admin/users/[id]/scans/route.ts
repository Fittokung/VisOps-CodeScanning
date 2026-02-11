import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const userId = id;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authorization: Only Admins can view other users' logs
    const currentUserRole = (session.user as any).role;
    if (currentUserRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Fetch scan history for the user
    // Relation: ScanHistory -> Service -> Group -> User
    const logs = await prisma.scanHistory.findMany({
      where: {
        service: {
          group: {
            userId: userId,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit to last 50 logs
      include: {
        service: {
          select: {
            serviceName: true,
            id: true,
          },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching user logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch user logs" },
      { status: 500 }
    );
  }
}
