import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnrollBundleDto {
  @ApiProperty({ description: 'On-chain transaction hash for the bundle purchase' })
  @IsString() @IsNotEmpty()
  txHash: string;

  @ApiProperty({ description: 'Amount paid in USDC' })
  @IsNumber() @Min(0)
  amountPaid: number;
}
