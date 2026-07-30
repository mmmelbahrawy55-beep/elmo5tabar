import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/medicine_reminder.dart';
import '../../network/api_client.dart';
import '../../network/api_endpoints.dart';

final medicineListProvider =
    FutureProvider.autoDispose<List<MedicineReminder>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(ApiEndpoints.medicines);
  final list = (response.data['data'] as List<dynamic>)
      .map((e) => MedicineReminder.fromJson(e as Map<String, dynamic>))
      .toList();
  return list;
});

final createReminderProvider =
    FutureProvider.autoDispose.family<MedicineReminder, Map<String, dynamic>>(
  (ref, data) async {
    final api = ref.watch(apiClientProvider);
    final response = await api.post(ApiEndpoints.createMedicine, data: data);
    ref.invalidate(medicineListProvider);
    return MedicineReminder.fromJson(response.data['data'] as Map<String, dynamic>);
  },
);

final updateReminderProvider =
    FutureProvider.autoDispose.family<MedicineReminder, ({String id, Map<String, dynamic> data})>(
  (ref, params) async {
    final api = ref.watch(apiClientProvider);
    final response = await api.put(
      ApiEndpoints.updateMedicine.replaceAll('{id}', params.id),
      data: params.data,
    );
    ref.invalidate(medicineListProvider);
    return MedicineReminder.fromJson(response.data['data'] as Map<String, dynamic>);
  },
);

final deleteReminderProvider =
    FutureProvider.autoDispose.family<void, String>((ref, id) async {
  final api = ref.watch(apiClientProvider);
  await api.delete(ApiEndpoints.deleteMedicine.replaceAll('{id}', id));
  ref.invalidate(medicineListProvider);
});
