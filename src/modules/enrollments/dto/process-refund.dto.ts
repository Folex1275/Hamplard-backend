import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessRefundDto {
  @ApiProperty({ description: 'On-chain transaction hash of the executed refund payment' })
  @IsString() @IsNotEmpty()
  txHash: string;
}
