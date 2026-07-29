import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { PayoutQueryDto } from './dto/payout-query.dto';
import { CreatePayoutDto, UpdatePayoutStatusDto } from './dto/create-payout.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('instructor/:instructorId')
  async getInstructorPayoutHistory(
    @Req() req: any,
    @Param('instructorId') instructorId: string,
    @Query() query: PayoutQueryDto,
  ) {
    return this.payoutsService.getInstructorPayoutHistory(
      req.user,
      instructorId,
      query,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('instructor/:instructorId/statement')
  async exportPayoutStatement(
    @Req() req: any,
    @Param('instructorId') instructorId: string,
    @Query() query: PayoutQueryDto,
  ) {
    return this.payoutsService.exportPayoutStatement(
      req.user,
      instructorId,
      query,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPayout(@Body() dto: CreatePayoutDto) {
    return this.payoutsService.createPayout(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updatePayoutStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePayoutStatusDto,
  ) {
    return this.payoutsService.updatePayoutStatus(id, dto);
  }
}
