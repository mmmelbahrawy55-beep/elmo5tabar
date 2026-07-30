class AiChatMessage {
  final String id;
  final String conversationId;
  final String role;
  final String content;
  final List<String>? suggestedActions;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;

  const AiChatMessage({
    required this.id,
    required this.conversationId,
    required this.role,
    required this.content,
    this.suggestedActions,
    this.metadata,
    required this.createdAt,
  });

  factory AiChatMessage.fromJson(Map<String, dynamic> json) {
    return AiChatMessage(
      id: json['id'] as String,
      conversationId: json['conversation_id'] as String,
      role: json['role'] as String,
      content: json['content'] as String,
      suggestedActions: (json['suggested_actions'] as List<dynamic>?)
          ?.cast<String>(),
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversation_id': conversationId,
      'role': role,
      'content': content,
      'suggested_actions': suggestedActions,
      'metadata': metadata,
      'created_at': createdAt.toIso8601String(),
    };
  }

  bool get isUser => role == 'user';
  bool get isAssistant => role == 'assistant';
  bool get isSystem => role == 'system';
}

class AiConversation {
  final String id;
  final String userId;
  final String? title;
  final int messageCount;
  final DateTime lastMessageAt;
  final DateTime createdAt;

  const AiConversation({
    required this.id,
    required this.userId,
    this.title,
    required this.messageCount,
    required this.lastMessageAt,
    required this.createdAt,
  });

  factory AiConversation.fromJson(Map<String, dynamic> json) {
    return AiConversation(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      title: json['title'] as String?,
      messageCount: json['message_count'] as int? ?? 0,
      lastMessageAt: DateTime.parse(json['last_message_at'] as String),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'title': title,
      'message_count': messageCount,
      'last_message_at': lastMessageAt.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
    };
  }
}
