import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  @IsOptional()
  NODE_ENV: string = 'development';

  @Matches(/^postgresql?:\/\//, {
    message:
      'DATABASE_URL must be a valid postgres connection string starting with postgresql:// or postgres://',
  })
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  GROQ_API_KEY!: string;

  @IsUrl(
    { require_tld: false },
    {
      message:
        'ML_SERVICE_URL must be a valid URL (TLD check disabled for internal/Docker hosts)',
    },
  )
  ML_SERVICE_URL!: string;

  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  @IsString()
  @IsOptional()
  CLIENT_URL?: string;

  @IsString()
  @IsOptional()
  CLIENT_URLS?: string;

  @IsString()
  @IsOptional()
  FRONTEND_URL?: string;

  @IsUrl(
    { require_tld: false },
    {
      message:
        'API_PUBLIC_ORIGIN must be a valid URL (TLD check disabled for internal hosts)',
    },
  )
  @IsOptional()
  API_PUBLIC_ORIGIN?: string;

  @IsNumber()
  @IsOptional()
  PORT?: number;
}

export function validateConfig(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const errorDetails = errors
      .map((err) => {
        const constraints = err.constraints
          ? Object.values(err.constraints).join(', ')
          : 'unknown constraint';
        return `  - Env key '${err.property}' failed check: ${constraints}`;
      })
      .join('\n');
    throw new Error(
      `\n❌ ENVIRONMENT STARTUP VALIDATION ERROR:\n${errorDetails}\n`,
    );
  }
  return validated;
}
