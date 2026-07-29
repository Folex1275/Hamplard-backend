// invoices.module.ts
import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
