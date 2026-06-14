import { IsEnum, IsJSON, IsOptional, IsString, IsUUID } from 'class-validator';
import { ContentRequestType } from '@prisma/client';

export class SubmitContentRequestDto {
  @IsEnum(ContentRequestType)
  requestType!: ContentRequestType;

  @IsOptional()
  @IsUUID()
  scanReportId?: string;

  @IsOptional()
  @IsString()
  questionText?: string;

  /**
   * JSON string with context keys like:
   * { allergyInfo, pregnancyWeek, babyAgeMonths, specificConcern }
   */
  @IsOptional()
  @IsJSON()
  context?: string;
}
