class LabTest {
  final String id;
  final String nameAr;
  final String nameEn;
  final String? category;
  final String? descriptionAr;
  final String? descriptionEn;
  final String? unit;
  final String? referenceRange;
  final double? minRange;
  final double? maxRange;
  final double? price;
  final bool isHomeCollectionAvailable;
  final bool requiresFasting;
  final int? preparationHours;
  final int? turnaroundHours;
  final String? sampleType;
  final bool isActive;
  final DateTime createdAt;

  const LabTest({
    required this.id,
    required this.nameAr,
    required this.nameEn,
    this.category,
    this.descriptionAr,
    this.descriptionEn,
    this.unit,
    this.referenceRange,
    this.minRange,
    this.maxRange,
    this.price,
    this.isHomeCollectionAvailable = false,
    this.requiresFasting = false,
    this.preparationHours,
    this.turnaroundHours,
    this.sampleType,
    this.isActive = true,
    required this.createdAt,
  });

  factory LabTest.fromJson(Map<String, dynamic> json) {
    return LabTest(
      id: json['id'] as String,
      nameAr: json['name_ar'] as String? ?? '',
      nameEn: json['name_en'] as String? ?? '',
      category: json['category'] as String?,
      descriptionAr: json['description_ar'] as String?,
      descriptionEn: json['description_en'] as String?,
      unit: json['unit'] as String?,
      referenceRange: json['reference_range'] as String?,
      minRange: (json['min_range'] as num?)?.toDouble(),
      maxRange: (json['max_range'] as num?)?.toDouble(),
      price: (json['price'] as num?)?.toDouble(),
      isHomeCollectionAvailable: json['is_home_collection_available'] as bool? ?? false,
      requiresFasting: json['requires_fasting'] as bool? ?? false,
      preparationHours: json['preparation_hours'] as int?,
      turnaroundHours: json['turnaround_hours'] as int?,
      sampleType: json['sample_type'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name_ar': nameAr,
      'name_en': nameEn,
      'category': category,
      'description_ar': descriptionAr,
      'description_en': descriptionEn,
      'unit': unit,
      'reference_range': referenceRange,
      'min_range': minRange,
      'max_range': maxRange,
      'price': price,
      'is_home_collection_available': isHomeCollectionAvailable,
      'requires_fasting': requiresFasting,
      'preparation_hours': preparationHours,
      'turnaround_hours': turnaroundHours,
      'sample_type': sampleType,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
    };
  }

  String get displayName => nameAr.isNotEmpty ? nameAr : nameEn;
}
