import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { type, username, token } = await req.json();

    // 1. ตรวจสอบ GitHub Token
    if (type === "github") {
      if (!token) return NextResponse.json({ valid: false, message: "Missing Token" });

      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${token}`,
          "User-Agent": "SecurityScannerApp" // GitHub บังคับให้ใส่ User-Agent
        }
      });
      
      if (res.status === 200) {
        return NextResponse.json({ valid: true });
      } else {
        return NextResponse.json({ valid: false, message: "Invalid GitHub Token" });
      }
    }

    // 2. ตรวจสอบ Docker Hub Credentials
    if (type === "docker") {
      if (!username || !token) return NextResponse.json({ valid: false, message: "Missing User/Token" });

      // Docker Hub Login API
      const res = await fetch("https://hub.docker.com/v2/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: token })
      });
      
      if (res.status === 200) {
        return NextResponse.json({ valid: true });
      } else {
        return NextResponse.json({ valid: false, message: "Invalid Docker Credentials" });
      }
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });

  } catch (error) {
    console.error("Validation Error:", error);
    return NextResponse.json({ valid: false, message: "Validation Service Error" }, { status: 500 });
  }
}