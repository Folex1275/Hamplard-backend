import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { KycStatus } from '@prisma/client';

export class ReviewKycDto {
  @ApiProperty({
    enum: [KycStatus.APPROVED, KycStatus.REJECTED, KycStatus.UNDER_REVIEW],
    description: 'The new verification status',
  })
  @IsEnum(KycStatus)
  status: KycStatus.APPROVED | KycStatus.REJECTED | KycStatus.UNDER_REVIEW;

  @ApiProperty({
    required: false,
    example: 'Document is blurry. Please resubmit a clearer scan.',
    description: 'Admin feedback for the instructor',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
