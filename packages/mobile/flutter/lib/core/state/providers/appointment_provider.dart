import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/appointment.dart';
import '../../network/api_client.dart';
import '../../network/api_endpoints.dart';

final appointmentListProvider =
    FutureProvider.autoDispose.family<List<Appointment>, Map<String, dynamic>>(
  (ref, filters) async {
    final api = ref.watch(apiClientProvider);
    final response = await api.get(ApiEndpoints.appointments, queryParameters: filters);
    final list = (response.data['data'] as List<dynamic>)
        .map((e) => Appointment.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  },
);

final appointmentDetailProvider =
    FutureProvider.autoDispose.family<Appointment, String>(
  (ref, id) async {
    final api = ref.watch(apiClientProvider);
    final response = await api.get(ApiEndpoints.appointmentDetail.replaceAll('{id}', id));
    return Appointment.fromJson(response.data['data'] as Map<String, dynamic>);
  },
);

final availableSlotsProvider = FutureProvider.autoDispose.family<List<Map<String, dynamic>>, Map<String, dynamic>>(
  (ref, params) async {
    final api = ref.watch(apiClientProvider);
    final response = await api.get(ApiEndpoints.availableSlots, queryParameters: params);
    return (response.data['data'] as List<dynamic>)
        .map((e) => e as Map<String, dynamic>)
        .toList();
  },
);

class CreateAppointmentNotifier extends StateNotifier<AsyncValue<Appointment?>> {
  final ApiClient _api;
  CreateAppointmentNotifier(this._api) : super(const AsyncValue.data(null));

  Future<void> create(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      final response = await _api.post(ApiEndpoints.createAppointment, data: data);
      final appointment = Appointment.fromJson(response.data['data'] as Map<String, dynamic>);
      state = AsyncValue.data(appointment);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final createAppointmentProvider =
    StateNotifierProvider.autoDispose<CreateAppointmentNotifier, AsyncValue<Appointment?>>(
  (ref) {
    final api = ref.watch(apiClientProvider);
    return CreateAppointmentNotifier(api);
  },
);

class CancelAppointmentNotifier extends StateNotifier<AsyncValue<void>> {
  final ApiClient _api;
  CancelAppointmentNotifier(this._api) : super(const AsyncValue.data(null));

  Future<void> cancel(String id) async {
    state = const AsyncValue.loading();
    try {
      await _api.post(ApiEndpoints.cancelAppointment.replaceAll('{id}', id));
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final cancelAppointmentProvider =
    StateNotifierProvider.autoDispose<CancelAppointmentNotifier, AsyncValue<void>>(
  (ref) {
    final api = ref.watch(apiClientProvider);
    return CancelAppointmentNotifier(api);
  },
);
