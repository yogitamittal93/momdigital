import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { ContentRequestsService } from './content-requests.service';
import { ContentRequestsController } from './content-requests.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [ContentRequestsService],
  controllers: [ContentRequestsController],
  exports: [ContentRequestsService],
})
export class ContentRequestsModule {}
