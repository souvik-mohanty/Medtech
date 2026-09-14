import 'package:flutter/material.dart';

import '../../core/api_error.dart';
import '../../core/payment_gateway_service.dart';
import '../../models/payment_gateway_status.dart';

/// Sample screen: configure the franchise's own Razorpay/PhonePe credentials.
/// If nothing is configured (or it's disabled), the backend rejects online
/// orders outright and every sale falls back to cash — see
/// BillingService#createOnlineOrder on the backend.
class PaymentGatewayScreen extends StatefulWidget {
  const PaymentGatewayScreen({super.key});

  @override
  State<PaymentGatewayScreen> createState() => _PaymentGatewayScreenState();
}

class _PaymentGatewayScreenState extends State<PaymentGatewayScreen> {
  final _paymentGatewayService = PaymentGatewayService();
  final _apiKeyController = TextEditingController();
  final _apiSecretController = TextEditingController();

  PaymentProvider _provider = PaymentProvider.razorpay;
  PaymentGatewayStatus? _status;

  bool _isLoading = true;
  bool _isSaving = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _apiKeyController.dispose();
    _apiSecretController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final status = await _paymentGatewayService.getStatus();
      setState(() => _status = status);
    } catch (e) {
      setState(() => _errorMessage = apiErrorMessage(e));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _save() async {
    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      final status = await _paymentGatewayService.configure(
        provider: _provider,
        apiKey: _apiKeyController.text.trim(),
        apiSecret: _apiSecretController.text.trim(),
      );
      setState(() {
        _status = status;
        _apiKeyController.clear();
        _apiSecretController.clear();
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment gateway configured — online payment enabled')),
      );
    } catch (e) {
      setState(() => _errorMessage = apiErrorMessage(e));
    } finally {
      setState(() => _isSaving = false);
    }
  }

  Future<void> _disable() async {
    setState(() => _isSaving = true);
    try {
      final status = await _paymentGatewayService.disable();
      setState(() => _status = status);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Online payment disabled — cash only until reconfigured')),
      );
    } catch (e) {
      setState(() => _errorMessage = apiErrorMessage(e));
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final status = _status;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (_errorMessage != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
          ),
        Card(
          color: (status?.active ?? false) ? Colors.green.shade50 : Colors.orange.shade50,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  (status?.active ?? false)
                      ? 'Online payment is ENABLED (${status!.provider.name}, key ${status.maskedApiKey})'
                      : status?.configured == true
                          ? 'Online payment is OFF — re-enter your credentials below to re-enable it '
                              '(the secret is never returned, so it can\'t be restored automatically)'
                          : 'Online payment is OFF — every sale is cash-only until you configure a gateway',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        const Text('Configure a gateway', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        DropdownButtonFormField<PaymentProvider>(
          value: _provider,
          decoration: const InputDecoration(labelText: 'Provider', border: OutlineInputBorder()),
          items: const [
            DropdownMenuItem(value: PaymentProvider.razorpay, child: Text('Razorpay')),
            DropdownMenuItem(value: PaymentProvider.phonepe, child: Text('PhonePe')),
          ],
          onChanged: (value) => setState(() => _provider = value ?? PaymentProvider.razorpay),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _apiKeyController,
          decoration: InputDecoration(
            labelText: _provider == PaymentProvider.razorpay ? 'Key ID' : 'Merchant ID',
            border: const OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _apiSecretController,
          obscureText: true,
          decoration: InputDecoration(
            labelText: _provider == PaymentProvider.razorpay ? 'Key Secret' : 'Salt Key',
            border: const OutlineInputBorder(),
            helperText: 'Encrypted at rest, never shown again after saving',
          ),
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _isSaving ? null : _save,
          child: _isSaving
              ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Save'),
        ),
        if (status?.configured == true) ...[
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: _isSaving ? null : _disable,
            child: const Text('Disable online payment'),
          ),
        ],
      ],
    );
  }
}
