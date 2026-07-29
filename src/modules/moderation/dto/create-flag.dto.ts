import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportCategory, ReportTargetType } from '@prisma/client';

export class CreateFlagDto {
  @ApiProperty({ enum: ReportTargetType, description: 'Type of target content being flagged (COURSE, COMMENT, PROFILE)' })
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @ApiProperty({ description: 'ID of the target entity' })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({ enum: ReportCategory, description: 'Reason category for the flag' })
  @IsEnum(ReportCategory)
  category: ReportCategory;

  @ApiPropertyOptional({ description: 'Detailed description or justification for the flag' })
  @IsOptional()
  @IsString()
  description?: string;
}
