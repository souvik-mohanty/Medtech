import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_config.dart';
import '../../core/auth_controller.dart';
import '../franchise/billing_screen.dart';
import '../franchise/branding_screen.dart';
import '../franchise/inventory_screen.dart';
import '../franchise/payment_gateway_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tabIndex = 0;

  static const List<({String label, IconData icon, Widget screen})> _tabs = [
    (label: 'Billing', icon: Icons.point_of_sale, screen: BillingScreen()),
    (label: 'Inventory', icon: Icons.inventory_2_outlined, screen: InventoryScreen()),
    (label: 'Branding', icon: Icons.palette_outlined, screen: BrandingScreen()),
    (label: 'Payments', icon: Icons.payments_outlined, screen: PaymentGatewayScreen()),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${AppConfig.roleName} — ${_tabs[_tabIndex].label}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => context.read<AuthController>().signOut(),
          ),
        ],
      ),
      body: _tabs[_tabIndex].screen,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tabIndex,
        onDestinationSelected: (index) => setState(() => _tabIndex = index),
        destinations: [
          for (final tab in _tabs) NavigationDestination(icon: Icon(tab.icon), label: tab.label),
        ],
      ),
    );
  }
}
