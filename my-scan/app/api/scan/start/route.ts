// /app/api/scan/start/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { 
      serviceId, 
      imageTag, 
      // Params เสริม (กรณี User กรอกใหม่)
      repoUrl, dockerUser, dockerToken, contextPath, 
      gitUser, gitToken, imageName
    } = body;

    let finalConfig: any = {};

    // 1. กรณี User เลือก Service เดิม (Re-scan) หรือ Project ใหม่ที่มี URL เดิม
    if (serviceId) {
       const service = await prisma.projectService.findUnique({
          where: { id: serviceId },
          include: { group: true }
       });

       if (!service) {
           return NextResponse.json({ error: "Service not found" }, { status: 404 });
       }

       // ✅ Decrypt Token จาก DB (ใช้ของเดิม ไม่ต้องกรอกใหม่)
       const decryptedGitToken = service.group.gitToken ? decrypt(service.group.gitToken) : "";
       const decryptedDockerToken = service.dockerToken ? decrypt(service.dockerToken) : "";

       finalConfig = {
           repoUrl: service.group.repoUrl,
           projectName: service.group.groupName,
           contextPath: service.contextPath,
           imageName: service.imageName, 
           gitUser: service.group.gitUser,
           gitToken: decryptedGitToken,
           dockerUser: service.dockerUser,
           dockerToken: decryptedDockerToken
       };
    } else {
        // กรณี Project ใหม่แบบกรอกเอง (ยังไม่ลง DB หรือเป็นการ Test)
        finalConfig = {
            repoUrl, dockerUser, dockerToken, contextPath, 
            gitUser, gitToken, imageName, projectName: "manual-scan"
        };
    }

    if (!finalConfig.repoUrl) return NextResponse.json({ error: "Missing Repo URL" }, { status: 400 });

    // 2. Prepare Variables
    const variables = [
        { key: "USER_REPO_URL", value: finalConfig.repoUrl },
        { key: "BUILD_CONTEXT", value: finalConfig.contextPath || "." },
        { key: "USER_TAG", value: imageTag || "latest" },
        
        { key: "DOCKER_USER", value: finalConfig.dockerUser || "" },
        { key: "DOCKER_PASSWORD", value: finalConfig.dockerToken || "" },
        { key: "GIT_USERNAME", value: finalConfig.gitUser || "" },
        { key: "GIT_TOKEN", value: finalConfig.gitToken || "" },
        { key: "PROJECT_NAME", value: finalConfig.imageName || "scanned-project" },
        { key: "BACKEND_HOST_URL", value: process.env.NEXT_PUBLIC_BASE_URL || "" }
    ];
      
    if (!process.env.GITLAB_PROJECT_ID) {
        throw new Error("Missing GITLAB_PROJECT_ID in .env");
    }

    // 3. Trigger GitLab Pipeline
    const gitlabRes = await fetch(`${process.env.GITLAB_API_URL}/api/v4/projects/${process.env.GITLAB_PROJECT_ID}/pipeline`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "PRIVATE-TOKEN": process.env.GITLAB_TOKEN || ""
        }, 
        body: JSON.stringify({
            ref: "main", 
            variables: variables
        })
    });

    const pipelineData = await gitlabRes.json();

    if (!gitlabRes.ok) {
        console.error("GitLab Trigger Failed:", pipelineData);
        // ✅ เช็ค Error กรณี Token ผิด หรือ Permission ไม่ผ่าน
        if (gitlabRes.status === 401 || gitlabRes.status === 403) {
             return NextResponse.json({ error: "GitLab Unauthorized: System Token Invalid" }, { status: 401 });
        }
        // กรณี Pipeline สร้างไม่ได้ (เช่น Variable ผิด)
        return NextResponse.json({ 
            error: "Failed to start scan. Please check your inputs.", 
            details: pipelineData.message 
        }, { status: 400 });
    }

    // 4. บันทึก History
    const newScan = await prisma.scanHistory.create({
        data: {
            serviceId: serviceId || undefined, 
            scanId: process.env.GITLAB_PROJECT_ID, 
            pipelineId: pipelineData.id.toString(), 
            status: "PENDING",
            imageTag: imageTag || "latest",
        }
    });

    return NextResponse.json({ 
        success: true, 
        scanId: newScan.scanId, 
        pipelineId: newScan.pipelineId 
    });

  } catch (error: any) {
    console.error("Start Scan Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}