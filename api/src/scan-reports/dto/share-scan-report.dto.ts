import { IsDateString, IsEmail, IsIn, IsOptional } from 'class-validator';

export class ShareScanReportDto {
  @IsEmail()
  targetEmail!: string;

  @IsOptional()
  @IsIn(['view', 'download'])
  permission?: 'view' | 'download';

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
