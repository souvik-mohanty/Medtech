import '../models/payment_gateway_status.dart';
import 'api_client.dart';

class PaymentGatewayService {
  Future<PaymentGatewayStatus> getStatus() async {
    final response = await ApiClient.instance.dio.get<Map<String, dynamic>>(
      '/api/franchise/payment-gateway',
    );
    return PaymentGatewayStatus.fromJson(response.data!);
  }

  Future<PaymentGatewayStatus> configure({
    required PaymentProvider provider,
    required String apiKey,
    required String apiSecret,
  }) async {
    final response = await ApiClient.instance.dio.put<Map<String, dynamic>>(
      '/api/franchise/payment-gateway',
      data: {
        'provider': paymentProviderToJson(provider),
        'apiKey': apiKey,
        'apiSecret': apiSecret,
      },
    );
    return PaymentGatewayStatus.fromJson(response.data!);
  }

  Future<PaymentGatewayStatus> disable() async {
    final response = await ApiClient.instance.dio.delete<Map<String, dynamic>>(
      '/api/franchise/payment-gateway',
    );
    return PaymentGatewayStatus.fromJson(response.data!);
  }
}
