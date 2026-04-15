import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTrainerContentDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(10000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetGroup?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}
