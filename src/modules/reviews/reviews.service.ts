import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FlagReason, NotificationType, ReviewStatus } from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';
import { FlagReviewDto } from './dto/flag-review.dto';

/** Number of flags at which a review is automatically moved to the moderation queue. */
const FLAG_THRESHOLD = 3;

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ------------------------------------------------------------------
  // CREATE / UPDATE
  // ------------------------------------------------------------------

  /**
   * A student posts a course review (one per student per course).
   * The student must be enrolled and must not have an existing VISIBLE or FLAGGED review.
   */
  async createReview(authorId: string, dto: CreateReviewDto) {
    // Verify the student is enrolled in the course
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: authorId, courseId: dto.courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled in this course to leave a review');
    }

    // Enforce one-review-per-student constraint (DB unique constraint will catch this too,
    // but we give a friendlier message)
    const existing = await this.prisma.review.findUnique({
      where: { courseId_authorId: { courseId: dto.courseId, authorId } },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this course');
    }

    const review = await this.prisma.review.create({
      data: {
        courseId: dto.courseId,
        authorId,
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        status: ReviewStatus.VISIBLE,
      },
      include: { author: { select: { name: true, stellarAddress: true } } },
    });

    this.logger.log(`Review ${review.id} created for course ${dto.courseId} by user ${authorId}`);
    return review;
  }

  // ------------------------------------------------------------------
  // READ
  // ------------------------------------------------------------------

  /**
   * Public — list visible (and admin-approved) reviews for a course.
   */
  async findCourseReviews(
    courseId: string,
    page = 1,
    limit = 20,
  ) {
    const where = {
      courseId,
      status: { in: [ReviewStatus.VISIBLE, ReviewStatus.APPROVED] },
    };

    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        include: {
          author: { select: { name: true, stellarAddress: true, avatarUrl: true } },
          _count: { select: { flags: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return { data: reviews, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Return a single review by ID (any status — used internally and by admins).
   */
  async findOne(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        author:         { select: { name: true, stellarAddress: true, avatarUrl: true } },
        flags:          { include: { reporter: { select: { name: true, stellarAddress: true } } } },
        moderationLogs: { include: { moderator: { select: { name: true, stellarAddress: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!review) throw new NotFoundException(`Review ${reviewId} not found`);
    return review;
  }

  // ------------------------------------------------------------------
  // FLAG
  // ------------------------------------------------------------------

  /**
   * Any authenticated user can flag a review.
   * Once FLAG_THRESHOLD unique flags are reached the review is auto-moved to FLAGGED status
   * and an admin notification is sent.
   */
  async flagReview(reviewId: string, reporterId: string, dto: FlagReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException(`Review ${reviewId} not found`);

    if (review.status === ReviewStatus.REMOVED) {
      throw new ForbiddenException('This review has already been removed');
    }
    if (review.authorId === reporterId) {
      throw new ForbiddenException('You cannot flag your own review');
    }

    // Prevent duplicate flags
    const existingFlag = await this.prisma.reviewFlag.findUnique({
      where: { reviewId_reporterId: { reviewId, reporterId } },
    });
    if (existingFlag) {
      throw new ConflictException('You have already flagged this review');
    }

    // Create the flag and increment the denormalised counter atomically
    const [flag, updated] = await this.prisma.$transaction([
      this.prisma.reviewFlag.create({
        data: { reviewId, reporterId, reason: dto.reason, details: dto.details },
      }),
      this.prisma.review.update({
        where: { id: reviewId },
        data: { flagCount: { increment: 1 } },
      }),
    ]);

    // Auto-escalate to FLAGGED once threshold is reached
    if (updated.flagCount >= FLAG_THRESHOLD && updated.status === ReviewStatus.VISIBLE) {
      await this.prisma.review.update({
        where: { id: reviewId },
        data: { status: ReviewStatus.FLAGGED },
      });

      // Notify admins
      const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await this.notifications.notifyUser(
          admin.id,
          NotificationType.REVIEW_FLAGGED,
          'Review flagged for moderation',
          `A course review has reached ${FLAG_THRESHOLD} flags and is awaiting moderation. Review ID: ${reviewId}`,
          { reviewId, courseId: review.courseId },
        );
      }

      this.logger.warn(`Review ${reviewId} auto-escalated to FLAGGED (flagCount=${updated.flagCount})`);
    }

    return { flag, flagCount: updated.flagCount };
  }

  // ------------------------------------------------------------------
  // DELETE (by author)
  // ------------------------------------------------------------------

  /**
   * The review author can delete their own review (unless it has been removed by a moderator).
   */
  async deleteReview(reviewId: string, requesterId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException(`Review ${reviewId} not found`);

    if (review.authorId !== requesterId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }
    if (review.status === ReviewStatus.REMOVED) {
      throw new ForbiddenException('Review has already been removed by a moderator');
    }

    await this.prisma.review.delete({ where: { id: reviewId } });
    this.logger.log(`Review ${reviewId} deleted by author ${requesterId}`);
    return { message: 'Review deleted' };
  }
}
