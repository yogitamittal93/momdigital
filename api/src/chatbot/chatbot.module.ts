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
import { HTTP_DEFAULT_TIMEOUT } from './ml-config';

@Module({
  imports: [
    // Conservative module-level default — individual ML call sites in
    // ChatbotService override this with ML_QUERY_TIMEOUT / ML_EXTRACT_TIMEOUT.
    // Reserved for production scaling (>100 active users): increase if needed.
    HttpModule.register({
      timeout: HTTP_DEFAULT_TIMEOUT,
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

