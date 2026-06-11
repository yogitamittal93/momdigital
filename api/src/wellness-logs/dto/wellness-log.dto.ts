import { IsDateString, IsString } from 'class-validator';

export class ToggleWellnessDto {
  @IsString()
  taskId: string;

  @IsDateString()
  date: string; // format YYYY-MM-DD
}
