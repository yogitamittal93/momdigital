import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const clientUrls =
    configService
      .get<string>('CLIENT_URLS')
      ?.split(',')
      .map((url) => url.trim())
      .filter(Boolean) ?? [];
  const fallbackClientUrl =
    configService.get<string>('CLIENT_URL') ?? 'http://localhost:3000';

  app.enableCors({
    origin: clientUrls.length ? clientUrls : [fallbackClientUrl],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  app.use(cookieParser());
  await app.listen(configService.get<number>('PORT') ?? 3001);
}

bootstrap();