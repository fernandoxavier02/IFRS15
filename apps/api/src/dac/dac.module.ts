import { Module } from '@nestjs/common';
import { DACController } from './controllers/dac.controller';
import { DACService } from './services/dac.service';

@Module({
  controllers: [DACController],
  providers: [DACService],
  exports: [DACService]
})
export class DACModule {}
