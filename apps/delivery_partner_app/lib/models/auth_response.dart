class AuthResponse {
  AuthResponse({required this.token, required this.role});

  final String token;
  final String role;

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>;
    return AuthResponse(
      token: data['token'] as String,
      role: data['role'] as String,
    );
  }
}
