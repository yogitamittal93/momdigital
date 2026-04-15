import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RoutingService } from './routing.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RoutingService],
  exports: [RoutingService],
})
export class RoutingModule {}
