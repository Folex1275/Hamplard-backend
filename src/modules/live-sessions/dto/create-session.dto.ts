import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  IsUrl,
} from 'class-validator';

export class CreateSessionDto {
  @IsString()
  courseId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsUrl()
  meetingUrl?: string;
}
