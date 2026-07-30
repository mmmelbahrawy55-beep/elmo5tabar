import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

interface ItemExplanation {
  testId: string;
  testName: string;
  value: string;
  numericValue: number | null;
  unit: string;
  referenceRange: string;
  interpretation: string;
  isAbnormal: boolean;
  abnormalityType: string | null;
  explanation: string;
  implication: string;
  recommendation: string;
}

interface SummaryExplanation {
  reportId: string;
  reportNumber: string;
  summary: string;
  keyFindings: string[];
  patientFriendlySummary: string;
  followUpRecommendations: string[];
}

interface AiInsight {
  summary: string;
  explanations: ItemExplanation[];
  keyFindings: string[];
  recommendations: string[];
  confidence: number;
  generatedAt: string;
  language: string;
}

interface TrendExplanation {
  testId: string;
  testName: string;
  dataPoints: { date: string; value: number; isAbnormal: boolean }[];
  trend: 'RISING' | 'FALLING' | 'STABLE' | 'FLUCTUATING';
  percentageChange: number;
  explanation: string;
  clinicalSignificance: string;
}

@Injectable()
export class AiExplanationService {
  private readonly logger = new Logger(AiExplanationService.name);
  private readonly useAiService: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.useAiService = this.config.get<boolean>('AI_EXPLANATION_ENABLED', false);
  }

  async explainResult(reportId: string, language: string = 'en'): Promise<AiInsight> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        items: {
          orderBy: { displayOrder: 'asc' },
          include: { labTest: true },
        },
        patient: true,
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    const explanations: ItemExplanation[] = [];
    const keyFindings: string[] = [];
    let recommendations: string[] = [];

    for (const item of report.items) {
      if (!item.labTest) continue;

      const explanation = this.generateItemExplanation(item, item.labTest, report.patient, language);
      explanations.push(explanation);

      if (explanation.isAbnormal) {
        keyFindings.push(explanation.explanation);
      }
    }

    const summary = this.generateSummary(report, language);
    recommendations = this.getRecommendations(report);
    const confidence = this.getConfidenceScore(report);

    const insight: AiInsight = {
      summary: summary.patientFriendlySummary,
      explanations,
      keyFindings: keyFindings.length > 0 ? keyFindings : ['All results are within normal range.'],
      recommendations,
      confidence,
      generatedAt: new Date().toISOString(),
      language,
    };

    await this.storeAiInsight(reportId, insight, confidence);

    return insight;
  }

  generateItemExplanation(item: any, labTest: any, patient: any, language: string): ItemExplanation {
    const value = item.value || item.numericValue?.toString() || '';
    const numericValue = item.numericValue;
    const unit = item.unit || labTest.units || '';

    const refRange = this.formatReferenceRange(item, labTest);
    const interpretation = this.getReferenceRangeInterpretation(numericValue, item, labTest);
    const isAbnormal = item.isAbnormal || interpretation.includes('abnormal') || interpretation.includes('elevated') || interpretation.includes('low');

    let explanation: string;
    let implication: string;
    let recommendation: string;

    if (isAbnormal) {
      const abnormalInfo = this.getAbnormalExplanation(item, labTest);
      explanation = abnormalInfo.explanation;
      implication = abnormalInfo.implication;
      recommendation = abnormalInfo.recommendation;
    } else {
      explanation = language === 'ar'
        ? `نتيجة ${labTest.nameAr || 'التحليل'} طبيعية ضمن النطاق المرجعي`
        : `${labTest.nameEn || 'Test'} result is normal and within the reference range.`;
      implication = language === 'ar'
        ? 'لا توجد مؤشرات على وجود مشكلة صحية مرتبطة بهذا التحليل'
        : 'No indications of health issues related to this test.';
      recommendation = language === 'ar'
        ? 'استمر في نمط حياتك الحالي والفحوصات الدورية'
        : 'Continue with your current lifestyle and regular checkups.';
    }

    return {
      testId: labTest.id,
      testName: language === 'ar' ? (labTest.nameAr || labTest.nameEn) : (labTest.nameEn || labTest.nameAr),
      value,
      numericValue,
      unit,
      referenceRange: refRange,
      interpretation,
      isAbnormal,
      abnormalityType: item.abnormalityType || null,
      explanation,
      implication,
      recommendation,
    };
  }

  generateSummary(report: any, language: string): SummaryExplanation {
    const items = report.items || [];
    const abnormalItems = items.filter((i: any) => i.isAbnormal);
    const totalItems = items.length;
    const abnormalCount = abnormalItems.length;

    let summary: string;
    let patientFriendlySummary: string;
    const keyFindings: string[] = [];

    if (abnormalCount === 0) {
      summary = `All ${totalItems} test results are within normal reference ranges. No abnormalities detected.`;
      patientFriendlySummary = language === 'ar'
        ? `جميع نتائج التحاليل (${totalItems}) طبيعية ولا توجد أي مؤشرات غير طبيعية.`
        : `All ${totalItems} test results are normal. No abnormal findings detected.`;
    } else {
      const abnormalNames = abnormalItems.map((i: any) =>
        language === 'ar' ? (i.labTest?.nameAr || 'تحليل') : (i.labTest?.nameEn || 'test')
      );
      summary = `${abnormalCount} out of ${totalItems} test results are abnormal. Abnormal tests: ${abnormalNames.join(', ')}.`;
      patientFriendlySummary = language === 'ar'
        ? `تم اكتشاف ${abnormalCount} نتيجة غير طبيعية من أصل ${totalItems} تحليل. التحاليل غير الطبيعية: ${abnormalNames.join('، ')}.`
        : `${abnormalCount} out of ${totalItems} test result(s) are outside the normal range. Affected test(s): ${abnormalNames.join(', ')}.`;
      keyFindings.push(...abnormalNames.map((n: string) =>
        language === 'ar' ? `نتيجة غير طبيعية في ${n}` : `Abnormal result in ${n}`
      ));
    }

    if (report.summary) {
      summary = report.summary;
    }

    return {
      reportId: report.id,
      reportNumber: report.reportNumber,
      summary,
      keyFindings: keyFindings.length > 0 ? keyFindings : ['All results normal'],
      patientFriendlySummary,
      followUpRecommendations: this.getRecommendations(report),
    };
  }

  getReferenceRangeInterpretation(value: number | null, item: any, labTest: any): string {
    if (value == null) return 'No numeric value provided for interpretation.';

    const refLow = item.referenceRangeLow;
    const refHigh = item.referenceRangeHigh;

    if (refLow != null && refHigh != null) {
      const rangeSpan = refHigh - refLow;
      const midPoint = (refLow + refHigh) / 2;

      if (value >= refLow && value <= refHigh) {
        const percentFromMid = ((value - midPoint) / rangeSpan) * 100;
        if (Math.abs(percentFromMid) < 25) return 'within normal range (near midpoint)';
        if (value < midPoint) return 'within normal range (lower end)';
        return 'within normal range (upper end)';
      }

      if (value < refLow) {
        const deviation = ((refLow - value) / rangeSpan) * 100;
        if (deviation < 25) return 'slightly below normal range';
        if (deviation < 50) return 'moderately below normal range';
        return 'significantly below normal range';
      }

      if (value > refHigh) {
        const deviation = ((value - refHigh) / rangeSpan) * 100;
        if (deviation < 25) return 'slightly elevated above normal range';
        if (deviation < 50) return 'moderately elevated above normal range';
        return 'significantly elevated above normal range';
      }
    }

    if (refLow == null && refHigh != null) {
      return value > refHigh ? 'exceeds maximum threshold' : 'within acceptable range';
    }
    if (refLow != null && refHigh == null) {
      return value < refLow ? 'below minimum threshold' : 'within acceptable range';
    }

    return 'interpretation unavailable (no reference range defined)';
  }

  getAbnormalExplanation(item: any, labTest: any): { explanation: string; implication: string; recommendation: string } {
    const testName = labTest.nameEn || labTest.nameAr || 'This test';
    const value = item.value || item.numericValue?.toString() || '';
    const low = item.referenceRangeLow;
    const high = item.referenceRangeHigh;
    const numericValue = item.numericValue;

    let explanation: string;
    let implication: string;
    let recommendation: string;

    if (numericValue != null && low != null && numericValue < low) {
      explanation = `${testName} is below the normal range (${value} vs normal low of ${low}). This indicates a lower than expected concentration.`;
      implication = `Low ${testName} levels may indicate potential deficiency, malabsorption, or underlying health conditions that require medical evaluation.`;
      recommendation = `Consult with your healthcare provider about the low ${testName} results. Additional diagnostic tests may be recommended to determine the underlying cause.`;
    } else if (numericValue != null && high != null && numericValue > high) {
      explanation = `${testName} is above the normal range (${value} vs normal high of ${high}). This indicates a higher than expected concentration.`;
      implication = `Elevated ${testName} levels may indicate an underlying condition, infection, inflammation, or metabolic disorder that requires medical attention.`;
      recommendation = `Consult with your healthcare provider about the elevated ${testName} results. Further evaluation and possibly additional testing may be necessary.`;
    } else if (item.abnormalityType) {
      explanation = `${testName} result (${value}) has been flagged as ${item.abnormalityType}.`;
      implication = `${testName} shows an abnormal pattern that may require clinical correlation.`;
      recommendation = `Please discuss these results with your healthcare provider for proper clinical interpretation.`;
    } else {
      explanation = `${testName} result (${value}) is outside the expected reference range.`;
      implication = `Abnormal ${testName} levels may be related to various health conditions and should be evaluated by a healthcare professional.`;
      recommendation = `Medical follow-up is recommended to interpret these results in the context of your overall health.`;
    }

    return { explanation, implication, recommendation };
  }

  getRecommendations(report: any): string[] {
    const recommendations: string[] = [];
    const items = report.items || [];
    const abnormalItems = items.filter((i: any) => i.isAbnormal);

    if (abnormalItems.length === 0) {
      recommendations.push('Continue regular health checkups and maintain a healthy lifestyle.');
      recommendations.push('No immediate follow-up required for these results.');
      return recommendations;
    }

    recommendations.push(`Follow up with your healthcare provider to discuss the ${abnormalItems.length} abnormal result(s).`);

    const hasCritical = abnormalItems.some((i: any) => {
      if (i.numericValue == null) return false;
      const low = i.referenceRangeLow;
      const high = i.referenceRangeHigh;
      if (low != null && high != null) {
        const rangeSpan = high - low;
        return i.numericValue < low - rangeSpan || i.numericValue > high + rangeSpan;
      }
      return false;
    });

    if (hasCritical) {
      recommendations.push('URGENT: Some results are significantly abnormal. Immediate medical attention may be required.');
    }

    recommendations.push('Additional confirmatory tests may be recommended by your healthcare provider.');
    recommendations.push('Bring previous lab reports for comparison during your medical consultation.');

    if (report.recommendations) {
      const existingRecs = report.recommendations.split('\n').filter((r: string) => r.trim());
      recommendations.push(...existingRecs);
    }

    return recommendations;
  }

  explainTrend(comparisons: { testId: string; testName: string; unit: string; dataPoints: { date: Date; value: number; isAbnormal: boolean }[] }[]): TrendExplanation[] {
    return comparisons.map((comparison) => {
      const values = comparison.dataPoints.map((dp) => dp.value);
      const dataPoints = comparison.dataPoints.map((dp) => ({
        date: dp.date.toISOString(),
        value: dp.value,
        isAbnormal: dp.isAbnormal,
      }));

      if (values.length < 2) {
        return {
          testId: comparison.testId,
          testName: comparison.testName,
          dataPoints,
          trend: 'STABLE',
          percentageChange: 0,
          explanation: `Only one data point available for ${comparison.testName}. Unable to determine trend.`,
          clinicalSignificance: 'Additional measurements needed to assess trend.',
        };
      }

      const first = values[0];
      const last = values[values.length - 1];
      const percentageChange = first !== 0 ? Math.round(((last - first) / Math.abs(first)) * 100 * 100) / 100 : 0;

      let trend: 'RISING' | 'FALLING' | 'STABLE' | 'FLUCTUATING';
      if (Math.abs(percentageChange) < 5) {
        trend = 'STABLE';
      } else if (percentageChange > 0) {
        trend = 'RISING';
      } else {
        trend = 'FALLING';
      }

      const variance = Math.max(...values) - Math.min(...values);
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      if (variance / mean > 0.3) {
        trend = 'FLUCTUATING';
      }

      let explanation: string;
      let clinicalSignificance: string;

      switch (trend) {
        case 'RISING':
          explanation = `${comparison.testName} has been increasing by ${Math.abs(percentageChange)}% over the measured period.`;
          clinicalSignificance = 'A rising trend may indicate disease progression, worsening condition, or treatment ineffectiveness. Medical evaluation recommended.';
          break;
        case 'FALLING':
          explanation = `${comparison.testName} has been decreasing by ${Math.abs(percentageChange)}% over the measured period.`;
          clinicalSignificance = 'A falling trend may indicate improvement with treatment, or in some cases, developing deficiency. Correlation with clinical picture is needed.';
          break;
        case 'FLUCTUATING':
          explanation = `${comparison.testName} shows significant fluctuation of ${Math.round(variance * 100) / 100} ${comparison.unit} between measurements.`;
          clinicalSignificance = 'Fluctuating values may be due to laboratory variability, biological rhythms, or intermittent health conditions. Consider more frequent monitoring.';
          break;
        default:
          explanation = `${comparison.testName} levels remain stable within a narrow range.`;
          clinicalSignificance = 'Stable values suggest consistent health status and effective management if under treatment.';
      }

      const abnormalCount = comparison.dataPoints.filter((dp) => dp.isAbnormal).length;
      if (abnormalCount > 0) {
        clinicalSignificance += ` ${abnormalCount} out of ${comparison.dataPoints.length} measurements were flagged as abnormal.`;
      }

      return {
        testId: comparison.testId,
        testName: comparison.testName,
        dataPoints,
        trend,
        percentageChange,
        explanation,
        clinicalSignificance,
      };
    });
  }

  async storeAiInsight(reportId: string, insight: AiInsight, confidence: number): Promise<void> {
    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        aiInsight: insight as any,
        aiConfidence: confidence,
      },
    });

    this.logger.log(`AI insight stored for report ${reportId} (confidence: ${confidence})`);
  }

  async getInsightHistory(patientId: string): Promise<AiInsight[]> {
    const reports = await this.prisma.report.findMany({
      where: {
        patientId,
        aiInsight: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reportNumber: true,
        aiInsight: true,
        aiConfidence: true,
        createdAt: true,
      },
    });

    return reports
      .filter((r) => r.aiInsight)
      .map((r) => {
        const insight = r.aiInsight as unknown as AiInsight;
        return {
          ...insight,
          reportId: r.id,
          reportNumber: r.reportNumber,
          generatedAt: r.createdAt.toISOString(),
        };
      });
  }

  getConfidenceScore(report: any): number {
    if (report.aiConfidence != null) {
      return report.aiConfidence;
    }

    const items = report.items || [];
    if (items.length === 0) return 0.3;

    let score = 0.7;
    let factors = 0;

    const hasNumericValues = items.some((i: any) => i.numericValue != null);
    if (hasNumericValues) {
      score += 0.15;
      factors++;
    }

    const hasReferenceRanges = items.some((i: any) => i.referenceRangeLow != null && i.referenceRangeHigh != null);
    if (hasReferenceRanges) {
      score += 0.1;
      factors++;
    }

    const hasLabTest = items.some((i: any) => i.labTest);
    if (hasLabTest) {
      score += 0.05;
      factors++;
    }

    if (factors > 0 && score > 1) score = 1;

    return Math.round(score * 100) / 100;
  }

  private formatReferenceRange(item: any, labTest: any): string {
    if (item.referenceRangeLow != null && item.referenceRangeHigh != null) {
      return `${item.referenceRangeLow} - ${item.referenceRangeHigh} ${item.unit || labTest.units || ''}`;
    }
    if (labTest.referenceRange) {
      let range = labTest.referenceRange;
      if (typeof range === 'string') {
        try { range = JSON.parse(range); } catch { return 'N/A'; }
      }
      const low = range.low ?? range.male?.low ?? range.female?.low;
      const high = range.high ?? range.male?.high ?? range.female?.high;
      if (low != null && high != null) {
        return `${low} - ${high} ${item.unit || labTest.units || ''}`;
      }
      const text = range.text ?? range.description;
      if (text) return text;
    }
    return 'N/A';
  }
}

