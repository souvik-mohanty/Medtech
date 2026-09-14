/// The only file that differs in substance between the 6 role apps — role
/// display name and whether login requires a franchise/clinic/store ID.
class AppConfig {
  AppConfig._();

  static const String roleName = 'Franchise Owner';

  /// Doctor, Lab Technician, Delivery Partner apps must set this true —
  /// their accounts are scoped to one franchise and the backend rejects
  /// login without a matching franchiseId.
  static const bool requiresFranchiseId = false;

  /// Must equal the backend's `google.oauth.client-id`
  /// (medtech/src/main/resources/application.yml) so the ID token's `aud`
  /// claim passes backend verification. Configure the Google Sign-In
  /// platform files (google-services.json / GoogleService-Info.plist) per
  /// https://pub.dev/packages/google_sign_in before this will work.
  static const String googleServerClientId = '688656564041-ou8cogslqaon8gfafstqqe38jpvackn6.apps.googleusercontent.com';
}
