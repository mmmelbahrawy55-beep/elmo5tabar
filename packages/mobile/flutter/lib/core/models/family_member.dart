class FamilyMember {
  final String id;
  final String userId;
  final String nameAr;
  final String nameEn;
  final String relationship;
  final String? gender;
  final DateTime? dateOfBirth;
  final String? bloodType;
  final String? insuranceProvider;
  final String? insuranceId;
  final bool isDependent;
  final String? phone;
  final String? email;
  final String? avatar;
  final DateTime createdAt;

  const FamilyMember({
    required this.id,
    required this.userId,
    required this.nameAr,
    required this.nameEn,
    required this.relationship,
    this.gender,
    this.dateOfBirth,
    this.bloodType,
    this.insuranceProvider,
    this.insuranceId,
    this.isDependent = false,
    this.phone,
    this.email,
    this.avatar,
    required this.createdAt,
  });

  factory FamilyMember.fromJson(Map<String, dynamic> json) {
    return FamilyMember(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      nameAr: json['name_ar'] as String? ?? '',
      nameEn: json['name_en'] as String? ?? '',
      relationship: json['relationship'] as String,
      gender: json['gender'] as String?,
      dateOfBirth: json['date_of_birth'] != null
          ? DateTime.parse(json['date_of_birth'] as String)
          : null,
      bloodType: json['blood_type'] as String?,
      insuranceProvider: json['insurance_provider'] as String?,
      insuranceId: json['insurance_id'] as String?,
      isDependent: json['is_dependent'] as bool? ?? false,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      avatar: json['avatar'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'name_ar': nameAr,
      'name_en': nameEn,
      'relationship': relationship,
      'gender': gender,
      'date_of_birth': dateOfBirth?.toIso8601String(),
      'blood_type': bloodType,
      'insurance_provider': insuranceProvider,
      'insurance_id': insuranceId,
      'is_dependent': isDependent,
      'phone': phone,
      'email': email,
      'avatar': avatar,
      'created_at': createdAt.toIso8601String(),
    };
  }

  String get displayName => nameAr.isNotEmpty ? nameAr : nameEn;
}
