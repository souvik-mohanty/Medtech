import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:printing/printing.dart';

import '../../core/api_error.dart';
import '../../core/billing_service.dart';
import '../../core/product_service.dart';
import '../../models/bill.dart';
import '../../models/product.dart';

/// Sample screen: counter/walk-in billing. Pick products from inventory,
/// create the bill (paid cash, invoiced immediately), then print it —
/// matches the "select from inventory, bill should print accordingly"
/// requirement (docs/PROJECT_SPEC.md billing section).
class BillingScreen extends StatefulWidget {
  const BillingScreen({super.key});

  @override
  State<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends State<BillingScreen> {
  final _productService = ProductService();
  final _billingService = BillingService();
  final _customerNameController = TextEditingController();
  final _customerPhoneController = TextEditingController();

  List<Product>? _products;
  final Map<String, int> _quantities = {};

  bool _isLoadingProducts = true;
  bool _isCreatingBill = false;
  String? _errorMessage;
  Bill? _lastBill;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  @override
  void dispose() {
    _customerNameController.dispose();
    _customerPhoneController.dispose();
    super.dispose();
  }

  Future<void> _loadProducts() async {
    setState(() => _isLoadingProducts = true);
    try {
      final products = await _productService.listProducts();
      setState(() => _products = products);
    } catch (e) {
      setState(() => _errorMessage = apiErrorMessage(e));
    } finally {
      setState(() => _isLoadingProducts = false);
    }
  }

  int get _itemCount => _quantities.values.where((q) => q > 0).length;

  Future<void> _createBill() async {
    final selections = _quantities.entries
        .where((e) => e.value > 0)
        .map((e) => BillItemSelection(
              product: _products!.firstWhere((p) => p.id == e.key),
              quantity: e.value,
            ))
        .toList();

    if (selections.isEmpty) return;

    setState(() {
      _isCreatingBill = true;
      _errorMessage = null;
      _lastBill = null;
    });

    try {
      final bill = await _billingService.createCounterBill(
        items: selections,
        customerName: _customerNameController.text.trim(),
        customerPhone: _customerPhoneController.text.trim(),
      );
      setState(() {
        _lastBill = bill;
        _quantities.clear();
      });
    } catch (e) {
      setState(() => _errorMessage = apiErrorMessage(e));
    } finally {
      setState(() => _isCreatingBill = false);
    }
  }

  Future<void> _printLastBill() async {
    if (_lastBill == null) return;

    try {
      final bytes = await _billingService.downloadInvoicePdf(_lastBill!.id);
      await Printing.layoutPdf(onLayout: (_) async => Uint8List.fromList(bytes));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingProducts) {
      return const Center(child: CircularProgressIndicator());
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_errorMessage != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
            ),
          if (_lastBill != null)
            Card(
              color: Colors.green.shade50,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Bill ${_lastBill!.invoiceNumber ?? _lastBill!.id} • '
                        '₹${_lastBill!.totalAmount.toStringAsFixed(2)}',
                      ),
                    ),
                    TextButton.icon(
                      onPressed: _printLastBill,
                      icon: const Icon(Icons.print),
                      label: const Text('Print'),
                    ),
                  ],
                ),
              ),
            ),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _customerNameController,
                  decoration: const InputDecoration(labelText: 'Customer name (optional)', border: OutlineInputBorder()),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _customerPhoneController,
                  decoration: const InputDecoration(labelText: 'Phone (optional)', border: OutlineInputBorder()),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: _products == null || _products!.isEmpty
                ? const Center(child: Text('No products in inventory yet'))
                : ListView.builder(
                    itemCount: _products!.length,
                    itemBuilder: (context, index) {
                      final product = _products![index];
                      final quantity = _quantities[product.id] ?? 0;

                      return Card(
                        child: ListTile(
                          title: Text(product.name),
                          subtitle: Text('₹${product.price.toStringAsFixed(2)} • ${product.stockQuantity} in stock'),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.remove_circle_outline),
                                onPressed: quantity > 0
                                    ? () => setState(() => _quantities[product.id] = quantity - 1)
                                    : null,
                              ),
                              Text('$quantity'),
                              IconButton(
                                icon: const Icon(Icons.add_circle_outline),
                                onPressed: quantity < product.stockQuantity
                                    ? () => setState(() => _quantities[product.id] = quantity + 1)
                                    : null,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          ElevatedButton(
            onPressed: (_itemCount > 0 && !_isCreatingBill) ? _createBill : null,
            child: _isCreatingBill
                ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                : Text('Create Bill ($_itemCount item${_itemCount == 1 ? '' : 's'})'),
          ),
        ],
      ),
    );
  }
}
