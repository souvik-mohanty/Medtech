import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_config.dart';
import '../../core/auth_controller.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _franchiseIdController = TextEditingController();

  @override
  void dispose() {
    _franchiseIdController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${AppConfig.roleName} Login',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 24),
                if (AppConfig.requiresFranchiseId)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: TextField(
                      controller: _franchiseIdController,
                      decoration: const InputDecoration(
                        labelText: 'Franchise / Clinic / Store ID',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                if (auth.errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      auth.errorMessage!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
                ElevatedButton.icon(
                  onPressed: auth.isLoading ? null : _signIn,
                  icon: const Icon(Icons.login),
                  label: auth.isLoading
                      ? const SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Sign in with Google'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _signIn() {
    context.read<AuthController>().signIn(
          franchiseId: AppConfig.requiresFranchiseId
              ? _franchiseIdController.text.trim()
              : null,
        );
  }
}
