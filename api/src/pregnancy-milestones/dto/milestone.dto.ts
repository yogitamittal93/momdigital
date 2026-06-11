import { IsInt, IsString, Min, Max } from 'class-validator';

export class ToggleMilestoneDto {
  @IsInt()
  @Min(1)
  @Max(42)
  week: number;

  @IsString()
  title: string;
}
