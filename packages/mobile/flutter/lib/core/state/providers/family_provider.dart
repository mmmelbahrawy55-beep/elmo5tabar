import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/family_member.dart';
import '../../network/api_client.dart';
import '../../network/api_endpoints.dart';

final familyMemberListProvider =
    FutureProvider.autoDispose<List<FamilyMember>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(ApiEndpoints.familyMembers);
  final list = (response.data['data'] as List<dynamic>)
      .map((e) => FamilyMember.fromJson(e as Map<String, dynamic>))
      .toList();
  return list;
});

final createFamilyMemberProvider =
    FutureProvider.autoDispose.family<FamilyMember, Map<String, dynamic>>(
  (ref, data) async {
    final api = ref.watch(apiClientProvider);
    final response = await api.post(ApiEndpoints.createFamilyMember, data: data);
    ref.invalidate(familyMemberListProvider);
    return FamilyMember.fromJson(response.data['data'] as Map<String, dynamic>);
  },
);

final updateFamilyMemberProvider =
    FutureProvider.autoDispose.family<FamilyMember, ({String id, Map<String, dynamic> data})>(
  (ref, params) async {
    final api = ref.watch(apiClientProvider);
    final response = await api.put(
      ApiEndpoints.updateFamilyMember.replaceAll('{id}', params.id),
      data: params.data,
    );
    ref.invalidate(familyMemberListProvider);
    return FamilyMember.fromJson(response.data['data'] as Map<String, dynamic>);
  },
);

final deleteFamilyMemberProvider =
    FutureProvider.autoDispose.family<void, String>((ref, id) async {
  final api = ref.watch(apiClientProvider);
  await api.delete(ApiEndpoints.deleteFamilyMember.replaceAll('{id}', id));
  ref.invalidate(familyMemberListProvider);
});
