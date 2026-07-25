import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';
import { FlagReviewDto } from './dto/flag-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly moderationService: ModerationService,
  ) {}

  // ------------------------------------------------------------------
  // PUBLIC — anyone can read course reviews
  // ------------------------------------------------------------------

  @Get('course/:courseId')
  @ApiOperation({ summary: 'List visible reviews for a course' })
  @ApiQuery({ name: 'page',  required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findCourseReviews(
    @Param('courseId') courseId: string,
    @Query('page')  page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.findCourseReviews(courseId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single review by ID' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  // ------------------------------------------------------------------
  // STUDENT — create / delete own reviews
  // ------------------------------------------------------------------

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a course review (enrolled students only)' })
  create(
    @CurrentUser('id') authorId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(authorId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete your own review' })
  deleteReview(
    @Param('id') id: string,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.reviewsService.deleteReview(id, requesterId);
  }

  // ------------------------------------------------------------------
  // AUTHENTICATED — flag a review
  // ------------------------------------------------------------------

  @Post(':id/flag')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flag a review as inappropriate (any authenticated user)' })
  flagReview(
    @Param('id') id: string,
    @CurrentUser('id') reporterId: string,
    @Body() dto: FlagReviewDto,
  ) {
    return this.reviewsService.flagReview(id, reporterId, dto);
  }

  // ------------------------------------------------------------------
  // ADMIN — moderation queue + actions
  // ------------------------------------------------------------------

  @Get('admin/queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get the moderation queue (flagged reviews)' })
  @ApiQuery({ name: 'page',  required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getModerationQueue(
    @Query('page')  page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.moderationService.getQueue(page, limit);
  }

  @Patch(':id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or remove a flagged review (admin)' })
  moderateReview(
    @Param('id') id: string,
    @CurrentUser('id') moderatorId: string,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.moderationService.moderateReview(id, moderatorId, dto);
  }

  @Get(':id/audit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get moderation audit history for a specific review (admin)' })
  getReviewAudit(@Param('id') id: string) {
    return this.moderationService.getReviewAuditHistory(id);
  }

  @Get('admin/audit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get full moderation audit log across all reviews (admin)' })
  @ApiQuery({ name: 'page',  required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAllAudit(
    @Query('page')  page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.moderationService.getAllAuditHistory(page, limit);
  }
}
