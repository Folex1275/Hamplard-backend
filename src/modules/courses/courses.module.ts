// courses.module.ts
import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { FeeCalculatorModule } from '../billing/fee-calculator.module';

@Module({
  imports: [NotificationsModule, FeeCalculatorModule],
  controllers: [SearchController, CoursesController, RecommendationsController],
  providers: [CoursesService, RecommendationsService, SearchService],
  exports: [CoursesService, RecommendationsService, SearchService],
})
export class CoursesModule {}
