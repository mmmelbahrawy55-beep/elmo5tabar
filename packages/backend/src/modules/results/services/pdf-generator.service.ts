import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';

interface PdfCell {
  text: string;
  options?: { align?: 'left' | 'center' | 'right'; color?: string; font?: string; fontSize?: number; bold?: boolean };
}

interface TableHeader {
  text: string;
  align?: 'left' | 'center' | 'right';
  width: number;
}

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);
  private readonly logoPath: string;
  private readonly primaryColor = '#1a5276';
  private readonly accentColor = '#2e86c1';
  private readonly textColor = '#2c3e50';
  private readonly lightGray = '#f8f9fa';
  private readonly borderColor = '#dee2e6';
  private readonly abnormalBg = '#fef2f2';
  private readonly abnormalText = '#dc2626';
  private readonly successColor = '#059669';

  constructor(private readonly prisma: PrismaService) {
    this.logoPath = path.join(__dirname, '..', '..', '..', 'assets', 'logo.png');
  }

  private formatDate(d: Date | string | undefined | null): string {
    if (!d) return 'N/A';
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private formatDateTime(d: Date | string | undefined | null): string {
    if (!d) return 'N/A';
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private getAbnormalStyle(item: any): { bgColor: string; textColor: string; isAbnormal: boolean } {
    const isAbnormal = item.isAbnormal === true;
    return {
      bgColor: isAbnormal ? this.abnormalBg : '#ffffff',
      textColor: isAbnormal ? this.abnormalText : this.textColor,
      isAbnormal,
    };
  }

  private drawHeader(doc: any, report: any): void {
    doc.rect(0, 0, doc.page.width, 120).fill(this.primaryColor);

    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(24)
      .text('AL MOKHTABAR', 50, 25);
    doc.font('Helvetica').fontSize(14)
      .text('Laboratory | \u0627\u0644\u0645\u062E\u062A\u0628\u0631', 50, 55);
    doc.fontSize(11).text('Medical Laboratory Report', 50, 80);

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff')
      .text(`Report #: ${report.reportNumber}`, 350, 30, { width: 200, align: 'right' });
    doc.font('Helvetica').fontSize(9)
      .text(`Issued: ${this.formatDate(report.createdAt)}`, 350, 45, { width: 200, align: 'right' })
      .text(`Status: ${report.status}`, 350, 60, { width: 200, align: 'right' });

    if (report.releasedAt) {
      doc.text(`Released: ${this.formatDateTime(report.releasedAt)}`, 350, 75, { width: 200, align: 'right' });
    }
  }

  private drawSectionTitle(doc: any, title: string, y: number): number {
    doc.fillColor(this.primaryColor).font('Helvetica-Bold').fontSize(12)
      .text(title, 50, y);
    doc.moveTo(50, y + 3).lineTo(545, y + 3).strokeColor(this.accentColor).lineWidth(2).stroke();
    return y + 18;
  }

  private drawPatientInfo(doc: any, patient: any, startY: number): number {
    const y = this.drawSectionTitle(doc, 'PATIENT INFORMATION', startY);
    const p = patient || {};
    const col1X = 50;
    const col2X = 280;
    let lineY = y;

    const leftCol = [
      [`Name (Ar):`, `${p.firstNameAr || ''} ${p.lastNameAr || ''}`],
      [`Name (En):`, `${p.firstNameEn || ''} ${p.lastNameEn || ''}`],
      [`Date of Birth:`, p.dateOfBirth ? this.formatDate(p.dateOfBirth) : 'N/A'],
      [`Gender:`, p.gender || 'N/A'],
    ];

    const rightCol = [
      [`Phone:`, p.phone || 'N/A'],
      [`Email:`, p.email || 'N/A'],
      [`National ID:`, p.nationalId || 'N/A'],
    ];

    leftCol.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(this.textColor).text(label, col1X, lineY, { width: 100 });
      doc.font('Helvetica').text(value, col1X + 85, lineY, { width: 130 });
      lineY += 15;
    });

    lineY = y;
    rightCol.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(this.textColor).text(label, col2X, lineY, { width: 80 });
      doc.font('Helvetica').text(value, col2X + 75, lineY, { width: 180 });
      lineY += 15;
    });

    return Math.max(y + leftCol.length * 15, y + rightCol.length * 15) + 5;
  }

  private drawOrderInfo(doc: any, order: any, startY: number): number {
    if (!order) return startY;
    const y = this.drawSectionTitle(doc, 'ORDER INFORMATION', startY);
    const items = [
      ['Order #:', order.orderNumber || 'N/A'],
      ['Priority:', order.priority || 'NORMAL'],
      ['Collection:', order.collectionType || 'N/A'],
    ];

    let lineY = y;
    items.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(this.textColor).text(label, 50, lineY, { width: 100 });
      doc.font('Helvetica').text(value, 150, lineY, { width: 200 });
      lineY += 15;
    });
    return lineY + 5;
  }

  private drawTableHeader(
    doc: any,
    headers: TableHeader[],
    colPositions: number[],
    y: number,
  ): void {
    doc.rect(45, y - 4, 510, 18).fill(this.lightGray);
    headers.forEach((h, i) => {
      doc.fillColor(this.primaryColor).font('Helvetica-Bold').fontSize(8)
        .text(h.text, colPositions[i], y, {
          width: h.width,
          align: h.align || 'left',
        });
    });
  }

  private drawTableRow(
    doc: any,
    cells: PdfCell[],
    colPositions: number[],
    widths: number[],
    y: number,
    isHighlighted: boolean,
  ): void {
    if (isHighlighted) {
      doc.rect(45, y - 2, 510, 16).fill(this.abnormalBg);
    }

    cells.forEach((cell, i) => {
      const color = cell.options?.color || this.textColor;
      doc.fillColor(color)
        .font(cell.options?.bold ? 'Helvetica-Bold' : cell.options?.font || 'Helvetica')
        .fontSize(cell.options?.fontSize || 9)
        .text(cell.text, colPositions[i], y, {
          width: widths[i],
          align: cell.options?.align || 'left',
        });
    });
  }

  private drawResultsTable(doc: any, items: any[], startY: number): number {
    const y = this.drawSectionTitle(doc, 'LABORATORY RESULTS', startY);
    const headers: TableHeader[] = [
      { text: '#', align: 'center', width: 30 },
      { text: 'Test Name', width: 180 },
      { text: 'Result', width: 65 },
      { text: 'Unit', width: 55 },
      { text: 'Reference Range', width: 115 },
      { text: 'Flag', width: 65 },
    ];
    const colPositions = [50, 80, 260, 325, 380, 495];
    const widths = [30, 180, 65, 55, 115, 65];

    let rowY = y;
    this.drawTableHeader(doc, headers, colPositions, rowY);
    rowY += 18;

    (items || []).forEach((item: any, idx: number) => {
      if (rowY > 720) {
        doc.addPage();
        rowY = 40;
        this.drawTableHeader(doc, headers, colPositions, rowY);
        rowY += 18;
      }

      const testName = item.labTest?.nameEn || item.labTest?.nameAr || `Test #${idx + 1}`;
      const flag = item.flags || '';
      const abnormal = this.getAbnormalStyle(item);
      const refRange = item.referenceRangeText ||
        (item.referenceRangeLow != null && item.referenceRangeHigh != null
          ? `${item.referenceRangeLow} \u2013 ${item.referenceRangeHigh}`
          : item.labTest?.referenceRange?.male?.low != null && item.labTest?.referenceRange?.male?.high != null
            ? `${item.labTest.referenceRange.male.low} \u2013 ${item.labTest.referenceRange.male.high}`
            : 'N/A');

      if (idx % 2 === 0 && !abnormal.isAbnormal) {
        doc.rect(45, rowY - 2, 510, 16).fill('#fafafa');
      }

      const cells: PdfCell[] = [
        { text: `${idx + 1}`, options: { align: 'center', color: this.textColor } },
        { text: testName, options: { color: this.textColor } },
        { text: item.value || item.numericValue?.toString() || '-', options: { color: abnormal.textColor, bold: abnormal.isAbnormal } },
        { text: item.unit || item.labTest?.units || '', options: { color: this.textColor } },
        { text: refRange, options: { color: this.textColor, fontSize: 8 } },
        { text: abnormal.isAbnormal ? (flag || 'ABN') : (flag || '-'), options: { color: abnormal.textColor, bold: abnormal.isAbnormal } },
      ];

      this.drawTableRow(doc, cells, colPositions, widths, rowY, abnormal.isAbnormal);
      rowY += 16;
    });

    return rowY + 10;
  }

  private drawSummarySection(doc: any, report: any, startY: number): number {
    let y = startY;
    if (report.summary) {
      y = this.drawSectionTitle(doc, 'SUMMARY', y) - 6;
      doc.fillColor(this.textColor).font('Helvetica').fontSize(9)
        .text(report.summary, 50, y, { width: 495, align: 'justify' });
      y = doc.y + 12;
    }
    if (report.conclusions) {
      y = this.drawSectionTitle(doc, 'CONCLUSIONS', y) - 6;
      doc.fillColor(this.textColor).font('Helvetica').fontSize(9)
        .text(report.conclusions, 50, y, { width: 495, align: 'justify' });
      y = doc.y + 12;
    }
    if (report.recommendations) {
      y = this.drawSectionTitle(doc, 'RECOMMENDATIONS', y) - 6;
      doc.fillColor(this.textColor).font('Helvetica').fontSize(9)
        .text(report.recommendations, 50, y, { width: 495, align: 'justify' });
      y = doc.y + 12;
    }
    return Math.max(y, startY + 10);
  }

  private drawSignatureBlock(doc: any, report: any): void {
    const pageHeight = doc.page.height;
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(this.borderColor).lineWidth(0.5).stroke();
    doc.y += 10;

    const sigY = doc.y;
    doc.fillColor(this.primaryColor).font('Helvetica-Bold').fontSize(9);

    if (report.reviewer) {
      doc.text('Reviewed by:', 50, sigY);
      doc.fillColor(this.textColor).font('Helvetica').fontSize(9)
        .text(`${report.reviewer.firstNameEn || ''} ${report.reviewer.lastNameEn || ''}`, 50, sigY + 12)
        .fontSize(8).fillColor('#6b7280')
        .text(report.reviewer.specialty || 'Laboratory Specialist', 50, sigY + 24);
    }

    if (report.approvedById) {
      doc.fillColor(this.primaryColor).font('Helvetica-Bold').fontSize(9)
        .text('Approved by:', 50, sigY + 40);
      doc.fillColor(this.textColor).font('Helvetica').fontSize(9)
        .text(report.reviewer?.firstNameEn ? `${report.reviewer.firstNameEn} ${report.reviewer.lastNameEn}` : `ID: ${report.approvedById}`, 50, sigY + 52);
    }

    if (report.digitalSignature) {
      doc.fillColor(this.accentColor).font('Helvetica-Oblique').fontSize(8)
        .text(`Digitally signed: ${report.digitalSignature.substring(0, 20)}...`, 280, sigY)
        .text(`Algorithm: ${report.signatureAlgorithm || 'SHA-256/RSA'}`, 280, sigY + 12);
      if (report.verifiedAt) {
        doc.text(`Verified: ${this.formatDateTime(report.verifiedAt)}`, 280, sigY + 24);
      }
    }

    doc.y = sigY + 75;
  }

  private drawFooter(doc: any, pageNumber: number, totalPages: number): void {
    const pageHeight = doc.page.height;
    doc.rect(0, pageHeight - 35, doc.page.width, 35).fill(this.primaryColor);

    doc.fillColor('#ffffff').font('Helvetica').fontSize(7);
    doc.text('Al Mokhtabar Laboratory | \u0627\u0644\u0645\u062E\u062A\u0628\u0631', 50, pageHeight - 28, { width: 200 });
    doc.text(`Page ${pageNumber} of ${totalPages}`, 450, pageHeight - 28, { width: 100, align: 'right' });
    doc.text('This is a computer-generated document. No signature is required.', 50, pageHeight - 16, { width: 495, align: 'center' });
  }

  private initDoc(report: any): any {
    return new (PDFDocument as any)({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 50, right: 50 },
      info: {
        Title: `Laboratory Report - ${report.reportNumber}`,
        Author: 'Al Mokhtabar Laboratory',
        Subject: 'Medical Laboratory Report',
        Keywords: `lab results, ${report.patient?.firstNameEn || ''} ${report.patient?.lastNameEn || ''}`,
      },
    });
  }

  async generateReportPdf(report: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = this.initDoc(report);
        const chunks: Buffer[] = [];
        let pageNumber = 0;
        let totalPages = 1;

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.on('pageAdded', () => {
          pageNumber++;
          this.drawFooter(doc, pageNumber, 0);
        });

        this.drawHeader(doc, report);

        let y = 140;
        y = this.drawPatientInfo(doc, report.patient, y);
        y = this.drawOrderInfo(doc, report.order, y);

        const items = report.items || [];
        y = this.drawResultsTable(doc, items, y);

        if (report.aiInsight) {
          doc.y = y;
          y = this.drawSectionTitle(doc, 'AI INSIGHTS', y) - 6;
          const insight = typeof report.aiInsight === 'string'
            ? JSON.parse(report.aiInsight)
            : report.aiInsight;
          doc.fillColor(this.textColor).font('Helvetica').fontSize(9)
            .text(insight.summary || JSON.stringify(insight), 50, y, { width: 495, align: 'justify' });
          if (report.aiConfidence != null) {
            doc.fillColor(this.accentColor).font('Helvetica-Oblique').fontSize(8)
              .text(`AI Confidence: ${(report.aiConfidence * 100).toFixed(1)}%`, 50, doc.y + 4);
          }
          y = doc.y + 14;
        }

        doc.y = y;
        y = this.drawSummarySection(doc, report, doc.y);
        doc.y = y;

        const attachments = report.attachments || [];
        if (attachments.length > 0) {
          doc.y = this.drawSectionTitle(doc, 'ATTACHMENTS', doc.y) - 6;
          attachments.forEach((att: any) => {
            doc.fillColor(this.textColor).font('Helvetica').fontSize(9)
              .text(`\u2022 ${att.fileName} (${att.fileType || 'unknown'})${att.description ? ` - ${att.description}` : ''}`, 50, doc.y, { width: 495 });
            doc.y += 13;
          });
        }

        this.drawSignatureBlock(doc, report);

        pageNumber = 1;
        totalPages = doc.bufferedPageRange ? doc.bufferedPageRange().count : 1;
        for (let i = 0; i < totalPages; i++) {
          doc.switchToPage(i);
          this.drawFooter(doc, i + 1, totalPages);
        }

        doc.end();
      } catch (error) {
        this.logger.error('PDF generation failed', error);
        reject(error);
      }
    });
  }

  async generateComparisonPdf(
    patient: any,
    tests: any[],
    historicalData: Record<string, any[]>,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new (PDFDocument as any)({
          size: 'A4',
          margins: { top: 40, bottom: 40, left: 50, right: 50 },
          info: {
            Title: `Comparative Analysis - ${patient?.firstNameEn || ''} ${patient?.lastNameEn || ''}`,
            Author: 'Al Mokhtabar Laboratory',
            Subject: 'Historical Test Comparison',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.rect(0, 0, doc.page.width, 100).fill(this.primaryColor);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22)
          .text('AL MOKHTABAR LABORATORY', 50, 25);
        doc.font('Helvetica').fontSize(12)
          .text('Comparative Historical Analysis', 50, 55);
        doc.fontSize(9).font('Helvetica')
          .text(`Patient: ${patient?.firstNameEn || ''} ${patient?.lastNameEn || ''}`, 50, 75);

        let y = 120;

        tests.forEach((test, testIdx) => {
          const dataPoints = historicalData[test.id] || [];
          if (dataPoints.length === 0) return;

          if (y > 700) {
            doc.addPage();
            y = 40;
          }

          doc.fillColor(this.primaryColor).font('Helvetica-Bold').fontSize(11)
            .text(`${testIdx + 1}. ${test.nameEn || test.nameAr} (${test.code || ''})`, 50, y);
          doc.moveTo(50, y + 3).lineTo(545, y + 3).strokeColor(this.accentColor).lineWidth(1).stroke();
          y += 14;

          const tableHeaders: TableHeader[] = [
            { text: 'Date', align: 'center', width: 80 },
            { text: 'Report #', width: 120 },
            { text: 'Value', align: 'center', width: 70 },
            { text: 'Unit', align: 'center', width: 55 },
            { text: 'Ref Range', width: 100 },
            { text: 'Trend', align: 'center', width: 75 },
          ];
          const colPos = [50, 130, 250, 320, 375, 475];
          const colWidths = [80, 120, 70, 55, 100, 75];

          this.drawTableHeader(doc, tableHeaders, colPos, y);
          y += 18;

          dataPoints.forEach((dp: any, idx: number) => {
            if (y > 720) {
              doc.addPage();
              y = 40;
              this.drawTableHeader(doc, tableHeaders, colPos, y);
              y += 18;
            }

            const isAbnormal = dp.isAbnormal === true;
            if (isAbnormal) {
              doc.rect(45, y - 2, 510, 16).fill(this.abnormalBg);
            } else if (idx % 2 === 0) {
              doc.rect(45, y - 2, 510, 16).fill('#fafafa');
            }

            let trend = '-';
            if (idx > 0) {
              const prevVal = parseFloat(dataPoints[idx - 1].value);
              const currVal = parseFloat(dp.value);
              if (!isNaN(prevVal) && !isNaN(currVal)) {
                if (currVal > prevVal) trend = '\u2191 Rising';
                else if (currVal < prevVal) trend = '\u2193 Falling';
                else trend = '\u2192 Stable';
              }
            }

            const cells: PdfCell[] = [
              { text: this.formatDate(dp.createdAt || dp.report?.createdAt), options: { align: 'center', color: this.textColor, fontSize: 8 } },
              { text: dp.report?.reportNumber || '-', options: { color: this.textColor, fontSize: 8 } },
              { text: dp.value || '-', options: { align: 'center', color: isAbnormal ? this.abnormalText : this.textColor, bold: isAbnormal } },
              { text: dp.unit || test.units || '', options: { align: 'center', color: this.textColor, fontSize: 8 } },
              { text: dp.referenceRangeText || `${dp.referenceRangeLow ?? ''} - ${dp.referenceRangeHigh ?? ''}`, options: { color: this.textColor, fontSize: 8 } },
              { text: trend, options: { align: 'center', color: trend.includes('Rising') ? this.abnormalText : this.successColor, fontSize: 8, bold: true } },
            ];

            this.drawTableRow(doc, cells, colPos, colWidths, y, isAbnormal);
            y += 16;
          });

          y += 20;
        });

        const totalPages = doc.bufferedPageRange ? doc.bufferedPageRange().count : 1;
        for (let i = 0; i < totalPages; i++) {
          doc.switchToPage(i);
          this.drawFooter(doc, i + 1, totalPages);
        }

        doc.end();
      } catch (error) {
        this.logger.error('Comparison PDF generation failed', error);
        reject(error);
      }
    });
  }

  async generateBatchPdf(reports: any[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new (PDFDocument as any)({
          size: 'A4',
          margins: { top: 40, bottom: 40, left: 50, right: 50 },
          info: {
            Title: 'Batch Laboratory Reports',
            Author: 'Al Mokhtabar Laboratory',
            Subject: 'Consolidated Laboratory Reports',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.rect(0, 0, doc.page.width, 100).fill(this.primaryColor);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22)
          .text('AL MOKHTABAR LABORATORY', 50, 25);
        doc.font('Helvetica').fontSize(12)
          .text('Batch Report Summary', 50, 55);
        doc.fontSize(9)
          .text(`Generated: ${this.formatDateTime(new Date())} | Reports: ${reports.length}`, 50, 75);

        let y = 120;

        const summaryHeaders: TableHeader[] = [
          { text: '#', align: 'center', width: 30 },
          { text: 'Report #', width: 120 },
          { text: 'Patient', width: 140 },
          { text: 'Status', align: 'center', width: 70 },
          { text: 'Items', align: 'center', width: 40 },
          { text: 'Abnormal', align: 'center', width: 55 },
          { text: 'Date', width: 65 },
        ];
        const sumColPos = [50, 80, 200, 340, 410, 450, 505];
        const sumWidths = [30, 120, 140, 70, 40, 55, 65];

        this.drawTableHeader(doc, summaryHeaders, sumColPos, y);
        y += 18;

        reports.forEach((rpt, idx) => {
          if (y > 720) {
            doc.addPage();
            y = 40;
            this.drawTableHeader(doc, summaryHeaders, sumColPos, y);
            y += 18;
          }

          if (idx % 2 === 0) {
            doc.rect(45, y - 2, 510, 16).fill('#fafafa');
          }

          const patientName = rpt.patient
            ? `${rpt.patient.firstNameEn || rpt.patient.firstNameAr || ''} ${rpt.patient.lastNameEn || rpt.patient.lastNameAr || ''}`
            : 'N/A';
          const abnormalCount = (rpt.items || []).filter((i: any) => i.isAbnormal).length;

          const cells: PdfCell[] = [
            { text: `${idx + 1}`, options: { align: 'center', color: this.textColor } },
            { text: rpt.reportNumber || '-', options: { color: this.textColor, fontSize: 8 } },
            { text: patientName, options: { color: this.textColor, fontSize: 8 } },
            { text: rpt.status || '-', options: { align: 'center', color: rpt.status === 'RELEASED' ? this.successColor : this.textColor, fontSize: 8, bold: true } },
            { text: `${(rpt.items || []).length}`, options: { align: 'center', color: this.textColor, fontSize: 8 } },
            { text: abnormalCount > 0 ? `${abnormalCount}` : '0', options: { align: 'center', color: abnormalCount > 0 ? this.abnormalText : this.textColor, bold: abnormalCount > 0 } },
            { text: this.formatDate(rpt.createdAt), options: { color: this.textColor, fontSize: 7 } },
          ];

          this.drawTableRow(doc, cells, sumColPos, sumWidths, y, false);
          y += 16;
        });

        y += 15;
        doc.fillColor(this.primaryColor).font('Helvetica-Bold').fontSize(10)
          .text('Summary', 50, y);
        doc.moveTo(50, y + 3).lineTo(545, y + 3).strokeColor(this.accentColor).lineWidth(1).stroke();
        y += 15;

        const totalItems = reports.reduce((sum, r) => sum + (r.items || []).length, 0);
        const totalAbnormal = reports.reduce((sum, r) => sum + (r.items || []).filter((i: any) => i.isAbnormal).length, 0);
        const releasedCount = reports.filter((r) => r.status === 'RELEASED').length;

        doc.fillColor(this.textColor).font('Helvetica').fontSize(9);
        doc.text(`Total Reports: ${reports.length}`, 50, y);
        doc.text(`Total Test Items: ${totalItems}`, 50, y + 14);
        doc.text(`Abnormal Results: ${totalAbnormal}`, 50, y + 28);
        doc.text(`Released Reports: ${releasedCount}`, 50, y + 42);
        doc.text(`Generated by: Al Mokhtabar Laboratory System`, 50, y + 56);

        const totalPages = doc.bufferedPageRange ? doc.bufferedPageRange().count : 1;
        for (let i = 0; i < totalPages; i++) {
          doc.switchToPage(i);
          this.drawFooter(doc, i + 1, totalPages);
        }

        doc.end();
      } catch (error) {
        this.logger.error('Batch PDF generation failed', error);
        reject(error);
      }
    });
  }

  async embedDigitalSignature(
    pdfBuffer: Buffer,
    signature: string,
    algorithm: string,
  ): Promise<Buffer> {
    const signatureBlock = Buffer.from(
      `\n---DIGITAL SIGNATURE---\nSignature: ${signature}\nAlgorithm: ${algorithm}\nTimestamp: ${new Date().toISOString()}\n---END DIGITAL SIGNATURE---\n`,
      'utf-8',
    );
    return Buffer.concat([pdfBuffer, signatureBlock]);
  }

  async encryptPdf(pdfBuffer: Buffer, password: string): Promise<Buffer> {
    const prefix = Buffer.from(`ENCRYPTED_PDF_META:${password}:`);
    const lengthBuf = Buffer.alloc(4);
    lengthBuf.writeUInt32BE(pdfBuffer.length);
    return Buffer.concat([prefix, lengthBuf, pdfBuffer]);
  }
}


