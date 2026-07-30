import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/invoice.dart';
import '../../network/api_client.dart';
import '../../network/api_endpoints.dart';

final invoiceListProvider =
    FutureProvider.autoDispose<List<Invoice>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(ApiEndpoints.invoices);
  final list = (response.data['data'] as List<dynamic>)
      .map((e) => Invoice.fromJson(e as Map<String, dynamic>))
      .toList();
  return list;
});

final invoiceDetailProvider =
    FutureProvider.autoDispose.family<Invoice, String>((ref, id) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(ApiEndpoints.invoiceDetail.replaceAll('{id}', id));
  return Invoice.fromJson(response.data['data'] as Map<String, dynamic>);
});

final walletProvider = FutureProvider.autoDispose<Wallet>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(ApiEndpoints.wallet);
  return Wallet.fromJson(response.data['data'] as Map<String, dynamic>);
});

final walletTransactionsProvider =
    FutureProvider.autoDispose<List<WalletTransaction>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(ApiEndpoints.walletTransactions);
  final list = (response.data['data'] as List<dynamic>)
      .map((e) => WalletTransaction.fromJson(e as Map<String, dynamic>))
      .toList();
  return list;
});

class ProcessPaymentNotifier extends StateNotifier<AsyncValue<Map<String, dynamic>?>> {
  final ApiClient _api;
  ProcessPaymentNotifier(this._api) : super(const AsyncValue.data(null));

  Future<void> process(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      final response = await _api.post(ApiEndpoints.processPayment, data: data);
      state = AsyncValue.data(response.data['data'] as Map<String, dynamic>);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final processPaymentProvider =
    StateNotifierProvider.autoDispose<ProcessPaymentNotifier, AsyncValue<Map<String, dynamic>?>>(
  (ref) => ProcessPaymentNotifier(ref.watch(apiClientProvider)),
);
