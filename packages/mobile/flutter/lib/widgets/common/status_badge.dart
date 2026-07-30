import 'package:flutter/material.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

class StatusBadge extends StatelessWidget {
  final String label;
  final Color? color;
  final Color? textColor;
  final double fontSize;

  const StatusBadge({
    super.key,
    required this.label,
    this.color,
    this.textColor,
    this.fontSize = 11,
  });

  factory StatusBadge.appointment(String status) {
    switch (status) {
      case 'confirmed':
        return StatusBadge(label: 'مؤكد', color: AppColors.success, textColor: AppColors.onSuccess);
      case 'pending':
        return StatusBadge(label: 'قيد الانتظار', color: AppColors.pendingStatus, textColor: AppColors.onWarning);
      case 'cancelled':
        return StatusBadge(label: 'ملغي', color: AppColors.cancelledStatus, textColor: Colors.white);
      case 'completed':
        return StatusBadge(label: 'مكتمل', color: AppColors.success, textColor: AppColors.onSuccess);
      default:
        return StatusBadge(label: status, color: AppColors.info, textColor: AppColors.onInfo);
    }
  }

  factory StatusBadge.result(String status) {
    switch (status) {
      case 'normal':
        return StatusBadge(label: 'طبيعي', color: AppColors.normalResultLight, textColor: AppColors.normalResult);
      case 'abnormal':
        return StatusBadge(label: 'غير طبيعي', color: AppColors.abnormalResultLight, textColor: AppColors.abnormalResult);
      case 'critical':
        return StatusBadge(label: 'حرج', color: AppColors.criticalResultLight, textColor: AppColors.criticalResult);
      case 'pending':
        return StatusBadge(label: 'قيد الانتظار', color: AppColors.pendingStatus, textColor: AppColors.onWarning);
      default:
        return StatusBadge(label: status, color: AppColors.info, textColor: AppColors.onInfo);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xxs,
      ),
      decoration: BoxDecoration(
        color: color ?? AppColors.info,
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
          color: textColor ?? Colors.white,
        ),
      ),
    );
  }
}
