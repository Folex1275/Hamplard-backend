import { Module } from '@nestjs/common';
import { LiveSessionsService } from './live-sessions.service';
import { LiveSessionRemindersService } from './live-session-reminders.service';
import { LiveSessionsController } from './live-sessions.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [LiveSessionsController],
  providers: [LiveSessionsService, LiveSessionRemindersService],
  exports: [LiveSessionsService, LiveSessionRemindersService],
})
export class LiveSessionsModule {}
