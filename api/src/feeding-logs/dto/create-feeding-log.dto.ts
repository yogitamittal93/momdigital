import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateFeedingLogDto {
  @IsIn(['breast-left', 'breast-right', 'bottle', 'formula'])
  type: 'breast-left' | 'breast-right' | 'bottle' | 'formula';

  @IsDateString()
  startedAt: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMins?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
