class Branch {
  final String id;
  final String nameAr;
  final String nameEn;
  final String? descriptionAr;
  final String? descriptionEn;
  final String? address;
  final double latitude;
  final double longitude;
  final String? phone;
  final String? email;
  final List<String>? images;
  final Map<String, String>? workingHours;
  final List<String>? services;
  final double? rating;
  final int? reviewCount;
  final bool isOpen;
  final bool isActive;
  final double? distance;
  final DateTime createdAt;

  const Branch({
    required this.id,
    required this.nameAr,
    required this.nameEn,
    this.descriptionAr,
    this.descriptionEn,
    this.address,
    required this.latitude,
    required this.longitude,
    this.phone,
    this.email,
    this.images,
    this.workingHours,
    this.services,
    this.rating,
    this.reviewCount,
    this.isOpen = false,
    this.isActive = true,
    this.distance,
    required this.createdAt,
  });

  factory Branch.fromJson(Map<String, dynamic> json) {
    return Branch(
      id: json['id'] as String,
      nameAr: json['name_ar'] as String? ?? '',
      nameEn: json['name_en'] as String? ?? '',
      descriptionAr: json['description_ar'] as String?,
      descriptionEn: json['description_en'] as String?,
      address: json['address'] as String?,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      images: (json['images'] as List<dynamic>?)?.cast<String>(),
      workingHours: json['working_hours'] != null
          ? Map<String, String>.from(json['working_hours'] as Map)
          : null,
      services: (json['services'] as List<dynamic>?)?.cast<String>(),
      rating: (json['rating'] as num?)?.toDouble(),
      reviewCount: json['review_count'] as int?,
      isOpen: json['is_open'] as bool? ?? false,
      isActive: json['is_active'] as bool? ?? true,
      distance: (json['distance'] as num?)?.toDouble(),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name_ar': nameAr,
      'name_en': nameEn,
      'description_ar': descriptionAr,
      'description_en': descriptionEn,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'phone': phone,
      'email': email,
      'images': images,
      'working_hours': workingHours,
      'services': services,
      'rating': rating,
      'review_count': reviewCount,
      'is_open': isOpen,
      'is_active': isActive,
      'distance': distance,
      'created_at': createdAt.toIso8601String(),
    };
  }

  String get displayName => nameAr.isNotEmpty ? nameAr : nameEn;
}
