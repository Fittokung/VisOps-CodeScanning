import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

const PasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = PasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
        return NextResponse.json({ error: "User not found or has no password set" }, { status: 404 });
    }

    const isValid = await compare(currentPassword, user.password);
    if (!isValid) {
        return NextResponse.json({ error: "Invalid current password" }, { status: 400 });
    }

    const hashedPassword = await hash(newPassword, 12);

    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Invalid Data", details: error.issues }, { status: 400 });
    }
    console.error("[API_PASSWORD_UPDATE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
