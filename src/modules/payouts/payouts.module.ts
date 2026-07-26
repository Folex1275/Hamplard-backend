import { Module } from '@nestjs/common';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { KycModule } from '../kyc/kyc.module';

@Module({
  imports: [NotificationsModule, KycModule],
  controllers: [PayoutsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
