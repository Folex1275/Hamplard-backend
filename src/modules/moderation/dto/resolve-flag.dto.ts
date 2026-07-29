import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';

export class ResolveFlagDto {
  @ApiProperty({ enum: ReportStatus, description: 'New status for the flag (UNDER_REVIEW, RESOLVED, DISMISSED)' })
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @ApiPropertyOptional({ description: 'Moderator notes explaining the resolution' })
  @IsOptional()
  @IsString()
  resolutionNote?: string;
}
