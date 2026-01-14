// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ดึงรายชื่อผู้ใช้ทั้งหมด
export async function GET() {
  const session = await getServerSession(authOptions);

  // เช็คว่าเป็น Admin หรือไม่
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      isSetupComplete: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

// อัปเดตสถานะ (Approve/Reject) หรือ Role
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  // เช็คสิทธิ์ Admin
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const currentAdminId = (session?.user as any)?.id;

  try {
    const body = await req.json();
    const { userId, status, role } = body;

    // ค้นหาข้อมูลของ User ที่กำลังจะถูกแก้ไขก่อน
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // ป้องกันไม่ให้ Admin แก้ไขสถานะของตัวเอง ป้องกัน Self-Lockout
    if (userId === currentAdminId) {
      return NextResponse.json(
        { error: "You cannot modify your own status or role." },
        { status: 400 }
      );
    }

    // ป้องกันไม่ให้แก้สถานะของคนอื่นที่เป็น Admin เหมือนกัน
    if (targetUser?.role === "admin") {
      return NextResponse.json(
        { error: "Cannot modify status of another Admin" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(status && { status }),
        ...(role && { role }),
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
