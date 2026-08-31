// reports.module.ts
import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { RevenueReportController } from './revenue-report.controller';
import { RevenueReportService } from './revenue-report.service';

@Module({
  controllers: [ReportsController, RevenueReportController],
  providers: [ReportsService, RevenueReportService],
  exports: [ReportsService, RevenueReportService],
})
export class ReportsModule {}
