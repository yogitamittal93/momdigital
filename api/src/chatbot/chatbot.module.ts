import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ChatbotAuthGuard } from './chatbot-auth.guard';
import { PrismaService } from 'prisma/prisma.service';
import { DoctorQueueModule } from '../doctor-queue/doctor-queue.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    JwtModule.register({}),
    DoctorQueueModule,
    NotificationsModule,
    AnalyticsModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService, PrismaService, ChatbotAuthGuard],
})
export class ChatbotModule {}
