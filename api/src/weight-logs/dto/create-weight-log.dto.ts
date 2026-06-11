import { IsNumber, Min, Max } from 'class-validator';

export class CreateWeightLogDto {
  @IsNumber()
  @Min(30)
  @Max(200)
  weight: number;
}
