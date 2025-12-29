import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["admin@example.com", "dev@southth.com"];

export async function GET(req: Request) {
  try {
    // รับ Email คนที่ขอดูรายการ
    const requestorEmail = req.headers.get("x-user-email");

    if (!requestorEmail) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = ADMIN_EMAILS.includes(requestorEmail);

    const whereClause = isAdmin ? {} : { group: { userEmail: requestorEmail } };

    const services = await prisma.projectService.findMany({
      where: whereClause,
      include: {
        group: true 
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}