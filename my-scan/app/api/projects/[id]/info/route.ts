import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Adjust path as needed
import { prisma } from "@/lib/prisma"; // Adjust path as needed

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  try {
    // 1. Fetch Project Service Details
    let project = await prisma.projectService.findUnique({
      where: { id: projectId },
      include: {
        group: {
          include: {
            user: {
              select: {
                defaultGitUser: true,
                defaultGitToken: true,
                defaultDockerUser: true,
                defaultDockerToken: true,
              }
            }
          }
        },
      },
    });

    // [NEW] Fallback: If not a Service ID, check if it's a Group ID
    let relatedServices: any[] = [];
    
    if (!project) {
        const group = await prisma.projectGroup.findUnique({
            where: { id: projectId },
            include: {
                services: {
                    include: {
                        group: {
                            include: {
                                user: {
                                    select: {
                                        defaultGitUser: true,
                                        defaultGitToken: true,
                                        defaultDockerUser: true,
                                        defaultDockerToken: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (group && group.services.length > 0) {
            project = group.services[0];
            relatedServices = group.services;
        }
    } else {
        // If it was a service ID, try to find siblings if needed (optional, but good for consistency)
        // For now, let's just use the single service as the list
        relatedServices = [project];
        
        // If it has a group, fetch siblings? 
        // optimize: strictly speaking if we clicked a service card, maybe we only care about that service.
        // But dashboard cards are Groups. So usually we hit the "Group" path above.
        // If we want consistency, we could fetch siblings here too.
        if (project.groupId) {
             const group = await prisma.projectGroup.findUnique({
                where: { id: project.groupId },
                include: { services: true }
            });
            if (group) relatedServices = group.services;
        }
    }

    if (!project) {
        return NextResponse.json({ error: "Project info not found" }, { status: 404 });
    }

    // 2. Determine Dockerfile Content
    let dockerfileContent = "";
    let dockerfileSource = "Unknown";

    if (project.useCustomDockerfile && project.dockerfileContent) {
        dockerfileContent = project.dockerfileContent;
        dockerfileSource = `Custom (Override by ${project.dockerfileOverrideBy || "User"})`;
    } else {
         dockerfileContent = project.dockerfileContent || "# Auto-generated";
         dockerfileSource = project.detectedLanguage 
            ? `Auto-detected (${project.detectedLanguage})` 
            : "System Default";
    }
    
    // ... (existing template detection logic)

    return NextResponse.json({
        projectName: project.group.groupName, // Use group name
        serviceCount: relatedServices.length,
        services: relatedServices.map(s => ({
            name: s.serviceName,
            image: s.imageName,
            context: s.contextPath
        })),
        imageName: project.imageName, // Primary/First service image
        contextPath: project.contextPath,
        dockerfileSource,
        dockerfileContent: dockerfileContent || "# No specific template found. System will auto-detect.",
        credentials: {
            gitUser: project.group.gitUser || project.group.user.defaultGitUser || "Not Configured",
            dockerUser: project.dockerUser || project.group.user.defaultDockerUser || "Not Configured",
        },
        settings: {
            isPrivateRepo: project.group.isPrivate,
            repoUrl: project.group.repoUrl,
        }
    });

  } catch (error) {
    console.error("Error fetching project info:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
