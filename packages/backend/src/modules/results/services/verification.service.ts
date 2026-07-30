import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly baseUrl: string;
  private readonly verificationPrefix = 'ALMOKHTABAR-V1';

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('VERIFICATION_BASE_URL', 'https://verify.almokhtabar.com');
  }

  async generateQrCode(data: string): Promise<string> {
    try {
      const qrDataUrl = await QRCode.toDataURL(data, {
        color: { dark: '#1a5276', light: '#ffffff' },
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H',
      });
      return qrDataUrl;
    } catch (error) {
      this.logger.error('QR code generation failed', error);
      throw new BadRequestException('Failed to generate QR code');
    }
  }

  async generateQrCodeBuffer(data: string): Promise<Buffer> {
    try {
      const buffer = await QRCode.toBuffer(data, {
        color: { dark: '#1a5276', light: '#ffffff' },
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H',
        type: 'png',
      });
      return buffer;
    } catch (error) {
      this.logger.error('QR code buffer generation failed', error);
      throw new BadRequestException('Failed to generate QR code buffer');
    }
  }

  async generateBarcode(data: string): Promise<string> {
    const barcodeContent = data.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
    const padded = barcodeContent.padEnd(12, '0').substring(0, 12);
    const checksum = this.calculateBarcodeChecksum(padded);
    const fullBarcode = `${padded}${checksum}`;
    const pattern = fullBarcode.split('').map((c) => {
      const code = c.charCodeAt(0);
      return code % 2 === 0 ? '|||' : '| |';
    }).join(' ');
    return pattern;
  }

  private calculateBarcodeChecksum(data: string): string {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i);
      sum += i % 2 === 0 ? charCode : charCode * 3;
    }
    const mod = (10 - (sum % 10)) % 10;
    return mod.toString();
  }

  async generateVerificationToken(reportId: string): Promise<{ token: string; expiresAt: Date; url: string }> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, reportNumber: true, patientId: true },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    const raw = `${this.verificationPrefix}:${report.id}:${report.reportNumber}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
    const token = crypto.createHash('sha256').update(raw).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    try {
      await (this.prisma as any).verificationToken.upsert({
        where: { reportId },
        update: { token, expiresAt },
        create: {
          reportId,
          token,
          expiresAt,
          createdAt: new Date(),
        },
      });
    } catch {
      await this.prisma.report.update({
        where: { id: reportId },
        data: { digitalSignature: token },
      });
    }

    const url = this.getVerificationUrl(report.id, token);

    this.logger.log(`Verification token generated for report ${report.reportNumber}`);
    return { token, expiresAt, url };
  }

  async verifyReport(token: string): Promise<{
    valid: boolean;
    report?: {
      id: string;
      reportNumber: string;
      status: string;
      createdAt: Date;
      releasedAt: Date | null;
      patientName: string;
      summary: string | null;
    };
    message: string;
  }> {
    let reportId: string | null = null;

    try {
      const stored = await (this.prisma as any).verificationToken?.findUnique({
        where: { token },
        include: { report: { include: { patient: true } } },
      });

      if (stored) {
        if (stored.expiresAt < new Date()) {
          return { valid: false, message: 'Verification token has expired' };
        }
        reportId = stored.reportId;
      } else {
        const report = await this.prisma.report.findFirst({
          where: { digitalSignature: token },
          include: { patient: true },
        });
        if (!report) {
          return { valid: false, message: 'Invalid verification token' };
        }
        reportId = report.id;
      }
    } catch {
      const report = await this.prisma.report.findFirst({
        where: { digitalSignature: token },
        include: { patient: true },
      });
      if (!report) {
        return { valid: false, message: 'Invalid verification token' };
      }
      reportId = report.id;
    }

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { patient: true },
    });

    if (!report) {
      return { valid: false, message: 'Report not found' };
    }

    const patientName = report.patient
      ? `${report.patient.firstNameEn || report.patient.firstNameAr || ''} ${report.patient.lastNameEn || report.patient.lastNameAr || ''}`
      : 'Unknown';

    return {
      valid: true,
      report: {
        id: report.id,
        reportNumber: report.reportNumber,
        status: report.status,
        createdAt: report.createdAt,
        releasedAt: report.releasedAt,
        patientName: patientName.trim() || 'Unknown',
        summary: report.summary,
      },
      message: 'Report verified successfully',
    };
  }

  getVerificationUrl(reportId: string, token: string): string {
    return `${this.baseUrl}/verify?token=${encodeURIComponent(token)}&reportId=${encodeURIComponent(reportId)}`;
  }

  async verifyQrCode(qrData: string): Promise<{
    valid: boolean;
    reportId?: string;
    reportNumber?: string;
    message: string;
  }> {
    try {
      const parsed = JSON.parse(qrData);

      if (parsed.token) {
        const result = await this.verifyReport(parsed.token);
        return {
          valid: result.valid,
          reportId: result.report?.id,
          reportNumber: result.report?.reportNumber,
          message: result.message,
        };
      }

      if (parsed.reportId && parsed.hash) {
        const report = await this.prisma.report.findUnique({
          where: { id: parsed.reportId },
          select: { id: true, reportNumber: true, digitalSignature: true },
        });

        if (!report) {
          return { valid: false, message: 'Report not found' };
        }

        const expectedHash = crypto
          .createHash('sha256')
          .update(`${report.id}:${report.reportNumber}:${this.verificationPrefix}`)
          .digest('hex');

        if (parsed.hash === expectedHash) {
          return {
            valid: true,
            reportId: report.id,
            reportNumber: report.reportNumber,
            message: 'QR code data verified successfully',
          };
        }

        return { valid: false, message: 'QR code data tampered or invalid' };
      }

      return { valid: false, message: 'Invalid QR code data format' };
    } catch (error) {
      this.logger.error('QR code verification failed', error);
      return { valid: false, message: 'Failed to parse QR code data' };
    }
  }

  generateSecureHash(reportId: string, patientId: string, timestamp: Date | string): string {
    const data = `${reportId}:${patientId}:${new Date(timestamp).toISOString()}:${this.verificationPrefix}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  generateQrData(report: {
    id: string;
    reportNumber: string;
    patientId: string;
    createdAt: Date;
    status: string;
  }): string {
    const hash = crypto
      .createHash('sha256')
      .update(`${report.id}:${report.reportNumber}:${this.verificationPrefix}`)
      .digest('hex');

    return JSON.stringify({
      prefix: this.verificationPrefix,
      reportId: report.id,
      reportNumber: report.reportNumber,
      patientId: report.patientId,
      hash,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
    });
  }
}
