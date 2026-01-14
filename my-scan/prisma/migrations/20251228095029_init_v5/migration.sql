-- CreateTable
CREATE TABLE "DockerTemplate" (
    "id" TEXT NOT NULL,
    "stack" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DockerTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanHistory" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "imageTag" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scanId" TEXT NOT NULL,
    "pipelineId" TEXT,
    "vulnCritical" INTEGER NOT NULL DEFAULT 0,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DockerTemplate_stack_key" ON "DockerTemplate"("stack");
