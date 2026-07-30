import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartImpersonationDto {
  @ApiProperty({ description: 'Target user ID to impersonate' })
  @IsString()
  @IsNotEmpty()
  targetUserId: string;

  @ApiPropertyOptional({ description: 'Session duration in seconds', default: 3600 })
  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(86400)
  durationSeconds?: number;

  @ApiPropertyOptional({ description: 'Reason for starting impersonation support session' })
  @IsOptional()
  @IsString()
  reason?: string;
}
