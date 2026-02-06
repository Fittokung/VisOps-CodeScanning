import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const ActionSchema = z.object({
  userId: z.string(),
  action: z.enum(["PROMOTE", "DEMOTE", "REJECT", "APPROVE"]),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action } = ActionSchema.parse(body);

    // Prevent Admin from modifying themselves (optional but recommended safety)
    // Prevent Admin from modifying themselves
    if (userId === session.user.id) {
        return NextResponse.json({ error: "Cannot modify your own role" }, { status: 400 });
    }

    // Check target user to protect Super Admin
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true }
    });

    if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // PROTECT SUPER ADMIN: Identify by email "admin@local" or specific ID if fixed
    if (targetUser.email === "admin@local") {
        return NextResponse.json({ error: "Cannot modify Super Admin privileges" }, { status: 403 });
    }

    let updateData = {};
    if (action === "PROMOTE") {
      updateData = { role: "ADMIN" };
    } else if (action === "DEMOTE") {
      updateData = { role: "user" };
    } else if (action === "REJECT") {
      updateData = { status: "REJECTED" };
    } else if (action === "APPROVE") {
      updateData = { status: "ACTIVE" };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
        status: updatedUser.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Invalid Data", details: error.issues }, { status: 400 });
    }
    console.error("[API_ADMIN_ROLE_UPDATE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
