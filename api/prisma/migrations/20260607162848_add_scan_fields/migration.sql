-- AlterTable
ALTER TABLE "scan_report_shares" ADD COLUMN     "permission" TEXT NOT NULL DEFAULT 'view';

-- AlterTable
ALTER TABLE "scan_reports" ADD COLUMN     "notes" TEXT;
