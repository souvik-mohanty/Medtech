import 'package:flutter/foundation.dart';

import 'auth_service.dart';
import 'token_storage.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthController extends ChangeNotifier {
  AuthController(this._authService);

  final AuthService _authService;

  AuthStatus status = AuthStatus.unknown;
  String? role;
  String? errorMessage;
  bool isLoading = false;

  Future<void> restoreSession() async {
    final token = await TokenStorage.instance.readToken();
    role = await TokenStorage.instance.readRole();
    status = token != null ? AuthStatus.authenticated : AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<void> signIn({String? franchiseId}) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _authService.signIn(franchiseId: franchiseId);
      role = response.role;
      status = AuthStatus.authenticated;
    } catch (e) {
      errorMessage = e.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await _authService.signOut();
    role = null;
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }
}
