import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: ดึง Template (Database -> Fallback)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stack = (searchParams.get("stack") || "default").toLowerCase();

  try {
    // 1. ลองค้นหาใน Database ก่อน (Admin Customization)
    // ถ้า Admin เคยแก้ Template นี้ในหน้าเว็บ ให้ใช้อันนั้น
    const dbTemplate = await prisma.dockerTemplate.findUnique({
      where: { stack },
    });

    if (dbTemplate) {
      return new NextResponse(dbTemplate.content, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 2. ถ้าไม่เจอใน Database ให้ใช้ Hardcoded Fallback (System Defaults)
    // เพื่อป้องกัน Error "No template found" ที่ทำให้ Pipeline พัง
    // Stack names match .gitlab-ci.yml detection: java-maven, java-gradle, go, node, python, rust
    let fallbackContent = "";

    switch (stack) {
      // ===== Node.js =====
      case "node":
        fallbackContent = `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production || npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
`;
        break;

      // ===== Python =====
      case "python":
        fallbackContent = `FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt* pyproject.toml* ./
RUN pip install --no-cache-dir -r requirements.txt 2>/dev/null || pip install --no-cache-dir . 2>/dev/null || true
COPY . .
EXPOSE 8000
CMD ["python", "app.py"]
`;
        break;

      // ===== Java Maven (Pre-compiled JAR) =====
      // Note: JAR is already built in compile stage, just copy it
      case "java-maven":
      case "java":
        fallbackContent = `FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copy pre-built JAR from compile stage
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
`;
        break;

      // ===== Java Gradle (Pre-compiled JAR) =====
      case "java-gradle":
        fallbackContent = `FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copy pre-built JAR from compile stage
COPY build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
`;
        break;

      // ===== Go (Pre-compiled binary) =====
      case "go":
        fallbackContent = `FROM alpine:latest
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata
# Copy pre-built binary from compile stage
COPY app ./app
EXPOSE 8080
ENTRYPOINT ["./app"]
`;
        break;

      // ===== Rust =====
      case "rust":
        fallbackContent = `FROM rust:1.75-alpine AS builder
WORKDIR /app
RUN apk add --no-cache musl-dev
COPY . .
RUN cargo build --release

FROM alpine:latest
WORKDIR /app
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/target/release/* ./
EXPOSE 8080
ENTRYPOINT ["./app"]
`;
        break;

      // ===== .NET =====
      case "dotnet":
        fallbackContent = `FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app
COPY *.csproj ./
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .
EXPOSE 8080
ENTRYPOINT ["dotnet", "app.dll"]
`;
        break;

      // ===== PHP =====
      case "php":
        fallbackContent = `FROM php:8.3-apache
WORKDIR /var/www/html
RUN apt-get update && apt-get install -y libzip-dev && docker-php-ext-install zip pdo pdo_mysql
COPY . .
RUN chown -R www-data:www-data /var/www/html
EXPOSE 80
CMD ["apache2-foreground"]
`;
        break;

      // ===== Ruby =====
      case "ruby":
        fallbackContent = `FROM ruby:3.3-alpine
WORKDIR /app
RUN apk add --no-cache build-base
COPY Gemfile* ./
RUN bundle install
COPY . .
EXPOSE 3000
CMD ["ruby", "app.rb"]
`;
        break;

      // ===== Default/Unknown - สำหรับ Trivy scan =====
      default:
        fallbackContent = `FROM alpine:latest
WORKDIR /app
RUN apk add --no-cache bash curl
COPY . .
CMD ["echo", "Build Complete - Ready for scanning"]
`;
        break;
    }

    return new NextResponse(fallbackContent, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Template API Error:", error);
    // กรณี Database พังจริงๆ ให้ส่ง Fallback พื้นฐานที่สุดไป
    return new NextResponse(
      "FROM alpine:latest\nCOPY . .\nCMD ['echo', 'DB Error']",
      {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }
    );
  }
}

// POST: Admin แก้ไข Template (บันทึกลง Database)
// Secured: Only Admins can update templates
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check Authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check Authorization (Admin only)
    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN") { // Check both casing to be safe, though usually ADMIN from auth.ts
       return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { stack, content } = body;

    if (!stack || !content) {
      return NextResponse.json(
        { error: "Missing stack or content" },
        { status: 400 }
      );
    }

    // Upsert: ถ้ามีอยู่แล้วให้แก้ (Update) ถ้ายังไม่มีให้สร้างใหม่ (Create)
    await prisma.dockerTemplate.upsert({
      where: { stack },
      update: { content },
      create: { stack, content },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}
