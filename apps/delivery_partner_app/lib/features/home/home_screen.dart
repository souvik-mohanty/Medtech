import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_config.dart';
import '../../core/auth_controller.dart';

/// Sample screen only — there is no delivery-assignment backend module yet,
/// so this list is static mock data illustrating the intended UI, not a
/// real API call. Replace with a real delivery-queue fetch once that
/// module exists.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  static final _mockDeliveries = [
    (orderId: 'MTC-000123', address: '12 MG Road, Bengaluru', status: 'Ready for pickup'),
    (orderId: 'MTC-000124', address: '45 Brigade Road, Bengaluru', status: 'Out for delivery'),
    (orderId: 'MTC-000125', address: '7 Indiranagar, Bengaluru', status: 'Delivered'),
  ];

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    return Scaffold(
      appBar: AppBar(
        title: Text('${AppConfig.roleName} Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => context.read<AuthController>().signOut(),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text('Signed in as ${auth.role ?? AppConfig.roleName}'),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Delivery Queue (sample data — delivery module not built yet)',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _mockDeliveries.length,
              itemBuilder: (context, index) {
                final delivery = _mockDeliveries[index];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.local_shipping_outlined),
                    title: Text(delivery.orderId),
                    subtitle: Text(delivery.address),
                    trailing: Chip(label: Text(delivery.status)),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
