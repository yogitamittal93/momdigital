import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;
}
