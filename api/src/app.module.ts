import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    AuthModule,
    ChatbotModule,
    NannyModule,
    AffirmationsModule,
    AppointmentsModule,
    ExerciseLogsModule,
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
