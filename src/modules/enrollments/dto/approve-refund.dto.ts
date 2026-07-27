import { IsOptional, IsNumber, Min, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveRefundDto {
  @ApiPropertyOptional({
    description: 'Amount to approve in USDC. Defaults to the full requested amount. Provide a lower value for a partial refund.',
  })
  @IsOptional() @IsNumber() @Min(0.01)
  approvedAmount?: number;

  @ApiPropertyOptional({ description: 'Internal admin note' })
  @IsOptional() @IsString()
  adminNote?: string;
}
