import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesManager } from './services.manager';


@Module({
  controllers: [ServicesController],
  providers: [ServicesManager]
})
export class ServicesModule {}
