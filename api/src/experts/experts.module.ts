import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { ExpertsService } from './experts.service';
import { ExpertsController } from './experts.controller';

@Module({
  imports: [PrismaModule],
  providers: [ExpertsService],
  controllers: [ExpertsController],
})
export class ExpertsModule {}
