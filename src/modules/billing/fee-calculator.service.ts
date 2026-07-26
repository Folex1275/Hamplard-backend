// fee-calculator.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';

export interface FeeBreakdown {
  currency: string;
  basePrice: number;
  platformFeePercent: number;
  platformFeeAmount: number;
  instructorPayout: number;
  region: string;
  taxRatePercent: number;
  taxAmount: number;
  totalPayable: number;
}

@Injectable()
export class FeeCalculatorService {
  private readonly logger = new Logger(FeeCalculatorService.name);

  /** Configurable regional tax rates (percent). Extend as new regions launch. */
  private readonly taxRatesByRegion: Record<string, number> = {
    NG: 7.5,   // Nigeria VAT
    US: 0,     // no federal sales tax on digital goods by default
    GB: 20,    // UK VAT
    EU: 21,    // EU standard VAT (approximate)
    DEFAULT: 0,
  };

  /**
   * Looks up the tax rate for a region, falling back to the default rate
   * (with a warning) if the region has no configured rate rather than
   * failing checkout outright.
   */
  getTaxRate(region?: string): number {
    const key = (region ?? 'DEFAULT').toUpperCase();
    if (!(key in this.taxRatesByRegion)) {
      this.logger.warn(`No tax rate configured for region "${region}", falling back to default`);
      return this.taxRatesByRegion.DEFAULT;
    }
    return this.taxRatesByRegion[key];
  }

  /** Rounds to 2 decimal places, the smallest unit tracked for USDC amounts. */
  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  computeBreakdown(params: {
    coursePrice: number;
    platformFeePercent: number;
    region?: string;
  }): FeeBreakdown {
    const { coursePrice, platformFeePercent, region } = params;

    if (coursePrice < 0) {
      throw new BadRequestException('Course price cannot be negative');
    }
    if (platformFeePercent < 0 || platformFeePercent > 100) {
      throw new BadRequestException('Platform fee percent must be between 0 and 100');
    }

    const taxRatePercent = this.getTaxRate(region);
    const platformFeeAmount = this.round(coursePrice * (platformFeePercent / 100));
    const instructorPayout = this.round(coursePrice - platformFeeAmount);
    const taxAmount = this.round(coursePrice * (taxRatePercent / 100));
    const totalPayable = this.round(coursePrice + taxAmount);

    return {
      currency: 'USDC',
      basePrice: this.round(coursePrice),
      platformFeePercent,
      platformFeeAmount,
      instructorPayout,
      region: (region ?? 'DEFAULT').toUpperCase(),
      taxRatePercent,
      taxAmount,
      totalPayable,
    };
  }
}
