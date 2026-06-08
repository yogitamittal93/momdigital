-- AlterTable
ALTER TABLE "scan_report_shares" ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "targetEmail" TEXT;

-- AlterTable
ALTER TABLE "scan_reports" ADD COLUMN     "category" TEXT,
ADD COLUMN     "checksum" TEXT;
