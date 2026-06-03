import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import { AppConfigService } from './app-config.service';
import { RedisService } from './redis.service';
import { RolesGuard } from './guards/roles.guard';
import { AdminGuard } from './guards/admin.guard';

/**
 * Global module — AppConfigService is available in every module
 * without needing to import CommonModule explicitly.
 */
@Global()
@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [AppConfigService, RedisService, RolesGuard, AdminGuard],
  exports: [AppConfigService, RedisService, RolesGuard, AdminGuard],
})
export class CommonModule {}
