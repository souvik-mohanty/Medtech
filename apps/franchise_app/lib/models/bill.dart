class BillItem {
  BillItem({
    required this.productName,
    required this.quantity,
    required this.lineTotal,
  });

  final String productName;
  final int quantity;
  final double lineTotal;

  factory BillItem.fromJson(Map<String, dynamic> json) {
    return BillItem(
      productName: json['productName'] as String,
      quantity: json['quantity'] as int,
      lineTotal: (json['lineTotal'] as num).toDouble(),
    );
  }
}

class Bill {
  Bill({
    required this.id,
    required this.items,
    required this.subtotal,
    required this.gstAmount,
    required this.totalAmount,
    required this.status,
    this.invoiceNumber,
  });

  final String id;
  final List<BillItem> items;
  final double subtotal;
  final double gstAmount;
  final double totalAmount;
  final String status;
  final String? invoiceNumber;

  factory Bill.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>;
    return Bill(
      id: data['id'] as String,
      items: (data['items'] as List<dynamic>)
          .map((i) => BillItem.fromJson(i as Map<String, dynamic>))
          .toList(),
      subtotal: (data['subtotal'] as num).toDouble(),
      gstAmount: (data['gstAmount'] as num).toDouble(),
      totalAmount: (data['totalAmount'] as num).toDouble(),
      status: data['status'] as String,
      invoiceNumber: data['invoiceNumber'] as String?,
    );
  }
}
