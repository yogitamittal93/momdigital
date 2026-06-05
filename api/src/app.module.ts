import { Module } from '@nestjs/common';
import { ExerciseLogsModule } from './exercise-logs/exercise-logs.module';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ScanReportsModule } from './scan-reports/scan-reports.module';
import { CommonModule } from './common/common.module';
import { RoutingModule } from './routing/routing.module';
import { ContentRequestsModule } from './content-requests/content-requests.module';
import { TrainerContentModule } from './trainer-content/trainer-content.module';
import { ExpertsModule } from './experts/experts.module';
import { PostsModule } from './posts/posts.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { DoctorQueueModule } from './doctor-queue/doctor-queue.module';
import { NannyModule } from './nanny/nanny.module';
import { AffirmationsModule } from './affirmations/affirmations.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { FeedingLogsModule } from './feeding-logs/feeding-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    RoutingModule,
    AuthModule,
    ScanReportsModule,
    ContentRequestsModule,
    TrainerContentModule,
    ExpertsModule,
    PostsModule,
    ChatbotModule,
    DoctorQueueModule,
    NannyModule,
    AffirmationsModule,
    AppointmentsModule,
    FeedingLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


