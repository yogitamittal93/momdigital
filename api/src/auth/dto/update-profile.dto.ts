import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString()     name?: string;
  @IsOptional() @IsString()     babyName?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsDateString() babyBirthDate?: string;
  @IsOptional() @IsString()     avatarUrl?: string;
  @IsOptional() @IsString()     profileImage?: string;
  @IsOptional() @IsString()     deliveryType?: string;
  @IsOptional() @IsString()     whatsappNumber?: string;
}
