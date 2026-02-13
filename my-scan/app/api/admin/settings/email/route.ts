import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const EmailSchema = z.object({
  newEmail: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { newEmail } = EmailSchema.parse(body);

    // Check if email already exists
    const existing = await prisma.user.findUnique({
        where: { email: newEmail }
    });

    if (existing) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: { email: newEmail }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Invalid Email", details: error.issues }, { status: 400 });
    }
    console.error("[API_EMAIL_UPDATE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
