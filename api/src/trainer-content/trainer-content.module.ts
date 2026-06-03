import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { TrainerContentService } from './trainer-content.service';
import { TrainerContentController } from './trainer-content.controller';

@Module({
  imports: [PrismaModule],
  providers: [TrainerContentService],
  controllers: [TrainerContentController],
  exports: [TrainerContentService],
})
export class TrainerContentModule {}
