import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';

export interface DataPoint {
  date: string;
  value: number | string;
  unit: string;
  isAbnormal: boolean;
  reportId: string;
  reportNumber: string;
  referenceRange?: { low: number | null; high: number | null };
}

interface TrendPoint {
  date: string;
  original: number;
  movingAverage: number;
  min: number;
  max: number;
  avg: number;
}

export interface DeltaItem {
  testName: string;
  previousValue: string;
  currentValue: string;
  unit: string;
  change: number;
  percentageChange: number;
  direction: 'up' | 'down' | 'stable';
  isAbnormal: boolean;
}

interface AbnormalTrend {
  testId: string;
  testName: string;
  trend: 'improving' | 'worsening' | 'stable';
  currentValue: string;
  previousValue: string;
  referenceRange: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

interface CategoryBreakdown {
  category: string;
  total: number;
  abnormal: number;
  percentage: number;
  tests: { testName: string; value: string; isAbnormal: boolean }[];
}

@Injectable()
export class HistoricalComparisonService {
  private readonly logger = new Logger(HistoricalComparisonService.name);

  constructor(private readonly prisma: PrismaService) {}

  async compareResults(
    patientId: string,
    testIds: string[],
    dateFrom?: string,
    dateTo?: string,
  ) {
    try {
      const where: any = {
        labTestId: { in: testIds },
        report: {
          patientId,
          status: { in: ['APPROVED', 'RELEASED'] },
        },
      };

      if (dateFrom || dateTo) {
        where.report.createdAt = {};
        if (dateFrom) where.report.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.report.createdAt.lte = new Date(dateTo);
      }

      const items = await (this.prisma as any).reportItem.findMany({
        where,
        orderBy: { report: { createdAt: 'asc' } },
        include: {
          report: { select: { id: true, reportNumber: true, createdAt: true } },
          labTest: { select: { id: true, nameAr: true, nameEn: true, units: true } },
        },
      });

      const grouped: Record<string, DataPoint[]> = {};
      for (const item of items) {
        if (!grouped[item.labTestId]) grouped[item.labTestId] = [];
        grouped[item.labTestId].push({
          date: item.report.createdAt.toISOString(),
          value: item.value,
          unit: item.unit || item.labTest?.units || '',
          isAbnormal: item.isAbnormal ?? false,
          reportId: item.report.id,
          reportNumber: item.report.reportNumber,
          referenceRange: {
            low: item.referenceRangeLow ?? null,
            high: item.referenceRangeHigh ?? null,
          },
        });
      }

      return {
        patientId,
        testIds,
        dateRange: { from: dateFrom ?? null, to: dateTo ?? null },
        results: grouped,
        totalDataPoints: items.length,
      };
    } catch (error) {
      this.logger.error(`compareResults failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getResultsByLabTest(patientId: string, labTestId: string, limit = 10) {
    try {
      const items = await (this.prisma as any).reportItem.findMany({
        where: {
          labTestId,
          report: { patientId, status: { in: ['APPROVED', 'RELEASED'] } },
        },
        orderBy: { report: { createdAt: 'desc' } },
        take: limit,
        include: {
          report: { select: { id: true, reportNumber: true, createdAt: true } },
          labTest: { select: { id: true, nameAr: true, nameEn: true, units: true } },
        },
      });

      return items.map((item: any) => ({
        date: item.report.createdAt.toISOString(),
        value: item.value,
        unit: item.unit || item.labTest?.units || '',
        isAbnormal: item.isAbnormal ?? false,
        reportId: item.report.id,
        reportNumber: item.report.reportNumber,
        referenceRange: {
          low: item.referenceRangeLow ?? null,
          high: item.referenceRangeHigh ?? null,
        },
      }));
    } catch (error) {
      this.logger.error(`getResultsByLabTest failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTrendData(patientId: string, labTestId: string, months = 6) {
    try {
      const since = new Date();
      since.setMonth(since.getMonth() - months);

      const items = await (this.prisma as any).reportItem.findMany({
        where: {
          labTestId,
          report: {
            patientId,
            status: { in: ['APPROVED', 'RELEASED'] },
            createdAt: { gte: since },
          },
        },
        orderBy: { report: { createdAt: 'asc' } },
        include: {
          report: { select: { id: true, createdAt: true } },
          labTest: { select: { id: true, nameAr: true, nameEn: true, units: true } },
        },
      });

      const values = items
        .map((i: any) => ({ date: i.report.createdAt, value: parseFloat(i.value) }))
        .filter((v: any) => !isNaN(v.value));

      if (values.length === 0) {
        return { labTestId, dataPoints: [], stats: { min: 0, max: 0, avg: 0, median: 0, count: 0 } };
      }

      const windowSize = Math.min(3, values.length);
      const trendData: TrendPoint[] = values.map((v: any, idx: number) => {
        const window = values.slice(Math.max(0, idx - Math.floor(windowSize / 2)), idx + Math.ceil(windowSize / 2));
        const vals = window.map((w: any) => w.value);
        const ma = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
        return {
          date: v.date.toISOString(),
          original: v.value,
          movingAverage: Math.round(ma * 100) / 100,
          min: Math.round(Math.min(...vals) * 100) / 100,
          max: Math.round(Math.max(...vals) * 100) / 100,
          avg: Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 100) / 100,
        };
      });

      const nums = values.map((v: any) => v.value);
      const stats = this.calculateStatistics(nums);

      return { labTestId, dataPoints: trendData, stats };
    } catch (error) {
      this.logger.error(`getTrendData failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDeltaComparison(reportId1: string, reportId2: string) {
    try {
      const [report1, report2] = await Promise.all([
        this.prisma.report.findUnique({
          where: { id: reportId1 },
          include: { items: { include: { labTest: true } } },
        }),
        this.prisma.report.findUnique({
          where: { id: reportId2 },
          include: { items: { include: { labTest: true } } },
        }),
      ]);

      if (!report1) throw new Error(`Report ${reportId1} not found`);
      if (!report2) throw new Error(`Report ${reportId2} not found`);

      const deltas: DeltaItem[] = [];
      for (const item1 of report1.items) {
        const item2 = report2.items.find(
          (i: any) => i.labTestId === item1.labTestId,
        );
        if (!item2) continue;

        const prevVal = parseFloat(item1.value);
        const currVal = parseFloat(item2.value);
        const change = !isNaN(prevVal) && !isNaN(currVal) ? currVal - prevVal : 0;
        const percentage = this.getPercentageChange(currVal, prevVal);

        deltas.push({
          testName: item1.labTest?.nameAr || item1.labTest?.nameEn || 'Unknown',
          previousValue: item1.value,
          currentValue: item2.value,
          unit: item1.unit || '',
          change: Math.round(change * 100) / 100,
          percentageChange: percentage,
          direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
          isAbnormal: item2.isAbnormal ?? false,
        });
      }

      return {
        report1: { id: reportId1, reportNumber: report1.reportNumber, date: report1.createdAt },
        report2: { id: reportId2, reportNumber: report2.reportNumber, date: report2.createdAt },
        deltas,
        summary: {
          totalCompared: deltas.length,
          increased: deltas.filter((d) => d.direction === 'up').length,
          decreased: deltas.filter((d) => d.direction === 'down').length,
          stable: deltas.filter((d) => d.direction === 'stable').length,
          abnormal: deltas.filter((d) => d.isAbnormal).length,
        },
      };
    } catch (error) {
      this.logger.error(`getDeltaComparison failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  getPercentageChange(currentValue: number, previousValue: number): number {
    if (previousValue === 0) return currentValue === 0 ? 0 : 100;
    return Math.round(((currentValue - previousValue) / Math.abs(previousValue)) * 10000) / 100;
  }

  async getAbnormalTrends(patientId: string, months = 3) {
    try {
      const since = new Date();
      since.setMonth(since.getMonth() - months);
      const midPoint = new Date();
      midPoint.setMonth(midPoint.getMonth() - Math.floor(months / 2));

      const items = await (this.prisma as any).reportItem.findMany({
        where: {
          report: {
            patientId,
            status: { in: ['APPROVED', 'RELEASED'] },
            createdAt: { gte: since },
          },
        },
        orderBy: { report: { createdAt: 'asc' } },
        include: {
          report: { select: { id: true, createdAt: true } },
          labTest: { select: { id: true, nameAr: true, nameEn: true, referenceRange: true } },
        },
      });

      const grouped: Record<string, any[]> = {};
      for (const item of items) {
        if (!grouped[item.labTestId]) grouped[item.labTestId] = [];
        grouped[item.labTestId].push(item);
      }

      const trends: AbnormalTrend[] = [];
      for (const [testId, testItems] of Object.entries(grouped)) {
        const sorted = testItems.sort(
          (a: any, b: any) => new Date(a.report.createdAt).getTime() - new Date(b.report.createdAt).getTime(),
        );
        if (sorted.length < 2) continue;

        const recent = sorted.slice(Math.max(0, sorted.length - 3));
        const firstHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
        const secondHalf = sorted.slice(Math.ceil(sorted.length / 2));

        const firstAvg = firstHalf.reduce((s: number, i: any) => s + (parseFloat(i.value) || 0), 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((s: number, i: any) => s + (parseFloat(i.value) || 0), 0) / secondHalf.length;
        const last = sorted[sorted.length - 1];
        const prev = sorted[sorted.length - 2];

        const isNumeric = !isNaN(parseFloat(last.value));
        const worsening = isNumeric && secondAvg > firstAvg * 1.1 && last.isAbnormal;
        const improving = isNumeric && secondAvg < firstAvg * 0.9 && !last.isAbnormal;
        const isAbnormalRecent = recent.some((r: any) => r.isAbnormal);

        const severity = isAbnormalRecent ? 'high' : worsening ? 'medium' : 'low';

        trends.push({
          testId,
          testName: last.labTest?.nameAr || last.labTest?.nameEn || 'Unknown',
          trend: worsening ? 'worsening' : improving ? 'improving' : 'stable',
          currentValue: last.value,
          previousValue: prev.value,
          referenceRange: last.labTest?.referenceRange
            ? `${last.labTest.referenceRange.male?.low ?? ''}-${last.labTest.referenceRange.male?.high ?? ''}`
            : `${last.referenceRangeLow ?? ''}-${last.referenceRangeHigh ?? ''}`,
          severity,
          recommendation: this.getTrendRecommendation(worsening, improving, last.isAbnormal),
        });
      }

      return {
        patientId,
        periodMonths: months,
        trends: trends.sort((a, b) => {
          const severityRank = { high: 3, medium: 2, low: 1 };
          return severityRank[b.severity] - severityRank[a.severity];
        }),
        summary: {
          total: trends.length,
          worsening: trends.filter((t) => t.trend === 'worsening').length,
          improving: trends.filter((t) => t.trend === 'improving').length,
          stable: trends.filter((t) => t.trend === 'stable').length,
          highSeverity: trends.filter((t) => t.severity === 'high').length,
        },
      };
    } catch (error) {
      this.logger.error(`getAbnormalTrends failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private getTrendRecommendation(
    worsening: boolean,
    improving: boolean,
    isAbnormal: boolean,
  ): string {
    if (worsening && isAbnormal) return 'مراجعة الطبيب فوراً - تدهور ملحوظ / Immediate review needed - significant deterioration';
    if (worsening) return 'مراقبة مستمرة - اتجاه للتدهور / Monitor closely - worsening trend';
    if (isAbnormal) return 'متابعة مع الطبيب / Follow up with doctor';
    return 'لا توجد توصيات خاصة / No special recommendations';
  }

  async getComparisonChartData(
    patientId: string,
    testIds: string[],
    dateFrom?: string,
    dateTo?: string,
  ) {
    try {
      const raw = await this.compareResults(patientId, testIds, dateFrom, dateTo);
      const datasets: any[] = [];
      const labels = new Set<string>();

      for (const [testId, points] of Object.entries(raw.results as Record<string, DataPoint[]>)) {
        const numericPoints = points
          .map((p) => ({ ...p, numValue: parseFloat(p.value as string) }))
          .filter((p) => !isNaN(p.numValue));

        numericPoints.forEach((p) => labels.add(p.date));

        const testName = await this.getTestName(testId);
        datasets.push({
          label: testName,
          data: numericPoints.map((p) => ({ x: p.date, y: p.numValue })),
          borderColor: this.getChartColor(datasets.length),
          backgroundColor: this.getChartColor(datasets.length, 0.1),
          pointBackgroundColor: numericPoints.map((p) =>
            p.isAbnormal ? '#dc2626' : '#1a5276',
          ),
          fill: false,
          tension: 0.3,
        });
      }

      return {
        type: 'line',
        labels: Array.from(labels).sort(),
        datasets,
        options: {
          responsive: true,
          interaction: { mode: 'index', intersect: false },
          scales: {
            y: { beginAtZero: false, title: { display: true, text: 'Value' } },
            x: { title: { display: true, text: 'Date' }, type: 'time' as const, time: { unit: 'day' as const } },
          },
          plugins: {
            legend: { position: 'top' as const },
            tooltip: {
              callbacks: {
                label: (ctx: any) => {
                  const point = ctx.raw;
                  return `${ctx.dataset.label}: ${point.y}${point.isAbnormal ? ' (ABNORMAL)' : ''}`;
                },
              },
            },
          },
        },
      };
    } catch (error) {
      this.logger.error(`getComparisonChartData failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async getTestName(testId: string): Promise<string> {
    try {
      const test = await (this.prisma as any).labTest.findUnique({
        where: { id: testId },
        select: { nameAr: true, nameEn: true },
      });
      return test?.nameAr || test?.nameEn || testId;
    } catch {
      return testId;
    }
  }

  async getPatientSummary(patientId: string) {
    try {
      const reports = await this.prisma.report.findMany({
        where: { patientId, status: { in: ['APPROVED', 'RELEASED'] } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          items: {
            include: { labTest: { select: { id: true, nameAr: true, nameEn: true, units: true } } },
          },
        },
      });

      const latestResults: Record<string, any> = {};
      const changes: any[] = [];

      for (const report of reports) {
        for (const item of report.items) {
          const key = item.labTestId;
          if (!latestResults[key]) {
            latestResults[key] = {
              testName: item.labTest?.nameAr || item.labTest?.nameEn || 'Unknown',
              latestValue: item.value,
              unit: item.unit || item.labTest?.units || '',
              isAbnormal: item.isAbnormal ?? false,
              latestDate: report.createdAt,
              reportNumber: report.reportNumber,
            };
          } else if (!latestResults[key].previousValue) {
            latestResults[key].previousValue = item.value;
            latestResults[key].previousDate = report.createdAt;
            const prev = parseFloat(item.value);
            const curr = parseFloat(latestResults[key].latestValue);
            if (!isNaN(prev) && !isNaN(curr)) {
              const change = this.getPercentageChange(curr, prev);
              latestResults[key].changePercentage = change;
              latestResults[key].trend = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';
            }
          }
        }
      }

      const results = Object.values(latestResults);
      const abnormalCount = results.filter((r: any) => r.isAbnormal).length;
      const improvedCount = results.filter((r: any) => r.trend === 'down' && r.isAbnormal).length;
      const worsenedCount = results.filter((r: any) => r.trend === 'up' && !r.isAbnormal).length;

      return {
        patientId,
        summaryDate: new Date().toISOString(),
        totalReports: reports.length,
        totalTestsTracked: results.length,
        abnormalResults: abnormalCount,
        improved: improvedCount,
        worsened: worsenedCount,
        results,
        lastReportDate: reports[0]?.createdAt?.toISOString() ?? null,
      };
    } catch (error) {
      this.logger.error(`getPatientSummary failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async exportComparisonAsCsv(
    patientId: string,
    testIds: string[],
    dateFrom?: string,
    dateTo?: string,
  ) {
    try {
      const raw = await this.compareResults(patientId, testIds, dateFrom, dateTo);
      const rows: string[] = ['Test Name,Date,Value,Unit,Reference Range,Abnormal,Report Number'];

      for (const [testId, points] of Object.entries(raw.results as Record<string, DataPoint[]>)) {
        const testName = await this.getTestName(testId);
        for (const point of points) {
          const refRange = point.referenceRange
            ? `${point.referenceRange.low ?? ''} - ${point.referenceRange.high ?? ''}`
            : 'N/A';
          rows.push(
            [
              `"${testName}"`,
              point.date,
              point.value,
              point.unit,
              `"${refRange}"`,
              point.isAbnormal ? 'Yes' : 'No',
              point.reportNumber,
            ].join(','),
          );
        }
      }

      const csv = rows.join('\n');
      return {
        filename: `comparison_${patientId}_${new Date().toISOString().split('T')[0]}.csv`,
        csv,
        mimeType: 'text/csv',
        totalRows: rows.length - 1,
      };
    } catch (error) {
      this.logger.error(`exportComparisonAsCsv failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTestCategoryBreakdown(
    patientId: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    try {
      const where: any = {
        patientId,
        status: { in: ['APPROVED', 'RELEASED'] },
      };
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const reports = await this.prisma.report.findMany({
        where,
        include: {
          items: {
            include: {
              labTest: { include: { category: true } },
            },
          },
        },
      });

      const categories: Record<string, CategoryBreakdown> = {};

      for (const report of reports) {
        for (const item of report.items) {
          const catName = item.labTest?.category?.nameAr || item.labTest?.category?.nameEn || 'Uncategorized';
          if (!categories[catName]) {
            categories[catName] = { category: catName, total: 0, abnormal: 0, percentage: 0, tests: [] };
          }
          categories[catName].total++;
          if (item.isAbnormal) categories[catName].abnormal++;
          categories[catName].tests.push({
            testName: item.labTest?.nameAr || item.labTest?.nameEn || 'Unknown',
            value: item.value,
            isAbnormal: item.isAbnormal ?? false,
          });
        }
      }

      const breakdown = Object.values(categories).map((c) => ({
        ...c,
        percentage: c.total > 0 ? Math.round((c.abnormal / c.total) * 10000) / 100 : 0,
      }));

      return {
        patientId,
        dateRange: { from: dateFrom ?? null, to: dateTo ?? null },
        categories: breakdown,
        summary: {
          totalCategories: breakdown.length,
          totalTests: breakdown.reduce((s, c) => s + c.total, 0),
          totalAbnormal: breakdown.reduce((s, c) => s + c.abnormal, 0),
        },
      };
    } catch (error) {
      this.logger.error(`getTestCategoryBreakdown failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  calculateStatistics(values: number[]) {
    if (!values || values.length === 0) {
      return { mean: 0, median: 0, stddev: 0, min: 0, max: 0, count: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const mean = sorted.reduce((a, b) => a + b, 0) / n;
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
    const variance = sorted.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
    const stddev = Math.sqrt(variance);

    return {
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      stddev: Math.round(stddev * 100) / 100,
      min: Math.round(sorted[0] * 100) / 100,
      max: Math.round(sorted[n - 1] * 100) / 100,
      count: n,
    };
  }

  private getChartColor(index: number, alpha = 1): string {
    const colors = [
      `rgba(26, 82, 118, ${alpha})`,
      `rgba(46, 134, 193, ${alpha})`,
      `rgba(5, 150, 105, ${alpha})`,
      `rgba(220, 38, 38, ${alpha})`,
      `rgba(245, 158, 11, ${alpha})`,
      `rgba(139, 92, 246, ${alpha})`,
      `rgba(236, 72, 153, ${alpha})`,
      `rgba(14, 165, 233, ${alpha})`,
    ];
    return colors[index % colors.length];
  }
}
