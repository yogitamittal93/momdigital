import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtGuard } from 'src/auth/jwt.gaurd';
import { UploadScanReportDto } from './dto/upload-scan-report.dto';
import { ScanReportsService } from './scan-reports.service';
import { ShareScanReportDto } from './dto/share-scan-report.dto';

@Controller('scan-reports')
@UseGuards(JwtGuard)
export class ScanReportsController {
  constructor(private readonly scanReportsService: ScanReportsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadScanReportDto,
  ) {
    return this.scanReportsService.uploadForUser(req.user.userId, file, dto);
  }

  @Get()
  list(@Req() req: any) {
    return this.scanReportsService.listForUser(req.user.userId);
  }

  @Get(':id/file')
  async download(
    @Req() req: any,
    @Param('id') reportId: string,
    @Res() res: Response,
  ) {
    const file = await this.scanReportsService.getFileForUser(
      req.user.userId,
      reportId,
    );
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename.replace(/"/g, '')}"`,
    );
    return res.send(file.fileBuffer);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req: any, @Param('id') reportId: string) {
    await this.scanReportsService.deleteForUser(req.user.userId, reportId);
    return { message: 'Scan report deleted' };
  }

  @Get(':id/shares')
  listShares(@Req() req: any, @Param('id') reportId: string) {
    return this.scanReportsService.listShares(req.user.userId, reportId);
  }

  @Post(':id/shares')
  createShare(
    @Req() req: any,
    @Param('id') reportId: string,
    @Body() dto: ShareScanReportDto,
  ) {
    return this.scanReportsService.createShare(req.user.userId, reportId, dto);
  }

  @Delete(':id/shares/:shareId')
  @HttpCode(HttpStatus.OK)
  async revokeShare(
    @Req() req: any,
    @Param('id') reportId: string,
    @Param('shareId') shareId: string,
  ) {
    await this.scanReportsService.revokeShare(req.user.userId, reportId, shareId);
    return { message: 'Share revoked' };
  }
}
