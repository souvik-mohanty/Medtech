import 'package:flutter/material.dart';

import '../../core/api_error.dart';
import '../../core/franchise_service.dart';
import '../../models/franchise_profile.dart';

/// Sample screen: view/edit the franchise's invoice branding — logo, accent
/// color, font, footer note, GSTIN/contact. Deliberately structured fields,
/// not a free-form HTML/CSS editor — see InvoiceFont on the backend.
class BrandingScreen extends StatefulWidget {
  const BrandingScreen({super.key});

  @override
  State<BrandingScreen> createState() => _BrandingScreenState();
}

class _BrandingScreenState extends State<BrandingScreen> {
  final _franchiseService = FranchiseService();

  final _nameController = TextEditingController();
  final _gstinController = TextEditingController();
  final _contactPhoneController = TextEditingController();
  final _contactEmailController = TextEditingController();
  final _logoUrlController = TextEditingController();
  final _accentColorController = TextEditingController();
  final _footerNoteController = TextEditingController();
  final _invoicePrefixController = TextEditingController();

  InvoiceFont _invoiceFont = InvoiceFont.defaultFont;

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
    _nameController.dispose();
    _gstinController.dispose();
    _contactPhoneController.dispose();
    _contactEmailController.dispose();
    _logoUrlController.dispose();
    _accentColorController.dispose();
    _footerNoteController.dispose();
    _invoicePrefixController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final profile = await _franchiseService.getProfile();
      _nameController.text = profile.name;
      _gstinController.text = profile.gstin ?? '';
      _contactPhoneController.text = profile.contactPhone ?? '';
      _contactEmailController.text = profile.contactEmail ?? '';
      _logoUrlController.text = profile.logoUrl ?? '';
      _accentColorController.text = profile.accentColorHex;
      _footerNoteController.text = profile.invoiceFooterNote ?? '';
      _invoicePrefixController.text = profile.invoicePrefix ?? '';
      _invoiceFont = profile.invoiceFont;
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
      await _franchiseService.updateBranding(
        name: _nameController.text.trim(),
        gstin: _gstinController.text.trim(),
        contactPhone: _contactPhoneController.text.trim(),
        contactEmail: _contactEmailController.text.trim(),
        logoUrl: _logoUrlController.text.trim(),
        accentColorHex: _accentColorController.text.trim(),
        invoiceFont: _invoiceFont,
        invoiceFooterNote: _footerNoteController.text.trim(),
        invoicePrefix: _invoicePrefixController.text.trim(),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Branding updated')),
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

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (_errorMessage != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
          ),
        TextField(
          controller: _nameController,
          decoration: const InputDecoration(labelText: 'Business name', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _gstinController,
          decoration: const InputDecoration(labelText: 'GSTIN', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _contactPhoneController,
          decoration: const InputDecoration(labelText: 'Contact phone', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _contactEmailController,
          decoration: const InputDecoration(labelText: 'Contact email', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _logoUrlController,
          decoration: const InputDecoration(
            labelText: 'Logo URL',
            border: OutlineInputBorder(),
            helperText: 'File upload isn\'t built yet — host the image elsewhere and paste its URL',
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _accentColorController,
          decoration: const InputDecoration(
            labelText: 'Accent color (hex)',
            border: OutlineInputBorder(),
            helperText: 'e.g. #1F8A70',
          ),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<InvoiceFont>(
          value: _invoiceFont,
          decoration: const InputDecoration(labelText: 'Invoice font', border: OutlineInputBorder()),
          items: const [
            DropdownMenuItem(value: InvoiceFont.defaultFont, child: Text('Default (sans-serif)')),
            DropdownMenuItem(value: InvoiceFont.serif, child: Text('Serif')),
            DropdownMenuItem(value: InvoiceFont.monospace, child: Text('Monospace')),
          ],
          onChanged: (value) => setState(() => _invoiceFont = value ?? InvoiceFont.defaultFont),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _invoicePrefixController,
          decoration: const InputDecoration(
            labelText: 'Invoice number prefix',
            border: OutlineInputBorder(),
            helperText: 'e.g. MTC — falls back to a code derived from the franchise ID if left blank',
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _footerNoteController,
          decoration: const InputDecoration(labelText: 'Invoice footer note', border: OutlineInputBorder()),
          maxLines: 2,
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _isSaving ? null : _save,
          child: _isSaving
              ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Save branding'),
        ),
      ],
    );
  }
}
