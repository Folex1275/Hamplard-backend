import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { RestoreController } from './restore.controller';
import { RestoreService } from './restore.service';

@Module({
  controllers: [RestoreController],
  providers: [RestoreService],
  exports: [RestoreService],
=======
import { EnrollmentRestoreService } from './enrollment-restore.service';
import { EnrollmentRestoreController } from './enrollment-restore.controller';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [EnrollmentsModule],
  controllers: [EnrollmentRestoreController],
  providers: [EnrollmentRestoreService],
  exports: [EnrollmentRestoreService],
>>>>>>> origin/fix/59-backend-create-enrollment-data-restore-api
})
export class BackupsModule {}
