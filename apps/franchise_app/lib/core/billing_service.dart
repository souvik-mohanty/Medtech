import 'package:dio/dio.dart';

import '../models/bill.dart';
import '../models/product.dart';
import 'api_client.dart';

class BillItemSelection {
  BillItemSelection({required this.product, required this.quantity});

  final Product product;
  final int quantity;
}

class BillingService {
  Future<Bill> createCounterBill({
    required List<BillItemSelection> items,
    String? customerName,
    String? customerPhone,
  }) async {
    final response = await ApiClient.instance.dio.post<Map<String, dynamic>>(
      '/api/franchise/billing/bills',
      data: {
        'items': items.map((i) => {'productId': i.product.id, 'quantity': i.quantity}).toList(),
        'customerName': customerName,
        'customerPhone': customerPhone,
      },
    );
    return Bill.fromJson(response.data!);
  }

  /// Raw PDF bytes — feed straight into `Printing.layoutPdf` for print/preview.
  Future<List<int>> downloadInvoicePdf(String billId) async {
    final response = await ApiClient.instance.dio.get<List<int>>(
      '/api/franchise/billing/bills/$billId/invoice',
      options: Options(responseType: ResponseType.bytes),
    );
    return response.data!;
  }
}
