import {
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { PayoutStatus } from '@prisma/client';

export class CreatePayoutDto {
  @IsString()
  instructorId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}

export class UpdatePayoutStatusDto {
  @IsEnum(PayoutStatus)
  status: PayoutStatus;

  @IsOptional()
  @IsString()
  txHash?: string;
}
