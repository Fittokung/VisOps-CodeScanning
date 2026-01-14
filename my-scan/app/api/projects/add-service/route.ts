// app/api/projects/add-service/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // 2. Parse request body
    const body = await req.json();
    const {
      groupId,
      serviceName,
      contextPath = ".",
      dockerfileType,
      imageName,
    } = body;

    // 3. Validate required fields
    if (!groupId) {
      return NextResponse.json(
        { error: "groupId is required" },
        { status: 400 }
      );
    }

    if (!serviceName) {
      return NextResponse.json(
        { error: "serviceName is required" },
        { status: 400 }
      );
    }

    // 4. Verify ProjectGroup exists and user owns it
    const projectGroup = await prisma.projectGroup.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        userId: true,
        groupName: true,
        repoUrl: true,
        isActive: true,
      },
    });

    if (!projectGroup) {
      return NextResponse.json(
        { error: "Project group not found" },
        { status: 404 }
      );
    }

    if (projectGroup.userId !== userId) {
      return NextResponse.json(
        { error: "You do not have permission to add services to this project" },
        { status: 403 }
      );
    }

    if (!projectGroup.isActive) {
      return NextResponse.json(
        { error: "Cannot add services to an inactive project" },
        { status: 400 }
      );
    }

    // 5. Generate imageName if not provided
    const finalImageName =
      imageName ||
      `${projectGroup.groupName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")}/${serviceName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")}`;

    // 6. Check if service with same name already exists in this group
    const existingService = await prisma.projectService.findFirst({
      where: {
        groupId,
        serviceName,
      },
    });

    if (existingService) {
      return NextResponse.json(
        {
          error: `Service "${serviceName}" already exists in this project`,
        },
        { status: 409 }
      );
    }

    // 7. Detect language from dockerfileType (optional feature)
    let detectedLanguage = null;
    if (dockerfileType) {
      const languageMap: Record<string, string> = {
        node: "node",
        nodejs: "node",
        javascript: "node",
        typescript: "node",
        python: "python",
        py: "python",
        java: "java",
        spring: "java",
        go: "go",
        golang: "go",
        rust: "rust",
        dotnet: "dotnet",
        csharp: "dotnet",
      };
      detectedLanguage =
        languageMap[dockerfileType.toLowerCase()] || dockerfileType;
    }

    // 8. Create new ProjectService
    const newService = await prisma.projectService.create({
      data: {
        serviceName,
        contextPath,
        imageName: finalImageName,
        groupId,
        detectedLanguage,
        useCustomDockerfile: false,
      },
      select: {
        id: true,
        serviceName: true,
        contextPath: true,
        imageName: true,
        detectedLanguage: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Service "${serviceName}" added successfully`,
        service: newService,
        serviceId: newService.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding service to project:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
