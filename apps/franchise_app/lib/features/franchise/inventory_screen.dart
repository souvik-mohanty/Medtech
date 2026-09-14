import 'package:flutter/material.dart';

import '../../core/api_error.dart';
import '../../core/product_service.dart';
import '../../models/product.dart';

/// Sample screen: the catalog billing selects products from.
class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final _productService = ProductService();

  List<Product>? _products;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final products = await _productService.listProducts();
      setState(() => _products = products);
    } catch (e) {
      setState(() => _errorMessage = apiErrorMessage(e));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _showAddProductDialog() async {
    final nameController = TextEditingController();
    final unitController = TextEditingController();
    final priceController = TextEditingController();
    final stockController = TextEditingController();
    final gstController = TextEditingController(text: '0');

    final created = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add product'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Name')),
              TextField(controller: unitController, decoration: const InputDecoration(labelText: 'Unit (e.g. strip)')),
              TextField(
                controller: priceController,
                decoration: const InputDecoration(labelText: 'Price'),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
              ),
              TextField(
                controller: stockController,
                decoration: const InputDecoration(labelText: 'Stock quantity'),
                keyboardType: TextInputType.number,
              ),
              TextField(
                controller: gstController,
                decoration: const InputDecoration(labelText: 'GST %'),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Add')),
        ],
      ),
    );

    if (created != true) return;

    try {
      await _productService.createProduct(
        name: nameController.text.trim(),
        unit: unitController.text.trim(),
        price: double.tryParse(priceController.text.trim()) ?? 0,
        stockQuantity: int.tryParse(stockController.text.trim()) ?? 0,
        gstPercentage: double.tryParse(gstController.text.trim()) ?? 0,
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)))
              : RefreshIndicator(
                  // ListView in both branches — RefreshIndicator needs a
                  // scrollable descendant to detect the pull gesture, even
                  // when the list is empty.
                  onRefresh: _load,
                  child: _products!.isEmpty
                      ? ListView(
                          children: const [
                            SizedBox(height: 120),
                            Center(child: Text('No products yet — tap + to add one')),
                          ],
                        )
                      : ListView.builder(
                          itemCount: _products!.length,
                          itemBuilder: (context, index) {
                            final product = _products![index];
                            return ListTile(
                              title: Text(product.name),
                              subtitle: Text(
                                '₹${product.price.toStringAsFixed(2)}'
                                '${product.unit != null && product.unit!.isNotEmpty ? ' / ${product.unit}' : ''}'
                                ' • GST ${product.gstPercentage.toStringAsFixed(0)}%',
                              ),
                              trailing: Text('${product.stockQuantity} in stock'),
                            );
                          },
                        ),
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddProductDialog,
        child: const Icon(Icons.add),
      ),
    );
  }
}
