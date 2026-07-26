// enrollments.module.ts
import { Module } from '@nestjs/common';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { RefundsController } from './refunds.controller';
import { RefundsService } from './refunds.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [NotificationsModule, InvoicesModule],
  controllers: [EnrollmentsController, RefundsController],
  providers: [EnrollmentsService, RefundsService],
  exports: [EnrollmentsService, RefundsService],
})
export class EnrollmentsModule {}
