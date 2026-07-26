import {
  IsString, IsNotEmpty, IsOptional, IsNumber, Min,
  IsArray, ArrayMinSize, ArrayUnique,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBundleDto {
  @ApiProperty({ example: 'Tailoring Starter Pack' })
  @IsString() @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({
    description: 'IDs of the courses included in this bundle (at least 2)',
    type: [String],
  })
  @IsArray() @ArrayMinSize(2) @ArrayUnique()
  @IsString({ each: true })
  courseIds: string[];

  @ApiProperty({ example: 79.99, description: 'Bundle price in USDC — must be less than the sum of the individual course prices' })
  @IsNumber() @Min(0)
  price: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  thumbnailUrl?: string;
}
