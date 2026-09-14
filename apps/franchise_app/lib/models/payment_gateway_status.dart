enum PaymentProvider { none, razorpay, phonepe }

PaymentProvider paymentProviderFromJson(String value) {
  switch (value) {
    case 'RAZORPAY':
      return PaymentProvider.razorpay;
    case 'PHONEPE':
      return PaymentProvider.phonepe;
    default:
      return PaymentProvider.none;
  }
}

String paymentProviderToJson(PaymentProvider provider) {
  switch (provider) {
    case PaymentProvider.razorpay:
      return 'RAZORPAY';
    case PaymentProvider.phonepe:
      return 'PHONEPE';
    case PaymentProvider.none:
      return 'NONE';
  }
}

class PaymentGatewayStatus {
  PaymentGatewayStatus({
    required this.provider,
    this.maskedApiKey,
    required this.configured,
    required this.active,
  });

  final PaymentProvider provider;
  final String? maskedApiKey;
  final bool configured;
  final bool active;

  factory PaymentGatewayStatus.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>;
    return PaymentGatewayStatus(
      provider: paymentProviderFromJson(data['provider'] as String? ?? 'NONE'),
      maskedApiKey: data['maskedApiKey'] as String?,
      configured: data['configured'] as bool? ?? false,
      active: data['active'] as bool? ?? false,
    );
  }
}
