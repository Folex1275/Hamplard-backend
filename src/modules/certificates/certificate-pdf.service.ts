import { Injectable, Logger } from '@nestjs/common';
import { CertificateTemplatesService } from './certificate-templates.service';
import {
  CertificateRenderData,
  CertificateTemplateConfig,
} from './certificate-template.types';

/**
 * Consumes the active certificate template for a course category and renders
 * a branded PDF. Template administration lives in CertificateTemplatesService;
 * this service is the integration point for certificate PDF generation.
 */
@Injectable()
export class CertificatePdfService {
  private readonly logger = new Logger(CertificatePdfService.name);

  constructor(private readonly templates: CertificateTemplatesService) {}

  async getActiveTemplate(category: string): Promise<CertificateTemplateConfig> {
    return this.templates.getActiveTemplateForCategory(category);
  }

  async renderForCategory(category: string, data: CertificateRenderData): Promise<Buffer> {
    const template = await this.templates.getActiveTemplateForCategory(category);
    this.logger.debug(`Rendering certificate PDF with template ${template.id} for category "${category}"`);
    return this.templates.renderPdf(template, {
      ...data,
      category: data.category ?? category,
    });
  }
}
