import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/ai_chat_message.dart';
import '../../network/api_client.dart';
import '../../network/api_endpoints.dart';

final conversationListProvider =
    FutureProvider.autoDispose<List<AiConversation>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(ApiEndpoints.aiConversations);
  final list = (response.data['data'] as List<dynamic>)
      .map((e) => AiConversation.fromJson(e as Map<String, dynamic>))
      .toList();
  return list;
});

final chatHistoryProvider =
    FutureProvider.autoDispose.family<List<AiChatMessage>, String>(
  (ref, conversationId) async {
    final api = ref.watch(apiClientProvider);
    final response = await api.get(
      ApiEndpoints.aiConversationDetail.replaceAll('{id}', conversationId),
    );
    final list = (response.data['data']['messages'] as List<dynamic>)
        .map((e) => AiChatMessage.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  },
);

class SendMessageNotifier extends StateNotifier<AsyncValue<List<AiChatMessage>>> {
  final ApiClient _api;
  SendMessageNotifier(this._api) : super(const AsyncValue.data([]));

  Future<void> sendMessage({
    required String conversationId,
    required String content,
  }) async {
    final currentMessages = state.valueOrNull ?? [];
    final tempUser = AiChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      conversationId: conversationId,
      role: 'user',
      content: content,
      createdAt: DateTime.now(),
    );
    state = AsyncValue.data([...currentMessages, tempUser]);
    try {
      final response = await _api.post(
        ApiEndpoints.aiChat,
        data: {
          'conversation_id': conversationId,
          'content': content,
        },
      );
      final reply = AiChatMessage.fromJson(
        response.data['data'] as Map<String, dynamic>,
      );
      state = AsyncValue.data([...currentMessages, tempUser, reply]);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> sendVoiceQuery({
    required String conversationId,
    required String audioPath,
  }) async {
    try {
      final formData = FormData.fromMap({
        'conversation_id': conversationId,
        'audio': await MultipartFile.fromFile(audioPath),
      });
      final response = await _api.post(
        ApiEndpoints.aiVoiceQuery,
        data: formData,
      );
      final reply = AiChatMessage.fromJson(
        response.data['data'] as Map<String, dynamic>,
      );
      final current = state.valueOrNull ?? [];
      state = AsyncValue.data([...current, reply]);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final sendMessageProvider = StateNotifierProvider.autoDispose<
    SendMessageNotifier, AsyncValue<List<AiChatMessage>>>(
  (ref) => SendMessageNotifier(ref.watch(apiClientProvider)),
);
