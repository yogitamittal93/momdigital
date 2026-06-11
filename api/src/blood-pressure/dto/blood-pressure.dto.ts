import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateBloodPressureDto {
  @IsInt()
  @Min(50)
  @Max(250)
  systolic: number;

  @IsInt()
  @Min(30)
  @Max(180)
  diastolic: number;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(200)
  pulse?: number;
}
