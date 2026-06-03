import { IsDateString, IsOptional, IsObject, IsString } from 'class-validator';

export class CareerPlanDto {
  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsString()
  employer?: string;

  @IsOptional()
  @IsDateString()
  breakStartDate?: string;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsOptional()
  @IsObject()
  planItems?: Record<string, unknown>;
}
