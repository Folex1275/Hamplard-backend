import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CourseStatus } from '@prisma/client';

export interface RecommendedCourseItem {
  id: string;
  title: string;
  category: string;
  level: string;
  price: any;
  avgRating: number;
  totalEnrollments: number;
  thumbnailUrl?: string | null;
  matchReason: 'co_enrollment' | 'category_fallback';
  score?: number;
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getRecommendations(courseId: string, limit: number = 5): Promise<RecommendedCourseItem[]> {
    const targetCourse = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, category: true, status: true },
    });

    if (!targetCourse) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    const effectiveLimit = limit > 0 && limit <= 20 ? limit : 5;
    const recommendations: RecommendedCourseItem[] = [];
    const addedCourseIds = new Set<string>([targetCourse.id]);

    // 1. Co-enrollment recommendation logic
    const studentEnrollments = await this.prisma.enrollment.findMany({
      where: { courseId: targetCourse.id },
      select: { studentId: true },
    });

    const studentIds = studentEnrollments.map((e) => e.studentId);

    if (studentIds.length > 0) {
      const coEnrollments = await this.prisma.enrollment.findMany({
        where: {
          studentId: { in: studentIds },
          courseId: { not: targetCourse.id },
          course: { status: CourseStatus.ACTIVE },
        },
        include: {
          course: true,
        },
      });

      // Count occurrences per course
      const courseCounts = new Map<string, { course: any; count: number }>();
      coEnrollments.forEach((e) => {
        const cId = e.courseId;
        if (!courseCounts.has(cId)) {
          courseCounts.set(cId, { course: e.course, count: 0 });
        }
        courseCounts.get(cId)!.count += 1;
      });

      // Sort by co-enrollment frequency descending
      const sortedCoEnrollments = Array.from(courseCounts.values()).sort(
        (a, b) => b.count - a.count,
      );

      for (const item of sortedCoEnrollments) {
        if (recommendations.length >= effectiveLimit) break;
        addedCourseIds.add(item.course.id);
        recommendations.push({
          id: item.course.id,
          title: item.course.title,
          category: item.course.category,
          level: item.course.level,
          price: item.course.price,
          avgRating: item.course.avgRating,
          totalEnrollments: item.course.totalEnrollments,
          thumbnailUrl: item.course.thumbnailUrl,
          matchReason: 'co_enrollment',
          score: item.count,
        });
      }
    }

    // 2. Category-based fallback ranking
    if (recommendations.length < effectiveLimit) {
      const needed = effectiveLimit - recommendations.length;
      const fallbackCourses = await this.prisma.course.findMany({
        where: {
          category: targetCourse.category,
          status: CourseStatus.ACTIVE,
          id: { notIn: Array.from(addedCourseIds) },
        },
        orderBy: [{ avgRating: 'desc' }, { totalEnrollments: 'desc' }],
        take: needed,
      });

      for (const course of fallbackCourses) {
        addedCourseIds.add(course.id);
        recommendations.push({
          id: course.id,
          title: course.title,
          category: course.category,
          level: course.level,
          price: course.price,
          avgRating: course.avgRating,
          totalEnrollments: course.totalEnrollments,
          thumbnailUrl: course.thumbnailUrl,
          matchReason: 'category_fallback',
        });
      }
    }

    return recommendations;
  }
}
