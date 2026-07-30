import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/lab_report.dart';
import '../../network/api_client.dart';
import '../../network/api_endpoints.dart';

final resultListProvider =
    FutureProvider.autoDispose.family<List<LabReport>, Map<String, dynamic>>(
  (ref, filters) async {
    final api = ref.watch(apiClientProvider);
    final response = await api.get(ApiEndpoints.results, queryParameters: filters);
    final list = (response.data['data'] as List<dynamic>)
        .map((e) => LabReport.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  },
);

final resultDetailProvider =
    FutureProvider.autoDispose.family<LabReport, String>(
  (ref, id) async {
    final api = ref.watch(apiClientProvider);
    final response = await api.get(ApiEndpoints.resultDetail.replaceAll('{id}', id));
    return LabReport.fromJson(response.data['data'] as Map<String, dynamic>);
  },
);

final resultComparisonProvider =
    FutureProvider.autoDispose.family<List<Map<String, dynamic>>, Map<String, dynamic>>(
  (ref, params) async {
    final api = ref.watch(apiClientProvider);
    final response = await api.get(ApiEndpoints.resultComparison, queryParameters: params);
    return (response.data['data'] as List<dynamic>)
        .map((e) => e as Map<String, dynamic>)
        .toList();
  },
);

final healthTimelineProvider =
    FutureProvider.autoDispose.family<List<Map<String, dynamic>>, String>(
  (ref, patientId) async {
    final api = ref.watch(apiClientProvider);
    final response = await api.get(
      '${ApiEndpoints.healthTimeline}/$patientId',
    );
    return (response.data['data'] as List<dynamic>)
        .map((e) => e as Map<String, dynamic>)
        .toList();
  },
);
