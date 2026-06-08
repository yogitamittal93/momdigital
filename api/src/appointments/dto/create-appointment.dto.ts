import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString() title: string;
  @IsOptional() @IsString()     doctorName?: string;
  @IsOptional() @IsString()     location?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsDateString() dateTime?: string;
  @IsOptional() @IsString()     description?: string;
  @IsOptional() @IsString()     notes?: string;
  @IsOptional() @IsBoolean()    reminder?: boolean;
}

export class UpdateAppointmentDto {
  @IsOptional() @IsString()     title?: string;
  @IsOptional() @IsString()     doctorName?: string;
  @IsOptional() @IsString()     location?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsDateString() dateTime?: string;
  @IsOptional() @IsString()     description?: string;
  @IsOptional() @IsString()     notes?: string;
  @IsOptional() @IsBoolean()    reminder?: boolean;
  @IsOptional() @IsBoolean()    completed?: boolean;
}
