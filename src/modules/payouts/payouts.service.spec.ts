import { Test, TestingModule } from '@nestjs/testing';
import { PayoutsService } from './payouts.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { PayoutStatus, UserRole } from '@prisma/client';

describe('PayoutsService', () => {
  let service: PayoutsService;
  let prisma: any;

  const mockPrisma = {
    user: { findUnique: jest.fn() },
    payout: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PayoutsService>(PayoutsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should prevent non-owners and non-admins from viewing payout history', async () => {
    const requestingUser = { id: 'user-2', role: UserRole.STUDENT };
    await expect(
      service.getInstructorPayoutHistory(requestingUser, 'instructor-1', {}),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should return payout history for requesting instructor', async () => {
    const requestingUser = { id: 'instructor-1', role: UserRole.INSTRUCTOR };
    const payouts = [
      {
        id: 'pay-1',
        instructorId: 'instructor-1',
        amount: 150.0,
        status: PayoutStatus.COMPLETED,
      },
    ];

    mockPrisma.$transaction.mockResolvedValue([payouts, 1]);

    const res = await service.getInstructorPayoutHistory(
      requestingUser,
      'instructor-1',
      {},
    );

    expect(res.data).toHaveLength(1);
    expect(res.meta.total).toBe(1);
  });

  it('should track payout status transitions', async () => {
    mockPrisma.payout.findUnique.mockResolvedValue({
      id: 'pay-1',
      status: PayoutStatus.PENDING,
      txHash: null,
    });
    mockPrisma.payout.update.mockResolvedValue({
      id: 'pay-1',
      status: PayoutStatus.COMPLETED,
      txHash: '0x123',
    });

    const res = await service.updatePayoutStatus('pay-1', {
      status: PayoutStatus.COMPLETED,
      txHash: '0x123',
    });

    expect(res.status).toBe(PayoutStatus.COMPLETED);
    expect(res.txHash).toBe('0x123');
  });
});
