import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_config.dart';
import '../../core/auth_controller.dart';

/// Sample screen only — there is no support-ticket backend module yet (it
/// was explicitly deferred when Customer Support was added as a role), so
/// this list is static mock data illustrating the intended UI, not a real
/// API call. Replace with a real ticket-queue fetch once that module exists.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  static final _mockTickets = [
    (subject: 'Refund not received for order MTC-000098', requester: 'Aarav Sharma', status: 'Open'),
    (subject: 'Unable to book doctor appointment', requester: 'Priya Nair', status: 'In progress'),
    (subject: 'Wrong medicine delivered', requester: 'Rohan Gupta', status: 'Resolved'),
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
                'Support Tickets (sample data — support module not built yet)',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _mockTickets.length,
              itemBuilder: (context, index) {
                final ticket = _mockTickets[index];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.support_agent_outlined),
                    title: Text(ticket.subject),
                    subtitle: Text('From ${ticket.requester}'),
                    trailing: Chip(label: Text(ticket.status)),
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
