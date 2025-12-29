import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      // User Info
      email, 
      
      // Group Info (Repo)
      groupName, 
      repoUrl, 
      isPrivate,
      gitUser,
      gitToken,
      
      // Service Info (Image)
      serviceName, 
      contextPath, 
      imageName, // ต้องรับชื่อ Image ปลายทางมาด้วย (เช่น index.docker.io/user/app)
      dockerUser,
      dockerToken,
      
      // Logic Flags
      isNewGroup, 
      groupId 
    } = body;

    if (!email) {
       return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Check Quota (Limit 6 Images per User)
    // นับจำนวน Service ทั้งหมดที่ User คนนี้เป็นเจ้าของผ่าน Group
    const currentServicesCount = await prisma.projectService.count({
      where: {
        group: { userEmail: email }
      }
    });

    if (currentServicesCount >= 6) {
      return NextResponse.json({ 
        error: "Quota Exceeded", 
        message: "You have reached the limit of 6 services. Please delete unused services." 
      }, { status: 403 });
    }

    // 2. Prepare Target Group ID
    let targetGroupId = groupId;

    // กรณีสร้าง Group ใหม่ (Repo ใหม่)
    if (isNewGroup) {
      // ตรวจสอบข้อมูลจำเป็นสำหรับ Group
      if (!groupName || !repoUrl) {
        return NextResponse.json({ error: "Group Name and Repo URL are required for new group" }, { status: 400 });
      }

      // สร้าง Group
      const newGroup = await prisma.projectGroup.create({
        data: {
          groupName,
          repoUrl,
          isPrivate: !!isPrivate,
          gitUser: gitUser || null,
          gitToken: gitToken ? encrypt(gitToken) : null,
          user: {
            connectOrCreate: {
                where: { email },
                create: { email }
            }
          }
        }
      });
      targetGroupId = newGroup.id;
    }

    // ตรวจสอบว่ามี targetGroupId แน่นอน
    if (!targetGroupId) {
        return NextResponse.json({ error: "Group ID is missing" }, { status: 400 });
    }

    // 3. Create Service (Image Config)
    if (!serviceName || !imageName) {
        return NextResponse.json({ error: "Service Name and Image Name are required" }, { status: 400 });
    }

    const newService = await prisma.projectService.create({
      data: {
        groupId: targetGroupId,
        serviceName,
        contextPath: contextPath || ".", // ถ้าไม่ส่งมา ให้เป็น root (.)
        imageName, // สำคัญ: ต้องระบุชื่อ Image ปลายทาง
        
        dockerUser: dockerUser || null,
        dockerToken: dockerToken ? encrypt(dockerToken) : null,
      }
    });

    return NextResponse.json({ success: true, serviceId: newService.id });

  } catch (error: any) {
    console.error("Create Project Error:", error);
    return NextResponse.json({ error: "Server Error", details: error.message }, { status: 500 });
  }
}