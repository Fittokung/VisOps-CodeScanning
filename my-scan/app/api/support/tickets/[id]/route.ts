// app/api/support/tickets/[id]/route.ts
/**
 * Individual Support Ticket Management
 * Update status, add admin reply
 */

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

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const { id: ticketId } = await params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Users can only view their own tickets, admins can view all
    if (userRole !== "admin" && ticket.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ ticket });
  } catch (error: any) {
    console.error("Ticket fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const { id: ticketId } = await params;

    const { status, adminReply, priority } = await req.json();

    // Only admins can update tickets
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Only admins can update tickets" },
        { status: 403 }
      );
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;

      if (status === "RESOLVED" || status === "CLOSED") {
        updateData.resolvedAt = new Date();
      }
    }

    if (adminReply) {
      updateData.adminReply = adminReply;
      updateData.adminId = userId;
    }

    if (priority) {
      updateData.priority = priority;
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: "Ticket updated successfully",
    });
  } catch (error: any) {
    console.error("Ticket update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update ticket" },
      { status: 500 }
    );
  }
}
