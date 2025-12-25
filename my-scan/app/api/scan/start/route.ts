import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";
import fs from "fs";
import path from "path";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
  console.log("[API] Scan Process Started (Stable Mode)");

  try {
    // 1. Config
    const baseUrl = process.env.GITLAB_API_URL?.replace(/\/$/, "");
    const groupId = "2"; 
    const token = process.env.GITLAB_TOKEN;
    const mockUser = "student_debug";

    // 2. Validate & Receive Data
    let body;
    try { body = await req.json(); } catch (e) { throw new Error("Invalid JSON Body"); }
    
    const { 
        repoUrl, 
        dockerUser, dockerToken,            
        dockerUsername, dockerAccessToken,  
        projectName, imageTag               
    } = body;

    const finalUser = dockerUser || dockerUsername;
    const finalToken = dockerToken || dockerAccessToken;
    const finalProjectName = projectName || "scanned-project";
    const finalUserTag = imageTag || "latest";

    console.log("DEBUG RECEIVE:", { 
        repoUrl, 
        hasUser: !!finalUser, 
        hasToken: !!finalToken
    });

    if (!repoUrl) throw new Error("Missing repoUrl");

    const repoUrlTrimmed = repoUrl.trim();
    const agent = new https.Agent({ rejectUnauthorized: false });

    // 3. Read CI File
    let ciContent = "";
    try {
        const ciPath = path.join(process.cwd(), '.gitlab-ci.yml'); 
        ciContent = fs.readFileSync(ciPath, 'utf-8');
        if (!ciContent) throw new Error("File is empty");
    } catch (readErr: any) {
        return NextResponse.json({ error: "Config Error", message: "Cannot read .gitlab-ci.yml" }, { status: 500 });
    }

    // 4. Create Project
    const uniqueProjectName = `scan-${mockUser}-${Date.now()}`;
    const createRes = await axios.post(`${baseUrl}/api/v4/projects`, {
        name: uniqueProjectName,
        namespace_id: groupId,
        visibility: 'private',
        topics: [mockUser], 
        initialize_with_readme: true 
    }, {
        headers: { 'PRIVATE-TOKEN': token },
        httpsAgent: agent
    });

    const projectId = createRes.data.id;
    console.log(`Project Created ID: ${projectId}`);
    
    // รอให้ GitLab สร้าง Git Repository เสร็จสมบูรณ์
    await delay(2000);

    // 5. Detect Branch
    const projectInfo = await axios.get(`${baseUrl}/api/v4/projects/${projectId}`, {
        headers: { 'PRIVATE-TOKEN': token },
        httpsAgent: agent
    });
    // ถ้า default_branch ยังไม่มา ให้ fallback เป็น main
    const targetBranch = projectInfo.data.default_branch || 'main';
    console.log(`Target Branch detected: ${targetBranch}`);

    // 6. Push CI File
    // *** สำคัญ: เพิ่ม [skip ci] เพื่อไม่ให้ Pipeline รันเองอัตโนมัติ (เพราะมันจะ Fail เนื่องจากไม่มี Variable) ***
    console.log("Pushing clean .gitlab-ci.yml...");
    await axios.post(`${baseUrl}/api/v4/projects/${projectId}/repository/files/.gitlab-ci.yml`, {
        branch: targetBranch,
        content: ciContent, 
        commit_message: "Add CI Config [skip ci]" 
    }, {
        headers: { 'PRIVATE-TOKEN': token },
        httpsAgent: agent
    });
    console.log("CI File Pushed! (Waiting for sync...)");
    
    // รอให้ File Indexing ทำงานสักครู่
    await delay(1500);

    // 7. Prepare Variables
    console.log(`Triggering Pipeline on ${targetBranch}...`);
    
    const pipelineVariables = [
        { key: 'SCAN_MODE', value: 'security' },
        { key: 'USER_REPO_URL', value: repoUrlTrimmed },
        { key: 'PROJECT_NAME', value: finalProjectName },
        { key: 'USER_TAG', value: finalUserTag }
    ];

    if (finalUser && finalToken) {
        pipelineVariables.push(
            { key: 'DOCKER_USER', value: finalUser.trim() },
            { key: 'DOCKER_PASSWORD', value: finalToken.trim() }
        );
    }

    // 8. Trigger Pipeline
    const pipelineRes = await axios.post(`${baseUrl}/api/v4/projects/${projectId}/pipeline`, {
        ref: targetBranch,
        variables: pipelineVariables 
    }, {
        headers: { 'PRIVATE-TOKEN': token },
        httpsAgent: agent
    });

    console.log(`Pipeline Started ID: ${pipelineRes.data.id}`);

    return NextResponse.json({
      status: "success",
      scanId: projectId.toString(),
      pipelineId: pipelineRes.data.id
    });

  } catch (err: any) {
    // --- ปรับปรุงการแสดงผล Error ให้เห็นไส้ใน ---
    console.error("❌ API ERROR OCCURRED");
    let errorDetail = err.message;

    if (axios.isAxiosError(err) && err.response) {
        console.error("GitLab Response Status:", err.response.status);
        console.error("GitLab Response Data:", JSON.stringify(err.response.data, null, 2)); // ดูตรงนี้ใน Terminal
        errorDetail = JSON.stringify(err.response.data);
    } else {
        console.error(err);
    }

    return NextResponse.json({ error: "Server Error", message: err.message, detail: errorDetail }, { status: 500 });
  }
}