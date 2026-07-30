import { Module } from '@nestjs/common';
import { EnrollmentRestoreService } from './enrollment-restore.service';
import { EnrollmentRestoreController } from './enrollment-restore.controller';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [EnrollmentsModule],
  controllers: [EnrollmentRestoreController],
  providers: [EnrollmentRestoreService],
  exports: [EnrollmentRestoreService],
})
export class BackupsModule {}
