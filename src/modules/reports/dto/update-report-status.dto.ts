// dto/update-report-status.dto.ts
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';

export class UpdateReportStatusDto {
  @ApiProperty({
    enum: ReportStatus,
    example: ReportStatus.RESOLVED,
    description: 'New status. Must be UNDER_REVIEW, RESOLVED, or DISMISSED.',
  })
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @ApiPropertyOptional({ example: 'Course description updated to remove misleading claims.' })
  @IsOptional() @IsString() @MaxLength(1000)
  resolutionNote?: string;
}
