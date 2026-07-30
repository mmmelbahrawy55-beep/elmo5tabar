import 'package:flutter/material.dart';
import '../../core/theme/app_spacing.dart';

class LoadingOverlay extends StatelessWidget {
  final String? message;
  final bool isModal;

  const LoadingOverlay({super.key, this.message, this.isModal = true});

  @override
  Widget build(BuildContext context) {
    final content = Center(
      child: Card(
        elevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        ),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(),
              if (message != null) ...[
                SizedBox(height: AppSpacing.md),
                Text(message!, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ],
          ),
        ),
      ),
    );

    if (isModal) {
      return Stack(
        children: [
          Container(color: Colors.black26),
          content,
        ],
      );
    }
    return content;
  }
}
