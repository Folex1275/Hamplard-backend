// dto/create-report.dto.ts
import { IsEnum, IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportTargetType, ReportCategory, ReportSeverity } from '@prisma/client';

export class CreateReportDto {
  @ApiProperty({ enum: ReportTargetType, example: ReportTargetType.COURSE })
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @ApiProperty({ example: 'COURSE-TAILORING-001', description: 'ID of the course, comment, or user profile being reported' })
  @IsString() @IsNotEmpty()
  targetId: string;

  @ApiProperty({ enum: ReportCategory, example: ReportCategory.SPAM })
  @IsEnum(ReportCategory)
  category: ReportCategory;

  @ApiPropertyOptional({ enum: ReportSeverity, default: ReportSeverity.MEDIUM })
  @IsOptional() @IsEnum(ReportSeverity)
  severity?: ReportSeverity;

  @ApiPropertyOptional({ example: 'This course description contains misleading claims.' })
  @IsOptional() @IsString() @MaxLength(1000)
  description?: string;
}
