import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { KycDocumentType } from '@prisma/client';

export class SubmitKycDto {
  @ApiProperty({
    enum: KycDocumentType,
    example: KycDocumentType.NATIONAL_ID,
    description: 'Type of identity document being submitted',
  })
  @IsEnum(KycDocumentType)
  documentType: KycDocumentType;

  @ApiProperty({
    required: false,
    description: 'Optional notes about the submission (e.g. document details)',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
