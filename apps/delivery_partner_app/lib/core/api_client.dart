import 'package:dio/dio.dart';

import 'token_storage.dart';

class ApiClient {
  ApiClient._internal() : dio = Dio(BaseOptions(baseUrl: baseUrl)) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await TokenStorage.instance.readToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  static final ApiClient instance = ApiClient._internal();

  /// Override per build with --dart-define=API_BASE_URL=https://your-host.
  /// Defaults to the Android emulator's alias for the host machine's
  /// localhost; use http://localhost:8080 for iOS simulator / web / desktop.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8080',
  );

  final Dio dio;
}
