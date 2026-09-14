class OrderResult {
  OrderResult({
    required this.id,
    required this.status,
    required this.totalAmount,
  });

  final String id;
  final String status;
  final double totalAmount;

  factory OrderResult.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>;
    return OrderResult(
      id: data['id'] as String,
      status: data['status'] as String,
      totalAmount: (data['totalAmount'] as num).toDouble(),
    );
  }
}
