// app/api/support/tickets/route.ts
/**
 * Support Ticket Management
 * Users can submit tickets, Admins can view and respond
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List tickets (users see their own, admins see all)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let whereClause: any = {};

    // Admins can see all tickets, users only their own
    if (userRole !== 'admin') {
      whereClause.userId = userId;
    }

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ tickets });

  } catch (error: any) {
    console.error("Ticket list error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

// POST: Create new support ticket
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { subject, message, priority } = await req.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: "subject and message are required" },
        { status: 400 }
      );
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: userId,
        subject: subject,
        message: message,
        priority: priority || 'NORMAL',
        status: 'OPEN',
      }
    });

    return NextResponse.json({
      success: true,
      ticket: ticket,
      message: "Support ticket created successfully"
    });

  } catch (error: any) {
    console.error("Ticket creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create ticket" },
      { status: 500 }
    );
  }
}
