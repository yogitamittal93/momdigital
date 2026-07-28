import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { JwtGuard } from './jwt.gaurd';
import { RedisService } from 'src/common/redis.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { GoogleOAuthGuard, GitHubOAuthGuard } from './guards/oauth.guard';
import { AnalyticsModule } from 'src/analytics/analytics.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
      }),
    }),
    PrismaModule,
    AnalyticsModule,
  ],
  providers: [
    AuthService,
    JwtGuard,
    RedisService,
    GoogleStrategy,
    GitHubStrategy,
    GoogleOAuthGuard,
    GitHubOAuthGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtGuard, JwtModule],
})
export class AuthModule {}
