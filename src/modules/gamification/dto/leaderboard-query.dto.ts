import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LeaderboardScope {
  GLOBAL = 'global',
  COURSE = 'course',
}

export class LeaderboardQueryDto {
  @ApiProperty({ enum: LeaderboardScope, description: 'Scope for leaderboard ranking (global or course)' })
  @IsEnum(LeaderboardScope)
  scope: LeaderboardScope;

  @ApiPropertyOptional({ description: 'Required if scope is course' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Number of top students to return', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;
}
