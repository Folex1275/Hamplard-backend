import {
  Injectable, NotFoundException, BadRequestException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { KycService } from '../kyc/kyc.service';
import { PayoutFrequency, PayoutStatus, NotificationType } from '@prisma/client';
import { CreatePayoutScheduleDto } from './dto/create-payout-schedule.dto';
import { UpdatePayoutScheduleDto } from './dto/update-payout-schedule.dto';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly kycService: KycService,
  ) {}

  // ----------------------------------------------------------
  // SCHEDULE MANAGEMENT (instructor)
  // ----------------------------------------------------------

  /**
   * Create or replace the payout schedule for an instructor.
   * An instructor can only have one active schedule.
   */
  async createSchedule(instructorId: string, dto: CreatePayoutScheduleDto) {
    // KYC must be approved before payouts can be scheduled
    const kycStatus = await this.kycService.getVerificationStatus(instructorId);
    if (!kycStatus.isVerified) {
      throw new ForbiddenException(
        'Your identity (KYC) must be verified before setting up a payout schedule',
      );
    }

    const instructor = await this.prisma.user.findUnique({ where: { id: instructorId } });
    if (!instructor) throw new NotFoundException('Instructor not found');

    const stellarAddress = dto.stellarAddress ?? instructor.stellarAddress;
    const nextPayoutDate = this.calculateNextPayoutDate(dto.frequency);

    // Upsert — replace existing schedule if present
    const existing = await this.prisma.payoutSchedule.findUnique({
      where: { instructorId },
    });

    if (existing) {
      const schedule = await this.prisma.payoutSchedule.update({
        where: { instructorId },
        data: {
          frequency: dto.frequency,
          minimumThreshold: dto.minimumThreshold,
          stellarAddress,
          nextPayoutDate,
          isActive: true,
        },
      });
      this.logger.log(`Payout schedule updated for instructor ${instructorId}`);
      return schedule;
    }

    const schedule = await this.prisma.payoutSchedule.create({
      data: {
        instructorId,
        frequency: dto.frequency,
        minimumThreshold: dto.minimumThreshold,
        stellarAddress,
        nextPayoutDate,
      },
    });

    this.logger.log(`Payout schedule created for instructor ${instructorId}`);
    return schedule;
  }

  async getMySchedule(instructorId: string) {
    const schedule = await this.prisma.payoutSchedule.findUnique({
      where: { instructorId },
      include: {
        payouts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!schedule) throw new NotFoundException('No payout schedule found. Please create one.');

    const pendingBalance = await this.getPendingBalance(instructorId);
    return { ...schedule, pendingBalance };
  }

  async updateSchedule(instructorId: string, dto: UpdatePayoutScheduleDto) {
    const schedule = await this.prisma.payoutSchedule.findUnique({
      where: { instructorId },
    });
    if (!schedule) throw new NotFoundException('No payout schedule found');

    const data: any = { ...dto };
    // Recalculate next payout date if frequency changes
    if (dto.frequency && dto.frequency !== schedule.frequency) {
      data.nextPayoutDate = this.calculateNextPayoutDate(dto.frequency);
    }

    return this.prisma.payoutSchedule.update({ where: { instructorId }, data });
  }

  // ----------------------------------------------------------
  // PAYOUT HISTORY
  // ----------------------------------------------------------

  async getMyPayouts(instructorId: string, page = 1, limit = 20) {
    const [payouts, total] = await this.prisma.$transaction([
      this.prisma.payout.findMany({
        where: { instructorId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payout.count({ where: { instructorId } }),
    ]);
    return { data: payouts, meta: { total, page, limit } };
  }

  async getNextPayoutDate(instructorId: string) {
    const schedule = await this.prisma.payoutSchedule.findUnique({
      where: { instructorId },
      select: { nextPayoutDate: true, isActive: true, minimumThreshold: true },
    });
    if (!schedule) return { nextPayoutDate: null, isActive: false };

    const pendingBalance = await this.getPendingBalance(instructorId);
    const meetsThreshold = pendingBalance >= Number(schedule.minimumThreshold);

    return {
      nextPayoutDate: schedule.nextPayoutDate,
      isActive: schedule.isActive,
      pendingBalance,
      minimumThreshold: Number(schedule.minimumThreshold),
      meetsThreshold,
    };
  }

  // ----------------------------------------------------------
  // PENDING BALANCE
  // ----------------------------------------------------------

  /**
   * Calculates the instructor's pending (unpaid) revenue balance.
   * Revenue = sum of enrollments for their courses minus platform fee,
   * minus amounts already paid out.
   */
  async getPendingBalance(instructorId: string): Promise<number> {
    const instructor = await this.prisma.user.findUnique({ where: { id: instructorId } });
    if (!instructor) return 0;

    // Sum all enrollment revenue for this instructor's courses
    const revenueResult = await this.prisma.enrollment.aggregate({
      where: {
        course: { instructorAddress: instructor.stellarAddress },
        status: { not: 'REFUNDED' },
      },
      _sum: { amountPaid: true },
    });

    // Get the course's platform fee percentage (use average across courses)
    const courses = await this.prisma.course.findMany({
      where: { instructorAddress: instructor.stellarAddress },
      select: { platformFeePercent: true },
    });

    const avgFeePercent = courses.length > 0
      ? courses.reduce((sum, c) => sum + c.platformFeePercent, 0) / courses.length
      : 20;

    const grossRevenue = Number(revenueResult._sum?.amountPaid ?? 0);
    const instructorRevenue = grossRevenue * (1 - avgFeePercent / 100);

    // Subtract amounts already paid out (COMPLETED payouts)
    const paidOut = await this.prisma.payout.aggregate({
      where: { instructorId, status: PayoutStatus.COMPLETED },
      _sum: { amount: true },
    });

    const alreadyPaid = Number(paidOut._sum?.amount ?? 0);
    return Math.max(0, Number((instructorRevenue - alreadyPaid).toFixed(2)));
  }

  // ----------------------------------------------------------
  // ADMIN — VIEW & MANAGE ALL PAYOUTS
  // ----------------------------------------------------------

  async findAllSchedules(page = 1, limit = 20) {
    const [schedules, total] = await this.prisma.$transaction([
      this.prisma.payoutSchedule.findMany({
        include: {
          instructor: { select: { id: true, name: true, stellarAddress: true } },
          _count: { select: { payouts: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payoutSchedule.count(),
    ]);
    return { data: schedules, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findAllPayouts(page = 1, limit = 20, status?: PayoutStatus) {
    const where: any = {};
    if (status) where.status = status;

    const [payouts, total] = await this.prisma.$transaction([
      this.prisma.payout.findMany({
        where,
        include: {
          instructor: { select: { id: true, name: true, stellarAddress: true } },
          schedule: { select: { stellarAddress: true, frequency: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payout.count({ where }),
    ]);
    return { data: payouts, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /** Admin manually triggers a payout for a specific instructor */
  async triggerManualPayout(instructorId: string, adminNotes?: string) {
    const schedule = await this.prisma.payoutSchedule.findUnique({
      where: { instructorId },
    });
    if (!schedule) throw new NotFoundException('No payout schedule found for this instructor');
    if (!schedule.isActive) throw new BadRequestException('Payout schedule is inactive');

    return this.processPayout(schedule.id, instructorId, adminNotes);
  }

  /** Admin marks a pending payout as completed and records the txHash */
  async markPayoutCompleted(payoutId: string, txHash: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException(`Payout ${payoutId} not found`);

    if (payout.status !== PayoutStatus.PROCESSING && payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException('Only PENDING or PROCESSING payouts can be marked completed');
    }

    const updated = await this.prisma.payout.update({
      where: { id: payoutId },
      data: { status: PayoutStatus.COMPLETED, txHash, processedAt: new Date() },
    });

    // Notify instructor
    await this.notifications.notifyUser(
      payout.instructorId,
      NotificationType.PAYOUT_PROCESSED,
      'Payout processed',
      `Your payout of ${payout.amount} USDC has been sent to your Stellar wallet.`,
      { payoutId, txHash, amount: payout.amount },
    );

    this.logger.log(`Payout ${payoutId} marked completed with txHash ${txHash}`);
    return updated;
  }

  // ----------------------------------------------------------
  // SCHEDULED CRON — runs daily at midnight
  // ----------------------------------------------------------

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processScheduledPayouts() {
    this.logger.log('Running scheduled payout processing...');

    const now = new Date();
    const dueSchedules = await this.prisma.payoutSchedule.findMany({
      where: {
        isActive: true,
        nextPayoutDate: { lte: now },
      },
    });

    this.logger.log(`Found ${dueSchedules.length} due payout schedule(s)`);

    for (const schedule of dueSchedules) {
      try {
        const pendingBalance = await this.getPendingBalance(schedule.instructorId);

        if (pendingBalance < Number(schedule.minimumThreshold)) {
          this.logger.log(
            `Skipping payout for instructor ${schedule.instructorId}: ` +
            `balance ${pendingBalance} below threshold ${schedule.minimumThreshold}`,
          );
          // Still advance the next payout date
          await this.prisma.payoutSchedule.update({
            where: { id: schedule.id },
            data: { nextPayoutDate: this.calculateNextPayoutDate(schedule.frequency) },
          });
          continue;
        }

        await this.processPayout(schedule.id, schedule.instructorId);
      } catch (error) {
        this.logger.error(
          `Failed to process payout for schedule ${schedule.id}`,
          error.message,
        );
      }
    }
  }

  // ----------------------------------------------------------
  // CORE PAYOUT PROCESSING
  // ----------------------------------------------------------

  private async processPayout(
    scheduleId: string,
    instructorId: string,
    notes?: string,
  ) {
    const pendingBalance = await this.getPendingBalance(instructorId);
    const schedule = await this.prisma.payoutSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (pendingBalance < Number(schedule.minimumThreshold)) {
      throw new BadRequestException(
        `Pending balance (${pendingBalance} USDC) is below the minimum threshold ` +
        `(${schedule.minimumThreshold} USDC)`,
      );
    }

    const now = new Date();
    const periodStart = schedule.lastPayoutDate ?? new Date(0);

    const payout = await this.prisma.$transaction(async (tx) => {
      const newPayout = await tx.payout.create({
        data: {
          scheduleId,
          instructorId,
          amount: pendingBalance,
          status: PayoutStatus.PENDING,
          periodStart,
          periodEnd: now,
          notes: notes ?? null,
        },
      });

      await tx.payoutSchedule.update({
        where: { id: scheduleId },
        data: {
          lastPayoutDate: now,
          nextPayoutDate: this.calculateNextPayoutDate(schedule.frequency),
        },
      });

      return newPayout;
    });

    // Notify instructor that payout has been scheduled
    await this.notifications.notifyUser(
      instructorId,
      NotificationType.PAYOUT_SCHEDULED,
      'Payout scheduled',
      `A payout of ${pendingBalance} USDC has been scheduled and will be sent shortly.`,
      { payoutId: payout.id, amount: pendingBalance },
    );

    this.logger.log(
      `Payout created: ${payout.id} for instructor ${instructorId}, amount: ${pendingBalance} USDC`,
    );
    return payout;
  }

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  private calculateNextPayoutDate(frequency: PayoutFrequency): Date {
    const now = new Date();
    switch (frequency) {
      case PayoutFrequency.WEEKLY:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case PayoutFrequency.BIWEEKLY:
        return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      case PayoutFrequency.MONTHLY:
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}
