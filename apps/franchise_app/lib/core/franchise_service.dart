import '../models/franchise_profile.dart';
import 'api_client.dart';

class FranchiseService {
  Future<FranchiseProfile> getProfile() async {
    final response = await ApiClient.instance.dio.get<Map<String, dynamic>>('/api/franchise/profile');
    return FranchiseProfile.fromJson(response.data!);
  }

  Future<FranchiseProfile> updateBranding({
    required String name,
    String? gstin,
    String? contactPhone,
    String? contactEmail,
    String? logoUrl,
    required String accentColorHex,
    required InvoiceFont invoiceFont,
    String? invoiceFooterNote,
    String? invoicePrefix,
  }) async {
    final response = await ApiClient.instance.dio.put<Map<String, dynamic>>(
      '/api/franchise/profile',
      data: {
        'name': name,
        'gstin': gstin,
        'contactPhone': contactPhone,
        'contactEmail': contactEmail,
        'logoUrl': logoUrl,
        'accentColorHex': accentColorHex,
        'invoiceFont': invoiceFontToJson(invoiceFont),
        'invoiceFooterNote': invoiceFooterNote,
        'invoicePrefix': invoicePrefix,
      },
    );
    return FranchiseProfile.fromJson(response.data!);
  }
}
