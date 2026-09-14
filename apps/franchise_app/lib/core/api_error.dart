import 'package:dio/dio.dart';

/// Backend errors arrive as {success:false, message:"..."} — surface that
/// message instead of a generic Dio error.
String apiErrorMessage(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['message'] is String) {
      return data['message'] as String;
    }
  }
  return error.toString();
}
