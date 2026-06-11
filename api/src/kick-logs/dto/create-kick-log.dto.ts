import { IsInt, IsString, IsNotEmpty, Min } from 'class-validator';

export class CreateKickLogDto {
  @IsInt()
  @Min(0)
  count: number;

  @IsString()
  @IsNotEmpty()
  date: string;
}
