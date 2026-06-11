import { IsString, IsNotEmpty } from 'class-validator';

export class CreateMoodLogDto {
  @IsString()
  @IsNotEmpty()
  mood: string;
}
