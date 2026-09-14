import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_config.dart';
import '../../core/auth_controller.dart';

/// Sample screen only — there is no Doctor Consultation Booking backend
/// module yet (docs/PROJECT_SPEC.md § 4.3), so this list is static mock
/// data illustrating the intended UI, not a real API call. Replace with a
/// real appointments fetch once that module exists.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  static final _mockAppointments = [
    (patient: 'Aarav Sharma', time: '10:00 AM', status: 'Confirmed'),
    (patient: 'Priya Nair', time: '10:30 AM', status: 'Confirmed'),
    (patient: 'Rohan Gupta', time: '11:15 AM', status: 'Pending payment'),
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
                'Today\'s Appointments (sample data — booking module not built yet)',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _mockAppointments.length,
              itemBuilder: (context, index) {
                final appointment = _mockAppointments[index];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.person_outline),
                    title: Text(appointment.patient),
                    subtitle: Text(appointment.time),
                    trailing: Chip(label: Text(appointment.status)),
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
