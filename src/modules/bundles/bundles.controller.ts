// bundles.controller.ts
import {
  Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BundlesService } from './bundles.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { EnrollBundleDto } from './dto/enroll-bundle.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('bundles')
@Controller('bundles')
export class BundlesController {
  constructor(private readonly bundlesService: BundlesService) {}

  // ----------------------------------------------------------
  // PUBLIC
  // ----------------------------------------------------------

  @Get()
  @ApiOperation({ summary: 'List active course bundles' })
  @ApiQuery({ name: 'instructorAddress', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('instructorAddress') instructorAddress?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.bundlesService.findAll({ instructorAddress, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bundle detail including included courses' })
  findOne(@Param('id') id: string) {
    return this.bundlesService.findOne(id);
  }

  // ----------------------------------------------------------
  // INSTRUCTOR
  // ----------------------------------------------------------

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Instructor groups multiple of their own courses into a discounted bundle' })
  create(
    @CurrentUser('id') instructorId: string,
    @CurrentUser('stellarAddress') instructorAddress: string,
    @Body() dto: CreateBundleDto,
  ) {
    return this.bundlesService.create(instructorId, instructorAddress, dto);
  }

  // ----------------------------------------------------------
  // STUDENT
  // ----------------------------------------------------------

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Student enrolls in a bundle — enrolls into every included course in one transaction' })
  enroll(
    @Param('id') bundleId: string,
    @CurrentUser('id') studentId: string,
    @Body() dto: EnrollBundleDto,
  ) {
    return this.bundlesService.enroll(studentId, bundleId, dto);
  }
}
