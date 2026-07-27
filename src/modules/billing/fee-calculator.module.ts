// fee-calculator.module.ts
import { Module } from '@nestjs/common';
import { FeeCalculatorService } from './fee-calculator.service';

@Module({
  providers: [FeeCalculatorService],
  exports: [FeeCalculatorService],
})
export class FeeCalculatorModule {}
