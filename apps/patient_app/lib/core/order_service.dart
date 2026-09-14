import 'package:dio/dio.dart';

import '../models/order_result.dart';
import '../models/product.dart';
import 'api_client.dart';

class OrderItemSelection {
  OrderItemSelection({required this.product, required this.quantity});

  final Product product;
  final int quantity;
}

class OrderService {
  Future<List<Product>> fetchProducts(String franchiseId) async {
    final response = await ApiClient.instance.dio.get<Map<String, dynamic>>(
      '/api/patient/franchises/$franchiseId/products',
    );

    final data = response.data!['data'] as List<dynamic>;
    return data
        .map((item) => Product.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<OrderResult> placeOrder(String franchiseId, List<OrderItemSelection> items) async {
    final response = await ApiClient.instance.dio.post<Map<String, dynamic>>(
      '/api/patient/orders',
      data: {
        'franchiseId': franchiseId,
        'items': items
            .map((i) => {'productId': i.product.id, 'quantity': i.quantity})
            .toList(),
      },
    );

    return OrderResult.fromJson(response.data!);
  }

  /// Backend errors arrive as {success:false, message:"..."} — surface that
  /// message (e.g. "This store hasn't set up online payments yet...")
  /// instead of a generic Dio error.
  static String messageFor(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map && data['message'] is String) {
        return data['message'] as String;
      }
    }
    return error.toString();
  }
}
