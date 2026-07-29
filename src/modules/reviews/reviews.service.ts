// reviews.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  async create(studentId: string, courseId: string, dto: CreateReviewDto) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const isEnrolled = await this.enrollmentsService.isEnrolled(studentId, courseId);
    if (!isEnrolled) {
      throw new ForbiddenException('You must be enrolled in this course to leave a review');
    }

    const existing = await this.prisma.courseReview.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
    });
    if (existing) throw new ConflictException('You have already reviewed this course');

    const review = await this.prisma.courseReview.create({
      data: { courseId, studentId, rating: dto.rating, comment: dto.comment },
    });

    await this.recomputeCourseRating(courseId);

    return review;
  }

  async findForCourse(courseId: string, page = 1, limit = 20) {
    const where = { courseId };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.courseReview.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { student: { select: { id: true, name: true, avatarUrl: true } } },
      }),
      this.prisma.courseReview.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  private async recomputeCourseRating(courseId: string) {
    const agg = await this.prisma.courseReview.aggregate({
      where: { courseId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        avgRating: agg._avg.rating ?? 0,
        totalReviews: agg._count._all,
      },
    });
  }
}
