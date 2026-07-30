class QueueTicket {
  final String id;
  final String appointmentId;
  final String branchId;
  final String? branchName;
  final String queueNumber;
  final int position;
  final int estimatedWaitMinutes;
  final String status;
  final String? counterNumber;
  final DateTime? calledAt;
  final DateTime createdAt;

  const QueueTicket({
    required this.id,
    required this.appointmentId,
    required this.branchId,
    this.branchName,
    required this.queueNumber,
    required this.position,
    required this.estimatedWaitMinutes,
    required this.status,
    this.counterNumber,
    this.calledAt,
    required this.createdAt,
  });

  factory QueueTicket.fromJson(Map<String, dynamic> json) {
    return QueueTicket(
      id: json['id'] as String,
      appointmentId: json['appointment_id'] as String,
      branchId: json['branch_id'] as String,
      branchName: json['branch_name'] as String?,
      queueNumber: json['queue_number'] as String,
      position: json['position'] as int,
      estimatedWaitMinutes: json['estimated_wait_minutes'] as int? ?? 0,
      status: json['status'] as String,
      counterNumber: json['counter_number'] as String?,
      calledAt: json['called_at'] != null
          ? DateTime.parse(json['called_at'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'appointment_id': appointmentId,
      'branch_id': branchId,
      'branch_name': branchName,
      'queue_number': queueNumber,
      'position': position,
      'estimated_wait_minutes': estimatedWaitMinutes,
      'status': status,
      'counter_number': counterNumber,
      'called_at': calledAt?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
    };
  }

  bool get isWaiting => status == 'waiting';
  bool get isCalled => status == 'called';
  bool get isServing => status == 'serving';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
}
