import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

final qrServiceProvider = Provider<QrService>(
  (ref) => QrService(),
);

class QrService {
  QrImageView generateQrCode({
    required String data,
    double size = 200,
    Color? backgroundColor,
    Color? foregroundColor,
    QrErrorCorrectionLevel errorCorrectionLevel =
        QrErrorCorrectionLevel.high,
  }) {
    return QrImageView(
      data: data,
      size: size,
      backgroundColor: backgroundColor ?? Colors.white,
      foregroundColor: foregroundColor ?? Colors.black,
      errorCorrectionLevel: errorCorrectionLevel,
      eyeStyle: QrEyeStyle(
        eyeShape: QrEyeShape.square,
        color: foregroundColor ?? Colors.black,
      ),
      dataModuleStyle: QrDataModuleStyle(
        dataModuleShape: QrDataModuleShape.square,
        color: foregroundColor ?? Colors.black,
      ),
    );
  }

  MobileScannerController getScannerController({
    DetectionMode detectionMode = DetectionMode.single,
  }) {
    return MobileScannerController(
      detectionMode: detectionMode,
    );
  }

  String? parseBarcode(BarcodeCapture capture) {
    if (capture.barcodes.isNotEmpty) {
      return capture.barcodes.first.rawValue;
    }
    return null;
  }

  String generateVerificationUrl({
    required String reportId,
    required String patientId,
  }) {
    return 'https://elm5tber.com/verify?id=$reportId&pid=$patientId';
  }
}
