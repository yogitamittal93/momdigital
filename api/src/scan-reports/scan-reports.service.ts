import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import { createHash, randomUUID } from 'crypto';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { UploadScanReportDto } from './dto/upload-scan-report.dto';
import { ShareScanReportDto } from './dto/share-scan-report.dto';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

@Injectable()
export class ScanReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getUploadDir() {
    return this.configService.get<string>('SCAN_UPLOAD_DIR') ?? 'uploads/scans';
  }

  private getExtensionFromMime(mimeType: string) {
    switch (mimeType) {
      case 'application/pdf':
        return 'pdf';
      case 'image/png':
        return 'png';
      case 'image/jpeg':
        return 'jpg';
      case 'image/webp':
        return 'webp';
      default:
        throw new BadRequestException('Unsupported file type');
    }
  }

  private validateFile(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('A scan file is required');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Only PDF, PNG, JPG, and WEBP are allowed');
    }

    const maxBytes = Number(
      this.configService.get<string>('SCAN_MAX_FILE_BYTES') ?? '10485760',
    );
    if (file.size > maxBytes) {
      throw new BadRequestException('File exceeds maximum allowed size');
    }
  }

  async uploadForUser(
    userId: string,
    file: Express.Multer.File,
    dto: UploadScanReportDto,
  ) {
    this.validateFile(file);
    const uploadDir = this.getUploadDir();
    await mkdir(uploadDir, { recursive: true });

    const extension = this.getExtensionFromMime(file.mimetype);
    const storedName = `${userId}-${randomUUID()}.${extension}`;
    const destination = join(uploadDir, storedName);
    const checksum = createHash('sha256').update(file.buffer).digest('hex');

    await writeFile(destination, file.buffer);

    return this.prisma.scanReport.create({
      data: {
        userId,
        originalName: file.originalname,
        storedName,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        checksum,
        category: dto.category,
        notes: dto.notes,
        capturedAt: dto.capturedAt ? new Date(dto.capturedAt) : undefined,
      },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        category: true,
        notes: true,
        capturedAt: true,
        createdAt: true,
      },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.scanReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        category: true,
        notes: true,
        capturedAt: true,
        createdAt: true,
      },
    });
  }

  async getFileForUser(userId: string, reportId: string) {
    const report = await this.prisma.scanReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        userId: true,
        originalName: true,
        storedName: true,
        mimeType: true,
      },
    });

    if (!report) throw new NotFoundException('Scan report not found');
    if (report.userId !== userId) throw new UnauthorizedException();

    const filePath = join(this.getUploadDir(), report.storedName);
    const fileBuffer = await readFile(filePath);
    return {
      fileBuffer,
      mimeType: report.mimeType,
      filename: report.originalName,
    };
  }

  async deleteForUser(userId: string, reportId: string) {
    const report = await this.prisma.scanReport.findUnique({
      where: { id: reportId },
      select: { id: true, userId: true, storedName: true },
    });

    if (!report) throw new NotFoundException('Scan report not found');
    if (report.userId !== userId) throw new UnauthorizedException();

    await this.prisma.scanReport.delete({ where: { id: reportId } });
    await unlink(join(this.getUploadDir(), report.storedName)).catch(() => null);
  }

  private async assertOwner(userId: string, reportId: string) {
    const report = await this.prisma.scanReport.findUnique({
      where: { id: reportId },
      select: { id: true, userId: true },
    });
    if (!report) throw new NotFoundException('Scan report not found');
    if (report.userId !== userId) throw new UnauthorizedException();
    return report;
  }

  async createShare(userId: string, reportId: string, dto: ShareScanReportDto) {
    await this.assertOwner(userId, reportId);
    return this.prisma.scanReportShare.create({
      data: {
        reportId,
        targetEmail: dto.targetEmail.toLowerCase(),
        permission: dto.permission ?? 'view',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      select: {
        id: true,
        targetEmail: true,
        permission: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  async listShares(userId: string, reportId: string) {
    await this.assertOwner(userId, reportId);
    return this.prisma.scanReportShare.findMany({
      where: { reportId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        targetEmail: true,
        permission: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  async revokeShare(userId: string, reportId: string, shareId: string) {
    await this.assertOwner(userId, reportId);
    const share = await this.prisma.scanReportShare.findUnique({
      where: { id: shareId },
      select: { id: true, reportId: true },
    });
    if (!share || share.reportId !== reportId) {
      throw new NotFoundException('Share not found');
    }

    await this.prisma.scanReportShare.update({
      where: { id: shareId },
      data: { revokedAt: new Date() },
    });
  }
}
