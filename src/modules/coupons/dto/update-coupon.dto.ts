import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCouponDto } from './create-coupon.dto';

// Allow updating everything except the code (immutable after creation)
export class UpdateCouponDto extends PartialType(OmitType(CreateCouponDto, ['code'] as const)) {}
