class Product {
  Product({
    required this.id,
    required this.name,
    required this.unit,
    required this.price,
    required this.stockQuantity,
    required this.gstPercentage,
  });

  final String id;
  final String name;
  final String? unit;
  final double price;
  final int stockQuantity;
  final double gstPercentage;

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] as String,
      name: json['name'] as String,
      unit: json['unit'] as String?,
      price: (json['price'] as num).toDouble(),
      stockQuantity: json['stockQuantity'] as int,
      gstPercentage: (json['gstPercentage'] as num?)?.toDouble() ?? 0,
    );
  }
}
