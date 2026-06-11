/*
  Warnings:

  - You are about to drop the column `dateTime` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `doctorName` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `reminded` on the `appointments` table. All the data in the column will be lost.
  - Added the required column `date` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "dateTime",
DROP COLUMN "doctorName",
DROP COLUMN "notes",
DROP COLUMN "reminded",
ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "reminder" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'CHECKUP';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "weight" DOUBLE PRECISION;
