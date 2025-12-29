import { NextResponse } from "next/server";
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

    // ✅ 2. รับค่า Email ของคนที่กดลบ (ส่งมาจาก Frontend)
    const requestorEmail = req.headers.get("x-user-email");

    if (!requestorEmail) {
      return NextResponse.json({ error: "Unauthorized: Missing Email" }, { status: 401 });
    }

    // ✅ 3. ดึงข้อมูล Service มาดูก่อนว่าใครเป็นเจ้าของ
    const service = await prisma.projectService.findUnique({
        where: { id: serviceId },
        include: { group: true }
    });

    if (!service) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const ownerEmail = service.group.userEmail;
    const isAdmin = ADMIN_EMAILS.includes(requestorEmail);
    const isOwner = ownerEmail === requestorEmail;

    // ✅ 4. เช็คสิทธิ์: ต้องเป็น Admin หรือ เจ้าของโปรเจกต์เท่านั้น
    if (!isAdmin && !isOwner) {
        return NextResponse.json({ error: "Forbidden: You can only delete your own services." }, { status: 403 });
    }

    console.log(`[Delete Service] User: ${requestorEmail}, Role: ${isAdmin ? 'ADMIN' : 'OWNER'}, Target: ${serviceId}`);

    // 5. ลบ History
    await prisma.scanHistory.deleteMany({
      where: { serviceId: serviceId }
    });

    // 6. ลบ Service
    const deleted = await prisma.projectService.delete({
      where: { id: serviceId }
    });

    return NextResponse.json({ success: true, deleted });

  } catch (error: any) {
    console.error("Delete Service Error:", error);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}