class Invoice {
  final String id;
  final String userId;
  final String? appointmentId;
  final String invoiceNumber;
  final String status;
  final List<InvoiceItem> items;
  final double subtotal;
  final double? discount;
  final double? tax;
  final double total;
  final double? paidAmount;
  final double? dueAmount;
  final String? paymentMethod;
  final DateTime? paidAt;
  final DateTime dueDate;
  final DateTime createdAt;

  const Invoice({
    required this.id,
    required this.userId,
    this.appointmentId,
    required this.invoiceNumber,
    required this.status,
    required this.items,
    required this.subtotal,
    this.discount,
    this.tax,
    required this.total,
    this.paidAmount,
    this.dueAmount,
    this.paymentMethod,
    this.paidAt,
    required this.dueDate,
    required this.createdAt,
  });

  factory Invoice.fromJson(Map<String, dynamic> json) {
    return Invoice(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      appointmentId: json['appointment_id'] as String?,
      invoiceNumber: json['invoice_number'] as String,
      status: json['status'] as String,
      items: (json['items'] as List<dynamic>)
          .map((e) => InvoiceItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      subtotal: (json['subtotal'] as num).toDouble(),
      discount: (json['discount'] as num?)?.toDouble(),
      tax: (json['tax'] as num?)?.toDouble(),
      total: (json['total'] as num).toDouble(),
      paidAmount: (json['paid_amount'] as num?)?.toDouble(),
      dueAmount: (json['due_amount'] as num?)?.toDouble(),
      paymentMethod: json['payment_method'] as String?,
      paidAt: json['paid_at'] != null
          ? DateTime.parse(json['paid_at'] as String)
          : null,
      dueDate: DateTime.parse(json['due_date'] as String),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'appointment_id': appointmentId,
      'invoice_number': invoiceNumber,
      'status': status,
      'items': items.map((i) => i.toJson()).toList(),
      'subtotal': subtotal,
      'discount': discount,
      'tax': tax,
      'total': total,
      'paid_amount': paidAmount,
      'due_amount': dueAmount,
      'payment_method': paymentMethod,
      'paid_at': paidAt?.toIso8601String(),
      'due_date': dueDate.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
    };
  }

  bool get isPaid => status == 'paid';
  bool get isOverdue => status == 'overdue' && DateTime.now().isAfter(dueDate);
}

class InvoiceItem {
  final String id;
  final String? testId;
  final String nameAr;
  final String nameEn;
  final int quantity;
  final double unitPrice;
  final double total;

  const InvoiceItem({
    required this.id,
    this.testId,
    required this.nameAr,
    required this.nameEn,
    required this.quantity,
    required this.unitPrice,
    required this.total,
  });

  factory InvoiceItem.fromJson(Map<String, dynamic> json) {
    return InvoiceItem(
      id: json['id'] as String,
      testId: json['test_id'] as String?,
      nameAr: json['name_ar'] as String? ?? '',
      nameEn: json['name_en'] as String? ?? '',
      quantity: json['quantity'] as int,
      unitPrice: (json['unit_price'] as num).toDouble(),
      total: (json['total'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'test_id': testId,
      'name_ar': nameAr,
      'name_en': nameEn,
      'quantity': quantity,
      'unit_price': unitPrice,
      'total': total,
    };
  }

  String get displayName => nameAr.isNotEmpty ? nameAr : nameEn;
}

class Wallet {
  final String id;
  final String userId;
  final double balance;
  final String? currency;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Wallet({
    required this.id,
    required this.userId,
    required this.balance,
    this.currency,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Wallet.fromJson(Map<String, dynamic> json) {
    return Wallet(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      balance: (json['balance'] as num).toDouble(),
      currency: json['currency'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'balance': balance,
      'currency': currency,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}

class WalletTransaction {
  final String id;
  final String walletId;
  final String type;
  final double amount;
  final double balanceAfter;
  final String? description;
  final String? referenceId;
  final DateTime createdAt;

  const WalletTransaction({
    required this.id,
    required this.walletId,
    required this.type,
    required this.amount,
    required this.balanceAfter,
    this.description,
    this.referenceId,
    required this.createdAt,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    return WalletTransaction(
      id: json['id'] as String,
      walletId: json['wallet_id'] as String,
      type: json['type'] as String,
      amount: (json['amount'] as num).toDouble(),
      balanceAfter: (json['balance_after'] as num).toDouble(),
      description: json['description'] as String?,
      referenceId: json['reference_id'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'wallet_id': walletId,
      'type': type,
      'amount': amount,
      'balance_after': balanceAfter,
      'description': description,
      'reference_id': referenceId,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
