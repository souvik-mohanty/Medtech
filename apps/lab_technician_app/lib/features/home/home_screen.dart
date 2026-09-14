import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_config.dart';
import '../../core/auth_controller.dart';

/// Sample screen only — there is no Lab Test Booking backend module yet
/// (docs/PROJECT_SPEC.md § 4.4), so this list is static mock data
/// illustrating the intended UI, not a real API call. Replace with a real
/// assigned-tests fetch once that module exists.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  static final _mockTests = [
    (test: 'Complete Blood Count', patient: 'Aarav Sharma', collection: 'Home', status: 'Pending collection'),
    (test: 'Lipid Profile', patient: 'Priya Nair', collection: 'Lab Visit', status: 'Sample collected'),
    (test: 'Thyroid Panel', patient: 'Rohan Gupta', collection: 'Home', status: 'Report uploaded'),
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
                'Assigned Lab Tests (sample data — lab module not built yet)',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _mockTests.length,
              itemBuilder: (context, index) {
                final test = _mockTests[index];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.biotech_outlined),
                    title: Text(test.test),
                    subtitle: Text('${test.patient} • ${test.collection} collection'),
                    trailing: Chip(label: Text(test.status)),
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
