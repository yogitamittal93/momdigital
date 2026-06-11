-- CreateTable
CREATE TABLE "pregnancy_milestone_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pregnancy_milestone_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blood_pressure_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "systolic" INTEGER NOT NULL,
    "diastolic" INTEGER NOT NULL,
    "pulse" INTEGER,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blood_pressure_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wellness_checklist_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wellness_checklist_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pregnancy_milestone_logs_userId_idx" ON "pregnancy_milestone_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "pregnancy_milestone_logs_userId_week_title_key" ON "pregnancy_milestone_logs"("userId", "week", "title");

-- CreateIndex
CREATE INDEX "blood_pressure_logs_userId_idx" ON "blood_pressure_logs"("userId");

-- CreateIndex
CREATE INDEX "wellness_checklist_logs_userId_idx" ON "wellness_checklist_logs"("userId");

-- AddForeignKey
ALTER TABLE "pregnancy_milestone_logs" ADD CONSTRAINT "pregnancy_milestone_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blood_pressure_logs" ADD CONSTRAINT "blood_pressure_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wellness_checklist_logs" ADD CONSTRAINT "wellness_checklist_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
