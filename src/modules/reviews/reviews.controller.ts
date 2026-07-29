// reviews.controller.ts
import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('reviews')
@Controller('courses')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(':courseId/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Rate and review a course the student is enrolled in' })
  create(
    @Param('courseId') courseId: string,
    @CurrentUser('id') studentId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(studentId, courseId, dto);
  }

  @Get(':courseId/reviews')
  @ApiOperation({ summary: 'List reviews for a course, paginated' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findForCourse(
    @Param('courseId') courseId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.findForCourse(courseId, page, limit);
  }
}
