import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({ example: 'SAVE20', description: 'Coupon code to validate' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'COURSE-TAILORING-001', description: 'Course the coupon is being applied to' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ example: 50, description: 'Original price of the course in USDC' })
  @IsNumber()
  @IsPositive()
  originalPrice: number;
}
