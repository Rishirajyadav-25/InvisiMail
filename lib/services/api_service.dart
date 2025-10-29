// lib/services/api_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  final String baseUrl = 'https://www.codetodo.me/api'; // Make sure this is your correct backend URL

  // --- Login ---
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/signin'),
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

  // --- Fetch Dashboard with Cookie ---
  Future<Map<String, dynamic>?> fetchDashboardWithCookie(String cookieHeader) async {
    // --- START: Added for debugging ---
    print('--- [API] Validating cookie: $cookieHeader');
    // --- END: Added for debugging ---

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/user'),
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieHeader,
        },
      );

      // --- START: Added for debugging ---
      print('--- [API] Validation response status: ${response.statusCode}');
      // --- END: Added for debugging ---

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);

        // --- START: Added for debugging ---
        print('--- [API] Validation success, data: $decoded');
        // --- END: Added for debugging ---

        if (decoded is Map<String, dynamic>) return {'user': decoded};
        return null;
      } else {
        // --- START: Added for debugging ---
        print('--- [API] Validation failed, body: ${response.body}');
        // --- END: Added for debugging ---
        return null;
      }
    } catch (e) {
      // --- START: Added for debugging ---
      print('--- [API] Validation error: $e');
      // --- END: Added for debugging ---
      return null;
    }
  }

  // --- Fetch Emails ---
  Future<List<dynamic>> fetchEmails({
    required String cookie,
    String mailType = 'all', // Ensure this matches backend expectation (received, sent, spam, all)
    int page = 1,
    int limit = 20,
  }) async {
    try {
      // Using /inbox endpoint based on backend code
      final uri = Uri.parse('$baseUrl/inbox?type=$mailType&page=$page&limit=$limit');
      print('--- [API] Fetching emails from: $uri'); // Debugging URI

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookie,
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Ensure the response has the 'emails' key as expected
        if (data is Map<String, dynamic> && data.containsKey('emails') && data['emails'] is List) {
          return data['emails'] as List<dynamic>;
        } else {
          print('--- [API] Unexpected email data format: $data');
          return [];
        }
      } else {
        print('--- [API] Failed to load emails: ${response.statusCode} - ${response.body}');
        return [];
      }
    } catch (e) {
      print('--- [API] Error fetching emails: $e');
      return [];
    }
  }

  // --- Fetch Aliases ---
  Future<List<dynamic>> fetchAliases({required String cookie}) async {
    try {
      final uri = Uri.parse('$baseUrl/aliases');
      print('--- [API] Fetching aliases from: $uri'); // Debug URI

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookie,
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is List) {
          return data;
        } else {
          print('--- [API] Unexpected alias data format: $data');
          return [];
        }
      } else {
        print('--- [API] Failed to load aliases: ${response.statusCode} - ${response.body}');
        return [];
      }
    } catch (e) {
      print('--- [API] Error fetching aliases: $e');
      return [];
    }
  }

  // --- Create Alias ---
  Future<Map<String, dynamic>> createAlias({
    required String aliasName,
    required String cookie,
    bool isCollaborative = false,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/aliases');
      print('--- [API] Creating alias at: $uri with name: $aliasName'); // Debug URI and Data

      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookie,
        },
        body: jsonEncode({
          'alias': aliasName, // Match backend API expectation
          'isCollaborative': isCollaborative,
        }),
      );

      final status = response.statusCode;
      Map<String, dynamic>? decoded;
      try {
        decoded = jsonDecode(response.body) as Map<String, dynamic>?;
      } catch (_) {
        decoded = null;
      }

      print('--- [API] Create alias response status: $status'); // Debug Status
      print('--- [API] Create alias response body: ${response.body}'); // Debug Body


      String? message;
      if (status < 200 || status >= 300) {
        if (decoded != null) {
          message = decoded['error']?.toString() ?? decoded['message']?.toString() ?? decoded.toString();
        } else {
          message = response.body.isNotEmpty ? response.body : 'Request failed with status $status';
        }
        print('--- [API] Create alias error message: $message'); // Debug error message
      }

      return {
        'status': status,
        'ok': status >= 200 && status < 300,
        'body': decoded ?? {'raw': response.body},
        'error': message,
      };
    } catch (e) {
      print('--- [API] Error creating alias: $e');
      return {
        'status': 500,
        'ok': false,
        'error': 'Network error: $e',
      };
    }
  }

  // *** Send Email ---
  Future<Map<String, dynamic>> sendEmail({
    required String cookie,
    required String fromAlias,
    required String to,
    required String subject,
    required String body,
  }) async {
    try {
      // *** MODIFIED: Changed endpoint from /send to /send-email ***
      final uri = Uri.parse('$baseUrl/send-email');
      print('--- [API] Sending email from: $fromAlias to: $to via $uri'); // Updated log

      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookie,
        },
        body: jsonEncode({
          'from': fromAlias, // Check if backend expects 'from' or 'fromAlias'
          'to': to,
          'subject': subject,
          'text': body, // Backend code uses 'text', ensure this matches
        }),
      );

      final status = response.statusCode;
      Map<String, dynamic>? decoded;
      try {
        decoded = jsonDecode(response.body) as Map<String, dynamic>?;
      } catch (_) {
        decoded = null;
      }

      print('--- [API] Send email response status: $status');
      print('--- [API] Send email response body: ${response.body}');

      String? message;
      if (status < 200 || status >= 300) {
        if (decoded != null) {
          message = decoded['error']?.toString() ?? decoded['message']?.toString() ?? decoded.toString();
        } else {
          message = response.body.isNotEmpty ? response.body : 'Request failed with status $status';
        }
        print('--- [API] Send email error: $message');
      }

      return {
        'status': status,
        'ok': status >= 200 && status < 300,
        'body': decoded ?? {'raw': response.body},
        'error': message,
      };
    } catch (e) {
      print('--- [API] Error sending email: $e');
      return {
        'status': 500,
        'ok': false,
        'error': 'Network error: $e',
      };
    }
  }

  // --- Register ---
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
    String? message; // Add error message handling similar to login/createAlias
    if (status < 200 || status >= 300) {
      if (decoded != null) {
        message = decoded['error']?.toString() ?? decoded['message']?.toString() ?? decoded.toString();
      } else {
        message = response.body.isNotEmpty ? response.body : 'Request failed with status $status';
      }
    }
    return {
      'status': status,
      'ok': status >= 200 && status < 300,
      'body': decoded ?? {'raw': response.body},
      'error': message, // Include error message in response
    };
  }
}