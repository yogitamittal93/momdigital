import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() profileImage?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsDateString() babyBirthDate?: string;
  @IsOptional() @IsString() babyName?: string;
  @IsOptional() @IsString() deliveryType?: string;
  @IsOptional() @IsString() whatsappNumber?: string;
  @IsOptional() @IsBoolean() onboardingDone?: boolean;
}
