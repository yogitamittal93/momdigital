import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  const configService = app.get(ConfigService);

  // ─── CORS ──────────────────────────────────────────────────────────────────
  // Parse comma-separated CLIENT_URLS (e.g. for multi-tenant / staging envs).
  const clientUrls =
    configService
      .get<string>('CLIENT_URLS')
      ?.split(',')
      .map((url) => url.trim())
      .filter(Boolean) ?? [];
  const fallbackClientUrl =
    configService.get<string>('CLIENT_URL') ?? 'http://localhost:3000';

  const allowedOrigins = clientUrls.length ? clientUrls : [fallbackClientUrl];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cookie',
    ],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // ─── Global prefix ─────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── Validation ────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Cookie parser ─────────────────────────────────────────────────────────
  app.use(cookieParser());

  // ─── Listen ────────────────────────────────────────────────────────────────
  const port = configService.get<number>('PORT') ?? 3001;
  await app.listen(port);
  logger.log(`API listening on http://localhost:${port}/api`);
  logger.log(`CORS: allowing origins → ${allowedOrigins.join(', ')}`);
}

bootstrap();