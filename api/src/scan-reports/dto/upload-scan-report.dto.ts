import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadScanReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsDateString()
  capturedAt?: string;
}
