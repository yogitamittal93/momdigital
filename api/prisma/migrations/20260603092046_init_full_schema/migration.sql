/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `contributionCount` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `credentialUrl` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `expertStatus` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `externalLink` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `featuredAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isAdmin` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isFeatured` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `specialization` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `tokenVersion` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `app_config` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `content_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `expert_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pii_audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scan_report_shares` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scan_reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `trainer_content` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_userId_fkey";

-- DropForeignKey
ALTER TABLE "content_requests" DROP CONSTRAINT "content_requests_scanReportId_fkey";

-- DropForeignKey
ALTER TABLE "content_requests" DROP CONSTRAINT "content_requests_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "expert_assignments" DROP CONSTRAINT "expert_assignments_expertId_fkey";

-- DropForeignKey
ALTER TABLE "expert_assignments" DROP CONSTRAINT "expert_assignments_requestId_fkey";

-- DropForeignKey
ALTER TABLE "pii_audit_logs" DROP CONSTRAINT "pii_audit_logs_expertId_fkey";

-- DropForeignKey
ALTER TABLE "scan_report_shares" DROP CONSTRAINT "scan_report_shares_reportId_fkey";

-- DropForeignKey
ALTER TABLE "scan_reports" DROP CONSTRAINT "scan_reports_userId_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_userId_fkey";

-- DropForeignKey
ALTER TABLE "trainer_content" DROP CONSTRAINT "trainer_content_authorId_fkey";

-- DropIndex
DROP INDEX "users_expertStatus_idx";

-- DropIndex
DROP INDEX "users_role_isFeatured_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatarUrl",
DROP COLUMN "contributionCount",
DROP COLUMN "credentialUrl",
DROP COLUMN "expertStatus",
DROP COLUMN "externalLink",
DROP COLUMN "featuredAt",
DROP COLUMN "isAdmin",
DROP COLUMN "isFeatured",
DROP COLUMN "role",
DROP COLUMN "specialization",
DROP COLUMN "tokenVersion",
ADD COLUMN     "babyName" TEXT,
ADD COLUMN     "deliveryType" TEXT,
ADD COLUMN     "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileImage" TEXT;

-- DropTable
DROP TABLE "accounts";

-- DropTable
DROP TABLE "app_config";

-- DropTable
DROP TABLE "content_requests";

-- DropTable
DROP TABLE "expert_assignments";

-- DropTable
DROP TABLE "pii_audit_logs";

-- DropTable
DROP TABLE "scan_report_shares";

-- DropTable
DROP TABLE "scan_reports";

-- DropTable
DROP TABLE "sessions";

-- DropTable
DROP TABLE "trainer_content";

-- DropEnum
DROP TYPE "ContentRequestType";

-- DropEnum
DROP TYPE "ExpertStatus";

-- DropEnum
DROP TYPE "ReviewStatus";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "extractedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "durationMins" INTEGER,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feeding_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER,
    "amountMl" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feeding_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trusted_helper_checks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "helperType" TEXT NOT NULL,
    "checks" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trusted_helper_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "doctorName" TEXT,
    "location" TEXT,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "reminded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_messages_userId_idx" ON "chat_messages"("userId");

-- CreateIndex
CREATE INDEX "exercise_logs_userId_idx" ON "exercise_logs"("userId");

-- CreateIndex
CREATE INDEX "feeding_logs_userId_idx" ON "feeding_logs"("userId");

-- CreateIndex
CREATE INDEX "trusted_helper_checks_userId_idx" ON "trusted_helper_checks"("userId");

-- CreateIndex
CREATE INDEX "appointments_userId_idx" ON "appointments"("userId");

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feeding_logs" ADD CONSTRAINT "feeding_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trusted_helper_checks" ADD CONSTRAINT "trusted_helper_checks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
