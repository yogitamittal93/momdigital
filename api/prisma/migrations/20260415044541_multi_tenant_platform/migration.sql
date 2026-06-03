-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MOTHER', 'MBBS', 'AYURVEDA', 'NUTRITIONIST', 'CHEF', 'YOGA_TRAINER', 'WORKOUT_TRAINER');

-- CreateEnum
CREATE TYPE "ExpertStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ContentRequestType" AS ENUM ('MEDICAL_SCAN', 'DIETARY_QUERY', 'RECIPE_REVIEW', 'EXERCISE_QUERY', 'CROSS_DISCIPLINE', 'GENERAL_QUESTION');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'ML_REVIEWED', 'APPROVED', 'FLAGGED', 'NEEDS_MORE_INFO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "babyBirthDate" TIMESTAMP(3),
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "role" "UserRole" NOT NULL DEFAULT 'MOTHER',
    "expertStatus" "ExpertStatus",
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "specialization" TEXT,
    "externalLink" TEXT,
    "avatarUrl" TEXT,
    "credentialUrl" TEXT,
    "contributionCount" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_reports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "category" TEXT,
    "notes" TEXT,
    "capturedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scan_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_report_shares" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "targetEmail" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'view',
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scan_report_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_requests" (
    "id" TEXT NOT NULL,
    "requestType" "ContentRequestType" NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "scanReportId" TEXT,
    "questionText" TEXT,
    "context" JSONB,
    "mlResponse" TEXT,
    "mlConfidence" DOUBLE PRECISION,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "routedRoles" "UserRole"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expert_assignments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "expertNote" TEXT,
    "piViewedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expert_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_content" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "targetGroup" TEXT,
    "mediaUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainer_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pii_audit_logs" (
    "id" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pii_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_config" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_isFeatured_idx" ON "users"("role", "isFeatured");

-- CreateIndex
CREATE INDEX "users_expertStatus_idx" ON "users"("expertStatus");

-- CreateIndex
CREATE UNIQUE INDEX "scan_reports_storedName_key" ON "scan_reports"("storedName");

-- CreateIndex
CREATE INDEX "scan_reports_userId_createdAt_idx" ON "scan_reports"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "scan_report_shares_reportId_targetEmail_idx" ON "scan_report_shares"("reportId", "targetEmail");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "content_requests_uploadedById_createdAt_idx" ON "content_requests"("uploadedById", "createdAt");

-- CreateIndex
CREATE INDEX "content_requests_status_requestType_idx" ON "content_requests"("status", "requestType");

-- CreateIndex
CREATE INDEX "expert_assignments_expertId_status_idx" ON "expert_assignments"("expertId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "expert_assignments_requestId_expertId_key" ON "expert_assignments"("requestId", "expertId");

-- CreateIndex
CREATE INDEX "trainer_content_authorId_isPublished_idx" ON "trainer_content"("authorId", "isPublished");

-- CreateIndex
CREATE INDEX "trainer_content_isPublished_publishedAt_idx" ON "trainer_content"("isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "pii_audit_logs_expertId_idx" ON "pii_audit_logs"("expertId");

-- CreateIndex
CREATE INDEX "pii_audit_logs_requestId_idx" ON "pii_audit_logs"("requestId");

-- AddForeignKey
ALTER TABLE "scan_reports" ADD CONSTRAINT "scan_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_report_shares" ADD CONSTRAINT "scan_report_shares_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "scan_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_requests" ADD CONSTRAINT "content_requests_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_requests" ADD CONSTRAINT "content_requests_scanReportId_fkey" FOREIGN KEY ("scanReportId") REFERENCES "scan_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_assignments" ADD CONSTRAINT "expert_assignments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "content_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_assignments" ADD CONSTRAINT "expert_assignments_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_content" ADD CONSTRAINT "trainer_content_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pii_audit_logs" ADD CONSTRAINT "pii_audit_logs_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
