import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  final String baseUrl = 'https://www.codetodo.me/api';

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/signin'), // Ensure this is your correct login endpoint
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    final status = response.statusCode;
    Map<String, dynamic>? decoded;
    try {
      decoded = jsonDecode(response.body) as Map<String, dynamic>?;
    } catch (_) {
      decoded = null;
    }
    // Try to extract a token using common field names
    String? token;
    if (decoded != null) {
      token = decoded['token']?.toString()
          ?? decoded['accessToken']?.toString()
          ?? decoded['access_token']?.toString()
          ?? decoded['jwt']?.toString();

      // Some APIs nest the response under `data`
      if (token == null && decoded.containsKey('data')) {
        final data = decoded['data'];
        if (data is Map<String, dynamic>) {
          token = data['token']?.toString()
              ?? data['accessToken']?.toString()
              ?? data['access_token']?.toString()
              ?? data['jwt']?.toString();
        }
      }
    }

    // Try to extract a friendly error message if not ok
    String? message;
    if (status < 200 || status >= 300) {
      if (decoded != null) {
        message = decoded['message']?.toString()
            ?? decoded['error']?.toString()
            ?? decoded.toString();
      } else if (response.body.isNotEmpty) {
        message = response.body;
      } else {
        message = 'Request failed with status $status';
      }
    }

    return {
      'status': status,
      'ok': status >= 200 && status < 300,
      'token': token,
      'body': decoded ?? {'raw': response.body},
      'error': message,
    };
  }

  /// Register a new user. Returns decoded JSON on success (status 200 or 201).
  /// Throws on non-success status with the response body included.
  Future<Map<String, dynamic>> register(String name, String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );

    final status = response.statusCode;
    Map<String, dynamic>? decoded;
    try {
      decoded = jsonDecode(response.body) as Map<String, dynamic>?;
    } catch (_) {
      decoded = null;
    }

    String? token;
    if (decoded != null) {
      token = decoded['token']?.toString()
          ?? decoded['accessToken']?.toString()
          ?? decoded['access_token']?.toString()
          ?? decoded['jwt']?.toString();

      if (token == null && decoded.containsKey('data')) {
        final data = decoded['data'];
        if (data is Map<String, dynamic>) {
          token = data['token']?.toString() ?? data['accessToken']?.toString();
        }
      }
    }

    String? message;
    if (status < 200 || status >= 300) {
      if (decoded != null) {
        message = decoded['message']?.toString() ?? decoded['error']?.toString() ?? decoded.toString();
      } else if (response.body.isNotEmpty) {
        message = response.body;
      } else {
        message = 'Register failed with status $status';
      }
    }

    return {
      'status': status,
      'ok': status >= 200 && status < 300,
      'token': token,
      'body': decoded ?? {'raw': response.body},
      'error': message,
    };
  }
}
