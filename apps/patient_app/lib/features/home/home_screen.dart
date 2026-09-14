import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_config.dart';
import '../../core/auth_controller.dart';
import '../orders/franchise_products_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

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
          ListTile(
            leading: const Icon(Icons.medication_outlined),
            title: const Text('Order Medicine'),
            subtitle: const Text('Browse a franchise\'s catalog and place an online order'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const FranchiseProductsScreen()),
            ),
          ),
        ],
      ),
    );
  }
}
