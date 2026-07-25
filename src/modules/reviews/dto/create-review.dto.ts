import {
  IsString, IsNotEmpty, IsOptional, IsInt, Min, Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 'COURSE-TAILORING-001' })
  @IsString() @IsNotEmpty()
  courseId: string;

  @ApiProperty({ example: 5, description: 'Rating from 1 to 5' })
  @IsInt() @Min(1) @Max(5)
  rating: number;

  @ApiProperty({ required: false, example: 'Excellent course!' })
  @IsOptional() @IsString()
  title?: string;

  @ApiProperty({ example: 'This course completely changed my tailoring skills.' })
  @IsString() @IsNotEmpty()
  body: string;
}
