import { PartialType } from '@nestjs/mapped-types';
import { CreatePayoutScheduleDto } from './create-payout-schedule.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePayoutScheduleDto extends PartialType(CreatePayoutScheduleDto) {
  @ApiProperty({ required: false, description: 'Enable or disable the payout schedule' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
