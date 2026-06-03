import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { AppointmentType } from '@prisma/client';

export class CreateAppointmentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @IsOptional()
  @IsBoolean()
  reminder?: boolean;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @IsOptional()
  @IsBoolean()
  reminder?: boolean;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
