class Appointment {
  final String id;
  final String branchId;
  final String? branchName;
  final String userId;
  final String? familyMemberId;
  final String? patientName;
  final List<String> testIds;
  final List<LabTestBrief>? tests;
  final DateTime appointmentDate;
  final String timeSlot;
  final String status;
  final String? queueNumber;
  final int? queuePosition;
  final bool isHomeVisit;
  final double? totalPrice;
  final double? insuranceCoverage;
  final double? amountDue;
  final String? paymentStatus;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Appointment({
    required this.id,
    required this.branchId,
    this.branchName,
    required this.userId,
    this.familyMemberId,
    this.patientName,
    required this.testIds,
    this.tests,
    required this.appointmentDate,
    required this.timeSlot,
    required this.status,
    this.queueNumber,
    this.queuePosition,
    this.isHomeVisit = false,
    this.totalPrice,
    this.insuranceCoverage,
    this.amountDue,
    this.paymentStatus,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'] as String,
      branchId: json['branch_id'] as String,
      branchName: json['branch_name'] as String?,
      userId: json['user_id'] as String,
      familyMemberId: json['family_member_id'] as String?,
      patientName: json['patient_name'] as String?,
      testIds: (json['test_ids'] as List<dynamic>?)?.cast<String>() ?? [],
      tests: (json['tests'] as List<dynamic>?)
          ?.map((e) => LabTestBrief.fromJson(e as Map<String, dynamic>))
          .toList(),
      appointmentDate: DateTime.parse(json['appointment_date'] as String),
      timeSlot: json['time_slot'] as String,
      status: json['status'] as String,
      queueNumber: json['queue_number'] as String?,
      queuePosition: json['queue_position'] as int?,
      isHomeVisit: json['is_home_visit'] as bool? ?? false,
      totalPrice: (json['total_price'] as num?)?.toDouble(),
      insuranceCoverage: (json['insurance_coverage'] as num?)?.toDouble(),
      amountDue: (json['amount_due'] as num?)?.toDouble(),
      paymentStatus: json['payment_status'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'branch_id': branchId,
      'branch_name': branchName,
      'user_id': userId,
      'family_member_id': familyMemberId,
      'patient_name': patientName,
      'test_ids': testIds,
      'tests': tests?.map((t) => t.toJson()).toList(),
      'appointment_date': appointmentDate.toIso8601String(),
      'time_slot': timeSlot,
      'status': status,
      'queue_number': queueNumber,
      'queue_position': queuePosition,
      'is_home_visit': isHomeVisit,
      'total_price': totalPrice,
      'insurance_coverage': insuranceCoverage,
      'amount_due': amountDue,
      'payment_status': paymentStatus,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  Appointment copyWith({
    String? status,
    int? queuePosition,
    String? queueNumber,
  }) {
    return Appointment(
      id: id,
      branchId: branchId,
      branchName: branchName,
      userId: userId,
      familyMemberId: familyMemberId,
      patientName: patientName,
      testIds: testIds,
      tests: tests,
      appointmentDate: appointmentDate,
      timeSlot: timeSlot,
      status: status ?? this.status,
      queueNumber: queueNumber ?? this.queueNumber,
      queuePosition: queuePosition ?? this.queuePosition,
      isHomeVisit: isHomeVisit,
      totalPrice: totalPrice,
      insuranceCoverage: insuranceCoverage,
      amountDue: amountDue,
      paymentStatus: paymentStatus,
      notes: notes,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

class LabTestBrief {
  final String id;
  final String nameAr;
  final String nameEn;
  final double? price;

  const LabTestBrief({
    required this.id,
    required this.nameAr,
    required this.nameEn,
    this.price,
  });

  factory LabTestBrief.fromJson(Map<String, dynamic> json) {
    return LabTestBrief(
      id: json['id'] as String,
      nameAr: json['name_ar'] as String? ?? '',
      nameEn: json['name_en'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name_ar': nameAr,
      'name_en': nameEn,
      'price': price,
    };
  }

  String get displayName => nameAr.isNotEmpty ? nameAr : nameEn;
}
