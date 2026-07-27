import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DisputeStatus } from '@prisma/client';

export class ResolveDisputeDto {
  @ApiProperty({
    enum: [DisputeStatus.RESOLVED, DisputeStatus.REJECTED, DisputeStatus.CLOSED],
    description: 'The final status to set on the dispute',
  })
  @IsEnum(DisputeStatus)
  status: DisputeStatus.RESOLVED | DisputeStatus.REJECTED | DisputeStatus.CLOSED;

  @ApiProperty({ example: 'We reviewed the enrollment and confirmed a partial refund was issued.' })
  @IsString()
  @IsNotEmpty()
  adminNotes: string;
}
