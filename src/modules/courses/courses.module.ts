// courses.module.ts
import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { FeeCalculatorModule } from '../billing/fee-calculator.module';

@Module({
  imports: [NotificationsModule, FeeCalculatorModule],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
