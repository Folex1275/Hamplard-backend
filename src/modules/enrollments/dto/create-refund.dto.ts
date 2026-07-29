import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRefundDto {
  @ApiProperty({ description: 'ID of the enrollment being disputed / cancelled' })
  @IsString() @IsNotEmpty()
  enrollmentId: string;

  @ApiProperty({ description: 'Reason for the refund request' })
  @IsString() @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    description: 'Amount requested in USDC. Defaults to the full amount paid for the enrollment.',
  })
  @IsOptional() @IsNumber() @Min(0.01)
  requestedAmount?: number;
}
