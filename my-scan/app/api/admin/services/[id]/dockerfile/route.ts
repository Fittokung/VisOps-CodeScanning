import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/services/[id]/dockerfile
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (userRole !== "admin" && userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceId = params.id;

  try {
    const service = await prisma.projectService.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // If custom Dockerfile is used, return it
    if (service.useCustomDockerfile && service.dockerfileContent) {
      return NextResponse.json({
        content: service.dockerfileContent,
        source: "custom",
        language: service.detectedLanguage || "unknown",
      });
    }

    // If not custom, try to find a matching template
    if (service.detectedLanguage) {
      const template = await prisma.dockerTemplate.findUnique({
        where: { stack: service.detectedLanguage },
      });

      if (template) {
        return NextResponse.json({
          content: template.content,
          source: "template",
          language: service.detectedLanguage,
        });
      }
    }

    // Fallback if no template found
    return NextResponse.json({
      content: "# No Dockerfile found and no template matched.\n# Please add a Dockerfile.",
      source: "default",
      language: service.detectedLanguage || "unknown",
    });

  } catch (error) {
    console.error("Admin Dockerfile Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/admin/services/[id]/dockerfile
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const adminId = (session?.user as any)?.id;

  if (userRole !== "admin" && userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceId = params.id;

  try {
    const body = await request.json();
    const { content } = body;

    if (typeof content !== "string") {
        return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }

    const updatedService = await prisma.projectService.update({
      where: { id: serviceId },
      data: {
        useCustomDockerfile: true,
        dockerfileContent: content,
        dockerfileOverrideBy: adminId, // Track who overrode it
      },
    });

    return NextResponse.json(updatedService);

  } catch (error) {
    console.error("Admin Dockerfile Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
