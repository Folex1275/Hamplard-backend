import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardService } from './leaderboard.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LeaderboardScope } from './dto/leaderboard-query.dto';
import { BadRequestException } from '@nestjs/common';

const mockStudents = [
  {
    id: 'student-1',
    name: 'Alice',
    avatarUrl: 'http://avatar1.jpg',
    stellarAddress: 'GALICE',
    enrollments: [
      {
        status: 'COMPLETED',
        progressPercent: 100,
        lessonProgress: [{ id: 'lp-1' }, { id: 'lp-2' }],
      },
    ],
    assignments: [{ id: 'sub-1' }],
    examAttempts: [{ score: 85 }],
  },
  {
    id: 'student-2',
    name: 'Bob',
    avatarUrl: null,
    stellarAddress: 'GBOB',
    enrollments: [
      {
        status: 'ACTIVE',
        progressPercent: 50,
        lessonProgress: [{ id: 'lp-3' }],
      },
    ],
    assignments: [],
    examAttempts: [],
  },
];

const mockPrisma = {
  user: {
    findMany: jest.fn(),
  },
  course: {
    findMany: jest.fn(),
  },
};

describe('LeaderboardService', () => {
  let service: LeaderboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
    jest.clearAllMocks();
  });

  describe('getLeaderboard()', () => {
    it('throws BadRequestException if course scope is selected without courseId', async () => {
      await expect(
        service.getLeaderboard({ scope: LeaderboardScope.COURSE }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns top-N leaderboard entries for global scope with calculated points and rank', async () => {
      mockPrisma.user.findMany.mockResolvedValue(mockStudents);

      const result = await service.getLeaderboard({
        scope: LeaderboardScope.GLOBAL,
        limit: 10,
      });

      expect(result.total).toBe(2);
      expect(result.data[0].userId).toBe('student-1');
      // Points calculation for student-1: (2 lessons * 10) + 100 bonus + (1 assignment * 50) + 85 exam = 255
      expect(result.data[0].points).toBe(255);
      expect(result.data[0].currentRank).toBe(1);

      // Points calculation for student-2: 1 lesson * 10 = 10
      expect(result.data[1].userId).toBe('student-2');
      expect(result.data[1].points).toBe(10);
      expect(result.data[1].currentRank).toBe(2);
    });

    it('tracks rank position changes after recalculation', async () => {
      mockPrisma.user.findMany.mockResolvedValue(mockStudents);
      mockPrisma.course.findMany.mockResolvedValue([]);

      // First run: initial recalculation snapshot
      await service.recalculateRankings();

      // Now query leaderboard
      const result = await service.getLeaderboard({
        scope: LeaderboardScope.GLOBAL,
        limit: 10,
      });

      expect(result.data[0].previousRank).toBe(1);
      expect(result.data[0].rankChange).toBe(0);
    });
  });
});
