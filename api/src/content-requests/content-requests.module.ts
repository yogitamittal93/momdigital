import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { ContentRequestsService } from './content-requests.service';
import { ContentRequestsController } from './content-requests.controller';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  providers: [ContentRequestsService],
  controllers: [ContentRequestsController],
  exports: [ContentRequestsService],
})
export class ContentRequestsModule {}
