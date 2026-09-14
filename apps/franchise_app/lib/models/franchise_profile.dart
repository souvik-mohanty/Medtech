/// Mirrors the backend's InvoiceFont enum (com.company.medtech.franchise.model)
/// — values map to DEFAULT/SERIF/MONOSPACE on the wire, see [invoiceFontToJson].
enum InvoiceFont { defaultFont, serif, monospace }

InvoiceFont invoiceFontFromJson(String value) {
  switch (value) {
    case 'SERIF':
      return InvoiceFont.serif;
    case 'MONOSPACE':
      return InvoiceFont.monospace;
    default:
      return InvoiceFont.defaultFont;
  }
}

String invoiceFontToJson(InvoiceFont font) {
  switch (font) {
    case InvoiceFont.serif:
      return 'SERIF';
    case InvoiceFont.monospace:
      return 'MONOSPACE';
    case InvoiceFont.defaultFont:
      return 'DEFAULT';
  }
}

class FranchiseProfile {
  FranchiseProfile({
    required this.id,
    required this.name,
    this.gstin,
    this.contactPhone,
    this.contactEmail,
    this.logoUrl,
    required this.accentColorHex,
    required this.invoiceFont,
    this.invoiceFooterNote,
    this.invoicePrefix,
  });

  final String id;
  final String name;
  final String? gstin;
  final String? contactPhone;
  final String? contactEmail;
  final String? logoUrl;
  final String accentColorHex;
  final InvoiceFont invoiceFont;
  final String? invoiceFooterNote;
  final String? invoicePrefix;

  factory FranchiseProfile.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>;
    return FranchiseProfile(
      id: data['id'] as String,
      name: data['name'] as String,
      gstin: data['gstin'] as String?,
      contactPhone: data['contactPhone'] as String?,
      contactEmail: data['contactEmail'] as String?,
      logoUrl: data['logoUrl'] as String?,
      accentColorHex: data['accentColorHex'] as String? ?? '#1F8A70',
      invoiceFont: invoiceFontFromJson(data['invoiceFont'] as String? ?? 'DEFAULT'),
      invoiceFooterNote: data['invoiceFooterNote'] as String?,
      invoicePrefix: data['invoicePrefix'] as String?,
    );
  }
}
