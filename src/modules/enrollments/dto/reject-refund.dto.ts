import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectRefundDto {
  @ApiProperty({ description: 'Reason the refund request was rejected' })
  @IsString() @IsNotEmpty()
  reason: string;
}
