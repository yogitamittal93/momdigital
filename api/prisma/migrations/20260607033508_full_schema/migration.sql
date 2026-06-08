-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MOTHER', 'MBBS', 'AYURVEDA', 'NUTRITIONIST', 'CHEF', 'YOGA_TRAINER', 'WORKOUT_TRAINER', 'DANCE_TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ExpertStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DoctorSpecialty" AS ENUM ('OBGYN', 'PEDIATRICIAN', 'GENERAL_PHYSICIAN', 'AYURVEDA_VAIDYA', 'NUTRITIONIST');

-- CreateEnum
CREATE TYPE "ContentRequestType" AS ENUM ('MEDICAL_SCAN', 'DIETARY_QUERY', 'RECIPE_REVIEW', 'EXERCISE_QUERY', 'CROSS_DISCIPLINE', 'GENERAL_QUESTION');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'ML_REVIEWED', 'APPROVED', 'FLAGGED', 'NEEDS_MORE_INFO');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "contributionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "credentialUrl" TEXT,
ADD COLUMN     "expertStatus" "ExpertStatus",
ADD COLUMN     "externalLink" TEXT,
ADD COLUMN     "featuredAt" TIMESTAMP(3),
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "languagesSpoken" TEXT[],
ADD COLUMN     "monthlyQuestionLimit" INTEGER DEFAULT 20,
ADD COLUMN     "questionsUsedThisMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quotaResetAt" TIMESTAMP(3),
ADD COLUMN     "registrationNo" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'MOTHER',
ADD COLUMN     "specialization" TEXT,
ADD COLUMN     "whatsappNumber" TEXT;

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "email" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "employer" TEXT,
    "breakStartDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "planItems" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_requests" (
    "id" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "requestType" "ContentRequestType" NOT NULL,
    "questionText" TEXT,
    "context" JSONB,
    "scanReportId" TEXT,
    "routedRoles" "UserRole"[],
    "mlResponse" TEXT,
    "mlConfidence" DOUBLE PRECISION,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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

    CONSTRAINT "expert_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_reports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "shareToken" TEXT,
    "shareExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_report_shares" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "sharedWithEmail" TEXT,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "accessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_report_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialization" "DoctorSpecialty" NOT NULL,
    "registrationNo" TEXT,
    "hospitalAffiliation" TEXT,
    "yearsExperience" INTEGER,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "avgResponseHours" INTEGER DEFAULT 24,
    "reviewsCompleted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_reviews" (
    "id" TEXT NOT NULL,
    "doctorProfileId" TEXT NOT NULL,
    "contentRequestId" TEXT NOT NULL,
    "originalAnswer" TEXT NOT NULL,
    "reviewedAnswer" TEXT,
    "doctorNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approved_answers" (
    "id" TEXT NOT NULL,
    "questionHash" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sources" TEXT[],
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approved_answers_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "live_sessions" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sessionType" TEXT NOT NULL DEFAULT 'whatsapp',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 60,
    "maxAttendees" INTEGER,
    "meetingUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "targetGroup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_registrations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_posts" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
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
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "oauth_accounts_userId_idx" ON "oauth_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_providerId_key" ON "oauth_accounts"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "career_plans_userId_key" ON "career_plans"("userId");

-- CreateIndex
CREATE INDEX "content_requests_uploadedById_idx" ON "content_requests"("uploadedById");

-- CreateIndex
CREATE INDEX "expert_assignments_expertId_idx" ON "expert_assignments"("expertId");

-- CreateIndex
CREATE UNIQUE INDEX "expert_assignments_requestId_expertId_key" ON "expert_assignments"("requestId", "expertId");

-- CreateIndex
CREATE UNIQUE INDEX "scan_reports_shareToken_key" ON "scan_reports"("shareToken");

-- CreateIndex
CREATE INDEX "scan_reports_userId_idx" ON "scan_reports"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "scan_report_shares_token_key" ON "scan_report_shares"("token");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_userId_key" ON "doctor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_reviews_contentRequestId_key" ON "doctor_reviews"("contentRequestId");

-- CreateIndex
CREATE INDEX "doctor_reviews_doctorProfileId_idx" ON "doctor_reviews"("doctorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "approved_answers_questionHash_key" ON "approved_answers"("questionHash");

-- CreateIndex
CREATE INDEX "trainer_content_authorId_idx" ON "trainer_content"("authorId");

-- CreateIndex
CREATE INDEX "live_sessions_hostId_idx" ON "live_sessions"("hostId");

-- CreateIndex
CREATE UNIQUE INDEX "session_registrations_sessionId_userId_key" ON "session_registrations"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "community_posts_authorId_idx" ON "community_posts"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_postId_userId_key" ON "post_likes"("postId", "userId");

-- CreateIndex
CREATE INDEX "post_comments_postId_idx" ON "post_comments"("postId");

-- CreateIndex
CREATE INDEX "pii_audit_logs_expertId_idx" ON "pii_audit_logs"("expertId");

-- CreateIndex
CREATE UNIQUE INDEX "app_config_key_key" ON "app_config"("key");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_plans" ADD CONSTRAINT "career_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_requests" ADD CONSTRAINT "content_requests_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_requests" ADD CONSTRAINT "content_requests_scanReportId_fkey" FOREIGN KEY ("scanReportId") REFERENCES "scan_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_assignments" ADD CONSTRAINT "expert_assignments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "content_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_assignments" ADD CONSTRAINT "expert_assignments_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_report_shares" ADD CONSTRAINT "scan_report_shares_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "scan_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_reviews" ADD CONSTRAINT "doctor_reviews_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "doctor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_reviews" ADD CONSTRAINT "doctor_reviews_contentRequestId_fkey" FOREIGN KEY ("contentRequestId") REFERENCES "content_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_content" ADD CONSTRAINT "trainer_content_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_registrations" ADD CONSTRAINT "session_registrations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pii_audit_logs" ADD CONSTRAINT "pii_audit_logs_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
