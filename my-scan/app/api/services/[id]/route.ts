// app/api/services/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const serviceId = resolved.id;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;

    // 1. ดึงข้อมูล User ปัจจุบันจาก DB เพื่อเช็ค Role ล่าสุด (สำคัญมาก)
    const currentUser = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. ดึงข้อมูล Service ที่ต้องการลบ
    const service = await prisma.projectService.findUnique({
      where: { id: serviceId },
      include: {
        group: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // 3. Logic ตรวจสอบสิทธิ์แบบถาวร (RBAC)
    const isOwner = service.group.userId === currentUser.id;
    const isAdmin = currentUser.role === "admin"; // เช็คจาก Database โดยตรง

    console.log(
      `[DELETE Request] User: ${email} | Role: ${currentUser.role} | Owner: ${isOwner}`
    );

    // ถ้าไม่ใช่ Admin และ ไม่ใช่เจ้าของ -> ห้ามลบ
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        {
          error:
            "Forbidden: You do not have permission to delete this service.",
        },
        { status: 403 }
      );
    }

    // 4. เริ่มกระบวนการลบ (Transaction)
    await prisma.$transaction(async (tx) => {
      // 4.1 ลบ Scan History
      await tx.scanHistory.deleteMany({
        where: { serviceId: serviceId },
      });

      // 4.2 ลบ Service
      await tx.projectService.delete({
        where: { id: serviceId },
      });

      // 4.3 ลบ ProjectGroup หากว่างเปล่า (คืน Quota)
      const remainingServices = await tx.projectService.count({
        where: { groupId: service.group.id },
      });

      if (remainingServices === 0) {
        await tx.projectGroup.delete({
          where: { id: service.group.id },
        });
        console.log(
          `[Quota Cleaned] ProjectGroup ${service.group.id} removed.`
        );
      }
    });

    return NextResponse.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error: any) {
    console.error("[Delete Error]:", error);
    return NextResponse.json(
      { error: "Failed to delete service: " + error.message },
      { status: 500 }
    );
  }
}
