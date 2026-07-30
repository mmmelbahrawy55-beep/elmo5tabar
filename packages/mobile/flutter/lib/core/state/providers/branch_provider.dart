import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/branch.dart';
import '../../network/api_client.dart';
import '../../network/api_endpoints.dart';

final branchListProvider =
    FutureProvider.autoDispose.family<List<Branch>, Map<String, dynamic>>(
  (ref, filters) async {
    final api = ref.watch(apiClientProvider);
    final response = await api.get(ApiEndpoints.branches, queryParameters: filters);
    final list = (response.data['data'] as List<dynamic>)
        .map((e) => Branch.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  },
);

final branchDetailProvider =
    FutureProvider.autoDispose.family<Branch, String>(
  (ref, id) async {
    final api = ref.watch(apiClientProvider);
    final response = await api.get(ApiEndpoints.branchDetail.replaceAll('{id}', id));
    return Branch.fromJson(response.data['data'] as Map<String, dynamic>);
  },
);

final nearbyBranchesProvider =
    FutureProvider.autoDispose.family<List<Branch>, Map<String, double>>(
  (ref, coords) async {
    final api = ref.watch(apiClientProvider);
    final response = await api.get(ApiEndpoints.nearbyBranches, queryParameters: {
      'latitude': coords['lat'],
      'longitude': coords['lng'],
    });
    final list = (response.data['data'] as List<dynamic>)
        .map((e) => Branch.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  },
);
