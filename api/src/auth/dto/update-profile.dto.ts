import { IsDateString, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString()     name?: string;
  @IsOptional() @IsString()     babyName?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsDateString() babyBirthDate?: string;
  @IsOptional() @IsString()     avatarUrl?: string;
  @IsOptional() @IsString()     profileImage?: string;
  @IsOptional() @IsString()     deliveryType?: string;
  @IsOptional() @IsString()     whatsappNumber?: string;

  /** Body weight in kilograms (35–150 kg) */
  @IsOptional() @IsNumber() @Min(35) @Max(150) weight?: number;

  /** Height in centimetres (120–215 cm) */
  @IsOptional() @IsNumber() @Min(120) @Max(215) height?: number;
}

