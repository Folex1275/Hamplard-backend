import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrUpdateExam(@Req() req: any, @Body() dto: CreateExamDto) {
    return this.examsService.createOrUpdateExam(req.user.id, dto);
  }

  @Get('course/:courseId')
  async getExamByCourse(@Param('courseId') courseId: string) {
    return this.examsService.getExamByCourse(courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/eligibility')
  async checkEligibility(@Req() req: any, @Param('id') examId: string) {
    return this.examsService.checkEligibility(req.user.id, examId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  async submitExam(
    @Req() req: any,
    @Param('id') examId: string,
    @Body() dto: SubmitExamDto,
  ) {
    return this.examsService.submitExam(req.user.id, examId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/history')
  async getAttemptHistory(@Req() req: any, @Param('id') examId: string) {
    return this.examsService.getAttemptHistory(req.user.id, examId);
  }
}
