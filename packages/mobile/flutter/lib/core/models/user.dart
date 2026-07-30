class User {
  final String id;
  final String nameAr;
  final String nameEn;
  final String email;
  final String phone;
  final String? avatar;
  final String? gender;
  final DateTime? dateOfBirth;
  final String? bloodType;
  final bool isEmailVerified;
  final bool isPhoneVerified;
  final bool is2FAEnabled;
  final bool biometricEnabled;
  final String? insuranceProvider;
  final String? insuranceId;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final DateTime createdAt;
  final DateTime updatedAt;

  const User({
    required this.id,
    required this.nameAr,
    required this.nameEn,
    required this.email,
    required this.phone,
    this.avatar,
    this.gender,
    this.dateOfBirth,
    this.bloodType,
    this.isEmailVerified = false,
    this.isPhoneVerified = false,
    this.is2FAEnabled = false,
    this.biometricEnabled = false,
    this.insuranceProvider,
    this.insuranceId,
    this.emergencyContactName,
    this.emergencyContactPhone,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      nameAr: json['name_ar'] as String? ?? '',
      nameEn: json['name_en'] as String? ?? '',
      email: json['email'] as String,
      phone: json['phone'] as String,
      avatar: json['avatar'] as String?,
      gender: json['gender'] as String?,
      dateOfBirth: json['date_of_birth'] != null
          ? DateTime.parse(json['date_of_birth'] as String)
          : null,
      bloodType: json['blood_type'] as String?,
      isEmailVerified: json['is_email_verified'] as bool? ?? false,
      isPhoneVerified: json['is_phone_verified'] as bool? ?? false,
      is2FAEnabled: json['is_2fa_enabled'] as bool? ?? false,
      biometricEnabled: json['biometric_enabled'] as bool? ?? false,
      insuranceProvider: json['insurance_provider'] as String?,
      insuranceId: json['insurance_id'] as String?,
      emergencyContactName: json['emergency_contact_name'] as String?,
      emergencyContactPhone: json['emergency_contact_phone'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name_ar': nameAr,
      'name_en': nameEn,
      'email': email,
      'phone': phone,
      'avatar': avatar,
      'gender': gender,
      'date_of_birth': dateOfBirth?.toIso8601String(),
      'blood_type': bloodType,
      'is_email_verified': isEmailVerified,
      'is_phone_verified': isPhoneVerified,
      'is_2fa_enabled': is2FAEnabled,
      'biometric_enabled': biometricEnabled,
      'insurance_provider': insuranceProvider,
      'insurance_id': insuranceId,
      'emergency_contact_name': emergencyContactName,
      'emergency_contact_phone': emergencyContactPhone,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  User copyWith({
    String? id,
    String? nameAr,
    String? nameEn,
    String? email,
    String? phone,
    String? avatar,
    String? gender,
    DateTime? dateOfBirth,
    String? bloodType,
    bool? isEmailVerified,
    bool? isPhoneVerified,
    bool? is2FAEnabled,
    bool? biometricEnabled,
    String? insuranceProvider,
    String? insuranceId,
    String? emergencyContactName,
    String? emergencyContactPhone,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      nameAr: nameAr ?? this.nameAr,
      nameEn: nameEn ?? this.nameEn,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      avatar: avatar ?? this.avatar,
      gender: gender ?? this.gender,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      bloodType: bloodType ?? this.bloodType,
      isEmailVerified: isEmailVerified ?? this.isEmailVerified,
      isPhoneVerified: isPhoneVerified ?? this.isPhoneVerified,
      is2FAEnabled: is2FAEnabled ?? this.is2FAEnabled,
      biometricEnabled: biometricEnabled ?? this.biometricEnabled,
      insuranceProvider: insuranceProvider ?? this.insuranceProvider,
      insuranceId: insuranceId ?? this.insuranceId,
      emergencyContactName: emergencyContactName ?? this.emergencyContactName,
      emergencyContactPhone: emergencyContactPhone ?? this.emergencyContactPhone,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  String get displayName => nameAr.isNotEmpty ? nameAr : nameEn;
}
