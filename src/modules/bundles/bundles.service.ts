// bundles.service.ts
import {
  Injectable, NotFoundException, BadRequestException,
  ConflictException, ForbiddenException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { EnrollBundleDto } from './dto/enroll-bundle.dto';

@Injectable()
export class BundlesService {
  private readonly logger = new Logger(BundlesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------------
  // CREATE
  // ----------------------------------------------------------

  async create(instructorId: string, instructorAddress: string, dto: CreateBundleDto) {
    const courses = await this.prisma.course.findMany({
      where: { id: { in: dto.courseIds } },
    });

    if (courses.length !== dto.courseIds.length) {
      throw new NotFoundException('One or more courses in the bundle were not found');
    }
    const foreignCourse = courses.find((c) => c.instructorAddress !== instructorAddress);
    if (foreignCourse) {
      throw new ForbiddenException('You can only bundle courses you own');
    }

    const individualTotal = courses.reduce((sum, c) => sum + Number(c.price), 0);
    if (dto.price >= individualTotal) {
      throw new BadRequestException(
        `Bundle price (${dto.price}) must be less than the sum of individual course prices (${individualTotal})`,
      );
    }

    const bundle = await this.prisma.bundle.create({
      data: {
        instructorAddress,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        thumbnailUrl: dto.thumbnailUrl,
        courses: {
          create: dto.courseIds.map((courseId) => ({ courseId })),
        },
      },
      include: { courses: { include: { course: true } } },
    });

    this.logger.log(`Bundle created: ${bundle.id} by ${instructorAddress}`);
    return bundle;
  }

  // ----------------------------------------------------------
  // READ
  // ----------------------------------------------------------

  async findAll(filters: { instructorAddress?: string; page?: number; limit?: number }) {
    const { instructorAddress, page = 1, limit = 20 } = filters;
    const where: any = { isActive: true };
    if (instructorAddress) where.instructorAddress = instructorAddress;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.bundle.findMany({
        where,
        include: {
          courses: { include: { course: { select: { id: true, title: true, price: true, thumbnailUrl: true } } } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bundle.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const bundle = await this.prisma.bundle.findUnique({
      where: { id },
      include: {
        courses: { include: { course: true } },
        instructor: { select: { name: true, avatarUrl: true, stellarAddress: true } },
        _count: { select: { enrollments: true } },
      },
    });
    if (!bundle) throw new NotFoundException('Bundle not found');
    return bundle;
  }

  // ----------------------------------------------------------
  // ENROLL — single transaction across bundle + each included course
  // ----------------------------------------------------------

  async enroll(studentId: string, bundleId: string, dto: EnrollBundleDto) {
    const bundle = await this.findOne(bundleId);
    if (!bundle.isActive) throw new BadRequestException('This bundle is no longer available');

    const existing = await this.prisma.bundleEnrollment.findUnique({
      where: { bundleId_studentId: { bundleId, studentId } },
    });
    if (existing) throw new ConflictException('Already enrolled in this bundle');

    if (dto.amountPaid < Number(bundle.price)) {
      throw new BadRequestException(
        `Amount paid (${dto.amountPaid}) is less than the bundle price (${bundle.price})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const bundleEnrollment = await tx.bundleEnrollment.create({
        data: { bundleId, studentId, amountPaid: dto.amountPaid, txHash: dto.txHash },
      });

      for (const { course } of bundle.courses) {
        const alreadyEnrolled = await tx.enrollment.findUnique({
          where: { studentId_courseId: { studentId, courseId: course.id } },
        });
        if (alreadyEnrolled) continue;

        await tx.enrollment.create({
          data: {
            studentId,
            courseId: course.id,
            amountPaid: course.price,
            txHash: dto.txHash,
          },
        });
        await tx.course.update({
          where: { id: course.id },
          data: {
            totalEnrollments: { increment: 1 },
            totalRevenue: { increment: course.price },
          },
        });
      }

      this.logger.log(`Bundle enrollment: ${studentId} → ${bundleId}`);
      return bundleEnrollment;
    });
  }
}
