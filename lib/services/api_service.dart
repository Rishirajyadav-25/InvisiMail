// lib/services/api_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  final String baseUrl = 'https://www.codetodo.me/api';

  // --- No changes to login() or register() ---
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/signin'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    // ... same login code as before
    final status = response.statusCode;
    Map<String, dynamic>? decoded;
    try {
      decoded = jsonDecode(response.body) as Map<String, dynamic>?;
    } catch (_) {
      decoded = null;
    }
    String? token;
    if (decoded != null) {
      token = decoded['token']?.toString();
    }
    String? message;
    if (status < 200 || status >= 300) {
      if (decoded != null) {
        message = decoded['message']?.toString() ?? decoded['error']?.toString() ?? decoded.toString();
      } else if (response.body.isNotEmpty) {
        message = response.body;
      } else {
        message = 'Request failed with status $status';
      }
    }
    String? cookieHeader;
    final setCookie = response.headers['set-cookie'];
    if (setCookie != null && setCookie.isNotEmpty) {
      try {
        cookieHeader = setCookie.split(',').map((seg) => seg.split(';').first).join('; ');
      } catch (_) {
        cookieHeader = setCookie;
      }
    }
    return {
      'status': status,
      'ok': status >= 200 && status < 300,
      'token': token,
      'body': decoded ?? {'raw': response.body},
      'error': message,
      'cookie': cookieHeader,
    };
  }

  Future<Map<String, dynamic>?> fetchDashboardWithCookie(String cookieHeader) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/user'),
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieHeader,
        },
      );
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic>) return {'user': decoded};
        return null;
      }
    } catch (_) {}
    return null;
  }

  // *** NEW FUNCTION to fetch emails from your backend ***
  Future<List<dynamic>> fetchEmails({
    required String cookie,
    String mailType = 'all',
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/inbox?type=$mailType&page=$page&limit=$limit');
      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookie,
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['emails'] as List<dynamic>;
      } else {
        print('Failed to load emails: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('Error fetching emails: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>> register(String name, String email, String password) async {
    // ... same register code as before
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
    return {
      'status': status,
      'ok': status >= 200 && status < 300,
      'body': decoded ?? {'raw': response.body},
    };
  }
}