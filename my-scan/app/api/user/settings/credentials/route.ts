// app/api/user/settings/credentials/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

// GET: ดึงรายการไปแสดง
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const credentials = await prisma.credential.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      provider: true,
      username: true,
      isDefault: true,
      createdAt: true,
      // ไม่ส่ง token กลับไป
    },
  });

  return NextResponse.json({ credentials });
}

// POST: เพิ่ม Credential ใหม่
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const { name, provider, username, token, isDefault } = await req.json();

    if (!name || !provider || !username || !token) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ถ้าตั้งเป็น Default ให้เคลียร์ค่า Default เก่าก่อน
    if (isDefault) {
      await prisma.credential.updateMany({
        where: { userId, provider },
        data: { isDefault: false },
      });
    }

    const newCred = await prisma.credential.create({
      data: {
        userId,
        name,
        provider,
        username,
        token: encrypt(token),
        isDefault: !!isDefault,
      },
    });

    return NextResponse.json({ success: true, credential: newCred });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create credential" },
      { status: 500 }
    );
  }
}

// DELETE: ลบ Credential
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.credential.deleteMany({
    where: {
      id,
      userId: (session.user as any).id, // ป้องกันการลบของคนอื่น
    },
  });

  return NextResponse.json({ success: true });
}
