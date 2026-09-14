import 'package:flutter/material.dart';

import '../../core/order_service.dart';
import '../../models/product.dart';

/// Sample screen: browse a franchise's catalog and place an online order.
///
/// There is no franchise directory/search endpoint yet (see
/// docs/PROJECT_SPEC.md "Nearest Franchise Logic" — not built), so the
/// franchise is entered by ID for now rather than picked from a list.
class FranchiseProductsScreen extends StatefulWidget {
  const FranchiseProductsScreen({super.key});

  @override
  State<FranchiseProductsScreen> createState() => _FranchiseProductsScreenState();
}

class _FranchiseProductsScreenState extends State<FranchiseProductsScreen> {
  final _orderService = OrderService();
  final _franchiseIdController = TextEditingController();

  List<Product>? _products;
  final Map<String, int> _quantities = {};

  bool _isLoadingProducts = false;
  bool _isPlacingOrder = false;
  String? _errorMessage;

  @override
  void dispose() {
    _franchiseIdController.dispose();
    super.dispose();
  }

  Future<void> _loadProducts() async {
    final franchiseId = _franchiseIdController.text.trim();
    if (franchiseId.isEmpty) return;

    setState(() {
      _isLoadingProducts = true;
      _errorMessage = null;
      _products = null;
      _quantities.clear();
    });

    try {
      final products = await _orderService.fetchProducts(franchiseId);
      setState(() => _products = products);
    } catch (e) {
      setState(() => _errorMessage = OrderService.messageFor(e));
    } finally {
      setState(() => _isLoadingProducts = false);
    }
  }

  Future<void> _placeOrder() async {
    final franchiseId = _franchiseIdController.text.trim();
    final selections = _quantities.entries
        .where((e) => e.value > 0)
        .map((e) => OrderItemSelection(
              product: _products!.firstWhere((p) => p.id == e.key),
              quantity: e.value,
            ))
        .toList();

    if (selections.isEmpty) return;

    setState(() {
      _isPlacingOrder = true;
      _errorMessage = null;
    });

    try {
      final result = await _orderService.placeOrder(franchiseId, selections);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Order placed'),
          content: Text(
            'Order ${result.id}\nStatus: ${result.status}\nTotal: ₹${result.totalAmount.toStringAsFixed(2)}\n\n'
            'This is a PAYMENT_PENDING order — there is no payment gateway checkout wired up on this screen yet '
            '(see BillingService#markPaidAndGenerateInvoice on the backend).',
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK')),
          ],
        ),
      );
      setState(() => _quantities.clear());
    } catch (e) {
      setState(() => _errorMessage = OrderService.messageFor(e));
    } finally {
      setState(() => _isPlacingOrder = false);
    }
  }

  int get _itemCount => _quantities.values.where((q) => q > 0).length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Order Medicine')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _franchiseIdController,
                    decoration: const InputDecoration(
                      labelText: 'Franchise ID',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _isLoadingProducts ? null : _loadProducts,
                  child: const Text('Load'),
                ),
              ],
            ),
            if (_errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
              ),
            const SizedBox(height: 12),
            if (_isLoadingProducts) const Center(child: CircularProgressIndicator()),
            if (_products != null)
              Expanded(
                child: _products!.isEmpty
                    ? const Center(child: Text('No products found for this franchise'))
                    : ListView.builder(
                        itemCount: _products!.length,
                        itemBuilder: (context, index) {
                          final product = _products![index];
                          final quantity = _quantities[product.id] ?? 0;

                          return Card(
                            child: ListTile(
                              title: Text(product.name),
                              subtitle: Text(
                                '₹${product.price.toStringAsFixed(2)}'
                                '${product.unit != null ? ' / ${product.unit}' : ''}'
                                ' • ${product.stockQuantity} in stock',
                              ),
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
            if (_products != null && _products!.isNotEmpty)
              ElevatedButton(
                onPressed: (_itemCount > 0 && !_isPlacingOrder) ? _placeOrder : null,
                child: _isPlacingOrder
                    ? const SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text('Place Order ($_itemCount item${_itemCount == 1 ? '' : 's'})'),
              ),
          ],
        ),
      ),
    );
  }
}
