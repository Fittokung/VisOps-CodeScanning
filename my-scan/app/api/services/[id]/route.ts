import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ✅ 1. กำหนดรายชื่อ Admin (ในระบบจริงควรเก็บใน DB หรือ ENV)
const ADMIN_EMAILS = ["admin@example.com", "dev@southth.com"];

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const serviceId = resolved.id;

    // ✅ 2. ใช้ session แทน header
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userEmail = session.user.email || "";
    const isAdmin = ADMIN_EMAILS.includes(userEmail);

    // ✅ 3. ดึงข้อมูล Service มาดูก่อนว่าใครเป็นเจ้าของ
    const service = await prisma.projectService.findUnique({
      where: { id: serviceId },
      include: {
        group: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const ownerId = service.group.userId;
    const isOwner = ownerId === userId;

    // ✅ 4. เช็คสิทธิ์: ต้องเป็น Admin หรือ เจ้าของโปรเจกต์เท่านั้น
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own services." },
        { status: 403 }
      );
    }

    console.log(
      `[Delete Service] User: ${userEmail}, Role: ${
        isAdmin ? "ADMIN" : "OWNER"
      }, Target: ${serviceId}`
    );

    // 5. ลบ History
    await prisma.scanHistory.deleteMany({
      where: { serviceId: serviceId },
    });

    // 6. ลบ Service
    const deleted = await prisma.projectService.delete({
      where: { id: serviceId },
    });

    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    console.error("Delete Service Error:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
