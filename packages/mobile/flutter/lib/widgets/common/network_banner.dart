import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/state/providers/connectivity_provider.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_colors.dart';

class NetworkBanner extends ConsumerWidget {
  const NetworkBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOnline = ref.watch(connectivityProvider);
    final isOffline = isOnline.valueOrNull ?? true;
    return AnimatedSlide(
      duration: const Duration(milliseconds: 300),
      offset: isOffline ? Offset.zero : const Offset(0, -1),
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 300),
        opacity: isOffline ? 1.0 : 0.0,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm,
          ),
          color: AppColors.warning,
          child: Row(
            children: [
              const Icon(Icons.wifi_off, color: Colors.white, size: 18),
              SizedBox(width: AppSpacing.sm),
              Text(
                'لا يوجد اتصال بالإنترنت',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
