import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

const EXPERT_ROLES = [
  UserRole.MBBS,
  UserRole.AYURVEDA,
  UserRole.NUTRITIONIST,
  UserRole.CHEF,
  UserRole.YOGA_TRAINER,
  UserRole.WORKOUT_TRAINER,
] as const;

export class RegisterExpertDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @IsEnum(EXPERT_ROLES, {
    message: `Role must be one of: ${EXPERT_ROLES.join(', ')}`,
  })
  role!: (typeof EXPERT_ROLES)[number];

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsUrl({}, { message: 'externalLink must be a valid URL' })
  externalLink?: string;
}
