class MedicineReminder {
  final String id;
  final String userId;
  final String name;
  final String dosage;
  final String frequency;
  final List<String> times;
  final DateTime startDate;
  final DateTime? endDate;
  final String? notes;
  final bool isActive;
  final bool refillReminder;
  final int? refillDays;
  final DateTime createdAt;

  const MedicineReminder({
    required this.id,
    required this.userId,
    required this.name,
    required this.dosage,
    required this.frequency,
    required this.times,
    required this.startDate,
    this.endDate,
    this.notes,
    this.isActive = true,
    this.refillReminder = false,
    this.refillDays,
    required this.createdAt,
  });

  factory MedicineReminder.fromJson(Map<String, dynamic> json) {
    return MedicineReminder(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      name: json['name'] as String,
      dosage: json['dosage'] as String,
      frequency: json['frequency'] as String,
      times: (json['times'] as List<dynamic>?)?.cast<String>() ?? [],
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: json['end_date'] != null
          ? DateTime.parse(json['end_date'] as String)
          : null,
      notes: json['notes'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      refillReminder: json['refill_reminder'] as bool? ?? false,
      refillDays: json['refill_days'] as int?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'name': name,
      'dosage': dosage,
      'frequency': frequency,
      'times': times,
      'start_date': startDate.toIso8601String().split('T').first,
      'end_date': endDate?.toIso8601String().split('T').first,
      'notes': notes,
      'is_active': isActive,
      'refill_reminder': refillReminder,
      'refill_days': refillDays,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
