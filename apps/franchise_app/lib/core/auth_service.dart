import 'package:google_sign_in/google_sign_in.dart';

import '../models/auth_response.dart';
import 'api_client.dart';
import 'app_config.dart';
import 'token_storage.dart';

class AuthService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: const ['email'],
    serverClientId: AppConfig.googleServerClientId,
  );

  Future<AuthResponse> signIn({String? franchiseId}) async {
    final account = await _googleSignIn.signIn();
    if (account == null) {
      throw Exception('Google sign-in was cancelled');
    }

    final googleAuth = await account.authentication;
    final idToken = googleAuth.idToken;
    if (idToken == null) {
      throw Exception('Google did not return an ID token');
    }

    final response = await ApiClient.instance.dio.post<Map<String, dynamic>>(
      '/api/auth/oauth/google',
      data: {
        'idToken': idToken,
        if (franchiseId != null && franchiseId.isNotEmpty) 'franchiseId': franchiseId,
      },
    );

    final authResponse = AuthResponse.fromJson(response.data!);
    await TokenStorage.instance.save(authResponse.token, authResponse.role);
    return authResponse;
  }

  Future<void> signOut() async {
    await _googleSignIn.signOut();
    await TokenStorage.instance.clear();
  }
}
