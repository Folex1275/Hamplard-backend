import {
  Injectable, BadRequestException, Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';

/** Allowed MIME types for KYC identity documents */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir: string;

  constructor(private readonly config: ConfigService) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR', './uploads');
    this.ensureDir(this.uploadDir);
    this.ensureDir(path.join(this.uploadDir, 'kyc'));
  }

  // ----------------------------------------------------------
  // KYC DOCUMENT UPLOAD
  // ----------------------------------------------------------

  /**
   * Validates and persists a KYC document file.
   * Returns the stored file path (relative URL served by the backend).
   */
  async saveKycDocument(
    file: Express.Multer.File,
    instructorId: string,
  ): Promise<string> {
    this.validateFile(file);

    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `kyc-${instructorId}-${uuid()}${ext}`;
    const filePath = path.join(this.uploadDir, 'kyc', filename);

    fs.writeFileSync(filePath, file.buffer);
    this.logger.log(`KYC document saved: ${filePath}`);

    // Return a URL-friendly path the frontend can reference
    return `/uploads/kyc/${filename}`;
  }

  // ----------------------------------------------------------
  // GENERAL FILE UPLOAD (course thumbnails, resources, etc.)
  // ----------------------------------------------------------

  async saveFile(
    file: Express.Multer.File,
    subfolder: string,
  ): Promise<string> {
    this.ensureDir(path.join(this.uploadDir, subfolder));

    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuid()}${ext}`;
    const filePath = path.join(this.uploadDir, subfolder, filename);

    fs.writeFileSync(filePath, file.buffer);
    this.logger.log(`File saved: ${filePath}`);

    return `/uploads/${subfolder}/${filename}`;
  }

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  private validateFile(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`,
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not allowed. Accepted types: JPEG, PNG, WebP, PDF`,
      );
    }
  }

  private ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
