import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';

final pdfServiceProvider = Provider<PdfService>(
  (ref) => PdfService(),
);

class PdfService {
  final Dio _dio = Dio();

  Future<String> downloadPdf({
    required String url,
    String? fileName,
    Map<String, dynamic>? headers,
  }) async {
    final dir = await getTemporaryDirectory();
    final filePath = '${dir.path}/${fileName ?? 'report_${DateTime.now().millisecondsSinceEpoch}.pdf'}';
    await _dio.download(
      url,
      filePath,
      options: Options(headers: headers),
    );
    return filePath;
  }

  Future<File> getPdfFile(String filePath) async {
    return File(filePath);
  }

  Future<bool> deletePdf(String filePath) async {
    try {
      final file = File(filePath);
      if (await file.exists()) {
        await file.delete();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<String> getPdfAssetsPath(String assetPath) async {
    final dir = await getTemporaryDirectory();
    return '${dir.path}/$assetPath';
  }
}
