import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
