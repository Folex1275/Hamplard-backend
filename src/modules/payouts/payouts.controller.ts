import {
  Controller, Get, Post, Patch, Body, Param,
  UseGuards, HttpCode, HttpStatus, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { CreatePayoutScheduleDto } from './dto/create-payout-schedule.dto';
import { UpdatePayoutScheduleDto } from './dto/update-payout-schedule.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PayoutStatus, UserRole } from '@prisma/client';

@ApiTags('payouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  // ----------------------------------------------------------
  // INSTRUCTOR — SCHEDULE SETUP & STATUS
  // ----------------------------------------------------------

  @Post('schedule')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or replace payout schedule (requires KYC approval)' })
  createSchedule(
    @CurrentUser('id') instructorId: string,
    @Body() dto: CreatePayoutScheduleDto,
  ) {
    return this.payoutsService.createSchedule(instructorId, dto);
  }

  @Get('schedule/my')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get your payout schedule, pending balance, and recent payouts' })
  getMySchedule(@CurrentUser('id') instructorId: string) {
    return this.payoutsService.getMySchedule(instructorId);
  }

  @Patch('schedule/my')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Update frequency, minimum threshold, or destination address' })
  updateSchedule(
    @CurrentUser('id') instructorId: string,
    @Body() dto: UpdatePayoutScheduleDto,
  ) {
    return this.payoutsService.updateSchedule(instructorId, dto);
  }

  @Get('schedule/my/next')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get next payout date and whether minimum threshold is met' })
  getNextPayoutDate(@CurrentUser('id') instructorId: string) {
    return this.payoutsService.getNextPayoutDate(instructorId);
  }

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get your payout history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyPayouts(
    @CurrentUser('id') instructorId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.payoutsService.getMyPayouts(instructorId, page, limit);
  }

  @Get('my/balance')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Get your current pending payout balance in USDC' })
  async getMyBalance(@CurrentUser('id') instructorId: string) {
    const balance = await this.payoutsService.getPendingBalance(instructorId);
    return { pendingBalance: balance };
  }

  // ----------------------------------------------------------
  // ADMIN — MANAGE ALL SCHEDULES & PAYOUTS
  // ----------------------------------------------------------

  @Get('admin/schedules')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all instructor payout schedules (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAllSchedules(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.payoutsService.findAllSchedules(page, limit);
  }

  @Get('admin/payouts')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all payouts (admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: PayoutStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAllPayouts(
    @Query('status') status?: PayoutStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.payoutsService.findAllPayouts(page, limit, status);
  }

  @Post('admin/trigger/:instructorId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Manually trigger an immediate payout for an instructor (admin only)' })
  triggerManualPayout(
    @Param('instructorId') instructorId: string,
    @Body() body: { notes?: string },
  ) {
    return this.payoutsService.triggerManualPayout(instructorId, body.notes);
  }

  @Patch('admin/payouts/:payoutId/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a payout as completed and record the on-chain txHash (admin only)' })
  markCompleted(
    @Param('payoutId') payoutId: string,
    @Body() body: { txHash: string },
  ) {
    return this.payoutsService.markPayoutCompleted(payoutId, body.txHash);
  }
}
