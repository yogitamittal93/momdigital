import { Module } from '@nestjs/common';
import { NannyController } from './nanny.controller';
import { NannyService } from './nanny.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [NannyController],
  providers: [NannyService, PrismaService],
  exports: [NannyService],
})
export class NannyModule {}
