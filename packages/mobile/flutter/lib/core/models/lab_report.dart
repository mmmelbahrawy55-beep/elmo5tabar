class LabReport {
  final String id;
  final String userId;
  final String? familyMemberId;
  final String? patientName;
  final String branchId;
  final String? branchName;
  final String? appointmentId;
  final String reportNumber;
  final List<TestResult> results;
  final String? pdfUrl;
  final String? qrCode;
  final String? barcode;
  final String status;
  final bool hasAbnormal;
  final bool hasCritical;
  final String? notes;
  final DateTime reportDate;
  final DateTime createdAt;

  const LabReport({
    required this.id,
    required this.userId,
    this.familyMemberId,
    this.patientName,
    required this.branchId,
    this.branchName,
    this.appointmentId,
    required this.reportNumber,
    required this.results,
    this.pdfUrl,
    this.qrCode,
    this.barcode,
    required this.status,
    this.hasAbnormal = false,
    this.hasCritical = false,
    this.notes,
    required this.reportDate,
    required this.createdAt,
  });

  factory LabReport.fromJson(Map<String, dynamic> json) {
    return LabReport(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      familyMemberId: json['family_member_id'] as String?,
      patientName: json['patient_name'] as String?,
      branchId: json['branch_id'] as String,
      branchName: json['branch_name'] as String?,
      appointmentId: json['appointment_id'] as String?,
      reportNumber: json['report_number'] as String,
      results: (json['results'] as List<dynamic>)
          .map((e) => TestResult.fromJson(e as Map<String, dynamic>))
          .toList(),
      pdfUrl: json['pdf_url'] as String?,
      qrCode: json['qr_code'] as String?,
      barcode: json['barcode'] as String?,
      status: json['status'] as String,
      hasAbnormal: json['has_abnormal'] as bool? ?? false,
      hasCritical: json['has_critical'] as bool? ?? false,
      notes: json['notes'] as String?,
      reportDate: DateTime.parse(json['report_date'] as String),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'family_member_id': familyMemberId,
      'patient_name': patientName,
      'branch_id': branchId,
      'branch_name': branchName,
      'appointment_id': appointmentId,
      'report_number': reportNumber,
      'results': results.map((r) => r.toJson()).toList(),
      'pdf_url': pdfUrl,
      'qr_code': qrCode,
      'barcode': barcode,
      'status': status,
      'has_abnormal': hasAbnormal,
      'has_critical': hasCritical,
      'notes': notes,
      'report_date': reportDate.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
    };
  }
}

class TestResult {
  final String id;
  final String testId;
  final String testNameAr;
  final String testNameEn;
  final String? category;
  final String value;
  final String? numericValue;
  final String? unit;
  final String? referenceRange;
  final double? minRange;
  final double? maxRange;
  final String status;
  final String? notes;

  const TestResult({
    required this.id,
    required this.testId,
    required this.testNameAr,
    required this.testNameEn,
    this.category,
    required this.value,
    this.numericValue,
    this.unit,
    this.referenceRange,
    this.minRange,
    this.maxRange,
    required this.status,
    this.notes,
  });

  factory TestResult.fromJson(Map<String, dynamic> json) {
    return TestResult(
      id: json['id'] as String,
      testId: json['test_id'] as String,
      testNameAr: json['test_name_ar'] as String? ?? '',
      testNameEn: json['test_name_en'] as String? ?? '',
      category: json['category'] as String?,
      value: json['value'] as String,
      numericValue: json['numeric_value'] as String?,
      unit: json['unit'] as String?,
      referenceRange: json['reference_range'] as String?,
      minRange: (json['min_range'] as num?)?.toDouble(),
      maxRange: (json['max_range'] as num?)?.toDouble(),
      status: json['status'] as String,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'test_id': testId,
      'test_name_ar': testNameAr,
      'test_name_en': testNameEn,
      'category': category,
      'value': value,
      'numeric_value': numericValue,
      'unit': unit,
      'reference_range': referenceRange,
      'min_range': minRange,
      'max_range': maxRange,
      'status': status,
      'notes': notes,
    };
  }

  String get displayName => testNameAr.isNotEmpty ? testNameAr : testNameEn;

  bool get isAbnormal => status == 'abnormal' || status == 'high' || status == 'low';

  bool get isCritical => status == 'critical';
}
