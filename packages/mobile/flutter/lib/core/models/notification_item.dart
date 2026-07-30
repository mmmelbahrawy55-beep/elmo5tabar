class NotificationItem {
  final String id;
  final String userId;
  final String type;
  final String title;
  final String body;
  final String? data;
  final String? route;
  final bool isRead;
  final DateTime createdAt;

  const NotificationItem({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.body,
    this.data,
    this.route,
    this.isRead = false,
    required this.createdAt,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      data: json['data'] as String?,
      route: json['route'] as String?,
      isRead: json['is_read'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'type': type,
      'title': title,
      'body': body,
      'data': data,
      'route': route,
      'is_read': isRead,
      'created_at': createdAt.toIso8601String(),
    };
  }

  NotificationItem copyWith({bool? isRead}) {
    return NotificationItem(
      id: id,
      userId: userId,
      type: type,
      title: title,
      body: body,
      data: data,
      route: route,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt,
    );
  }
}
