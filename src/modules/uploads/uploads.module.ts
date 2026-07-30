import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { CdnService } from './cdn.service';
import { CdnController } from './cdn.controller';

@Module({
  controllers: [CdnController],
  providers: [UploadsService, CdnService],
  exports: [UploadsService, CdnService],
})
export class UploadsModule {}
