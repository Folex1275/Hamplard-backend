import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from './recommendations.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CourseStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

const mockTargetCourse = {
  id: 'course-1',
  category: 'Tailoring',
  status: CourseStatus.ACTIVE,
};

const mockCoEnrolledCourse = {
  id: 'course-2',
  title: 'Advanced Sewing Techniques',
  category: 'Tailoring',
  level: 'Intermediate',
  price: 60,
  avgRating: 4.8,
  totalEnrollments: 120,
  thumbnailUrl: 'http://thumb2.jpg',
  status: CourseStatus.ACTIVE,
};

const mockFallbackCourse = {
  id: 'course-3',
  title: 'Pattern Drafting 101',
  category: 'Tailoring',
  level: 'Beginner',
  price: 40,
  avgRating: 4.5,
  totalEnrollments: 80,
  thumbnailUrl: 'http://thumb3.jpg',
  status: CourseStatus.ACTIVE,
};

const mockPrisma = {
  course: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  enrollment: {
    findMany: jest.fn(),
  },
};

describe('RecommendationsService', () => {
  let service: RecommendationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
    jest.clearAllMocks();
  });

  describe('getRecommendations()', () => {
    it('throws NotFoundException if target course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(service.getRecommendations('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('recommends courses based on co-enrollment patterns and category fallback', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockTargetCourse);
      // Student enrollments for course-1
      mockPrisma.enrollment.findMany
        .mockResolvedValueOnce([{ studentId: 'student-1' }]) // target course enrollments
        .mockResolvedValueOnce([
          {
            studentId: 'student-1',
            courseId: 'course-2',
            course: mockCoEnrolledCourse,
          },
        ]); // co-enrollments

      // Category fallback
      mockPrisma.course.findMany.mockResolvedValue([mockFallbackCourse]);

      const recommendations = await service.getRecommendations('course-1', 2);

      expect(recommendations.length).toBe(2);
      expect(recommendations[0].id).toBe('course-2');
      expect(recommendations[0].matchReason).toBe('co_enrollment');
      expect(recommendations[1].id).toBe('course-3');
      expect(recommendations[1].matchReason).toBe('category_fallback');
    });
  });
});
