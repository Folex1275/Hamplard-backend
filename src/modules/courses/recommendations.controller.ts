import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';

@ApiTags('course-recommendations')
@Controller('courses')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get(':id/recommendations')
  @ApiOperation({ summary: 'Get related course recommendations based on co-enrollment and category' })
  @ApiParam({ name: 'id', description: 'Target course ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of recommendations (default 5)' })
  getRecommendations(
    @Param('id') courseId: string,
    @Query('limit') limit?: number,
  ) {
    return this.recommendationsService.getRecommendations(
      courseId,
      limit ? Number(limit) : 5,
    );
  }
}
