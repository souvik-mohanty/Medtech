import '../models/product.dart';
import 'api_client.dart';

class ProductService {
  Future<List<Product>> listProducts() async {
    final response = await ApiClient.instance.dio.get<Map<String, dynamic>>(
      '/api/franchise/inventory/products',
    );
    final data = response.data!['data'] as List<dynamic>;
    return data.map((item) => Product.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<Product> createProduct({
    required String name,
    String? unit,
    required double price,
    required int stockQuantity,
    double gstPercentage = 0,
  }) async {
    final response = await ApiClient.instance.dio.post<Map<String, dynamic>>(
      '/api/franchise/inventory/products',
      data: {
        'name': name,
        'unit': unit,
        'price': price,
        'stockQuantity': stockQuantity,
        'gstPercentage': gstPercentage,
      },
    );
    return Product.fromJson(response.data!['data'] as Map<String, dynamic>);
  }
}
