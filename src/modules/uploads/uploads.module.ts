import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { CdnService } from './cdn.service';
import { CdnController } from './cdn.controller';
import { VirusScanService } from './virus-scan.service';

@Module({
  controllers: [CdnController],
  providers: [UploadsService, CdnService, VirusScanService],
  exports: [UploadsService, CdnService, VirusScanService],
})
export class UploadsModule {}
