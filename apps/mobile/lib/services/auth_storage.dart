import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure token & session storage for the Foodie Café mobile application.
/// Uses iOS Keychain and Android EncryptedSharedPreferences (KeyStore-backed).
class AuthStorageService {
  static const String _accessTokenKey = 'cafe_access_token';
  static const String _refreshTokenKey = 'cafe_refresh_token';
  static const String _userIdKey = 'cafe_user_id';
  static const String _userRoleKey = 'cafe_user_role';

  final FlutterSecureStorage _storage;

  AuthStorageService({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(
                encryptedSharedPreferences: true,
              ),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock,
              ),
            );

  /// Saves auth tokens received from login or token refresh.
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
    String? userId,
    String? role,
  }) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
    if (userId != null) {
      await _storage.write(key: _userIdKey, value: userId);
    }
    if (role != null) {
      await _storage.write(key: _userRoleKey, value: role);
    }
  }

  /// Gets the currently stored JWT access token.
  Future<String?> getAccessToken() async {
    return await _storage.read(key: _accessTokenKey);
  }

  /// Gets the stored refresh token for token rotation.
  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  /// Gets the stored user id.
  Future<String?> getUserId() async {
    return await _storage.read(key: _userIdKey);
  }

  /// Gets the stored user role.
  Future<String?> getUserRole() async {
    return await _storage.read(key: _userRoleKey);
  }

  /// Checks if user has a stored session token.
  Future<bool> isAuthenticated() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }

  /// Clears all stored auth tokens on logout.
  Future<void> clearAuth() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
    await _storage.delete(key: _userIdKey);
    await _storage.delete(key: _userRoleKey);
  }
}

