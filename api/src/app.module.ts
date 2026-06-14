import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { NannyModule } from './nanny/nanny.module';
import { AffirmationsModule } from './affirmations/affirmations.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ExerciseLogsModule } from './exercise-logs/exercise-logs.module';
import { ScanReportsModule } from './scan-reports/scan-reports.module';
import { ContentRequestsModule } from './content-requests/content-requests.module';
import { TrainerContentModule } from './trainer-content/trainer-content.module';
import { ExpertsModule } from './experts/experts.module';
import { PostsModule } from './posts/posts.module';
import { DoctorQueueModule } from './doctor-queue/doctor-queue.module';
import { RoutingModule } from './routing/routing.module';
import { PregnancyMilestonesModule } from './pregnancy-milestones/pregnancy-milestones.module';
import { BloodPressureModule } from './blood-pressure/blood-pressure.module';
import { WellnessLogsModule } from './wellness-logs/wellness-logs.module';
import { FeedingLogsModule } from './feeding-logs/feeding-logs.module';
import { WeightLogsModule } from './weight-logs/weight-logs.module';
import { MoodLogsModule } from './mood-logs/mood-logs.module';
import { KickLogsModule } from './kick-logs/kick-logs.module';

import { validateConfig } from './common/config.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateConfig,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    CommonModule,
    AuthModule,
    ChatbotModule,
    NannyModule,
    AffirmationsModule,
    AppointmentsModule,
    ExerciseLogsModule,
    PregnancyMilestonesModule,
    BloodPressureModule,
    WellnessLogsModule,
    FeedingLogsModule,
    WeightLogsModule,
    MoodLogsModule,
    KickLogsModule,
    ScanReportsModule,
    ContentRequestsModule,
    TrainerContentModule,
    ExpertsModule,
    PostsModule,
    DoctorQueueModule,
    RoutingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
