// lib/screens/auth/login_screen.dart

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../services/api_service.dart';
import '../dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  bool isLoading = false;

  Future<void> login() async {
    final email = emailController.text.trim();
    final password = passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Please enter email and password')));
      return;
    }

    setState(() { isLoading = true; });

    try {
      final api = ApiService();
      final result = await api.login(email, password);
      final ok = result['ok'] as bool? ?? false;
      final token = result['token'] as String?;
      final cookie = result['cookie'] as String?;

      if (ok) {
        final prefs = await SharedPreferences.getInstance();

        // *** NEW: Save the authentication cookie ***
        if (cookie != null && cookie.isNotEmpty) {
          await prefs.setString('cookie', cookie);
        }

        Future<void> navigateWithData(Map<String, dynamic> data) async {
          final userName = (data['user']?['name'] ?? data['name'] ?? 'User').toString();
          await prefs.setString('username', userName);

          if (!mounted) return;
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => DashboardScreen(initialData: data)),
          );
        }

        if (token != null && token.isNotEmpty) {
          await prefs.setString('token', token);
          final body = result['body'] as Map<String, dynamic>?;
          if (body != null) {
            await navigateWithData(body);
          } else {
            if (!mounted) return;
            Navigator.pushReplacementNamed(context, 'dashboard');
          }
        } else {
          final body = result['body'] as Map<String, dynamic>?;
          if (body != null && (body.containsKey('user') || body.containsKey('name'))) {
            await navigateWithData(body);
            return;
          }

          if (cookie != null && cookie.isNotEmpty) {
            final dashData = await api.fetchDashboardWithCookie(cookie);
            if (dashData != null) {
              await navigateWithData(dashData);
              return;
            }
          }

          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Login succeeded but no token/cookie returned.')),
          );
        }
      } else {
        final error = result['error']?.toString() ?? 'Login failed';
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error)));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Login failed: $e')));
    } finally {
      if (mounted) {
        setState(() { isLoading = false; });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextField(controller: emailController, decoration: const InputDecoration(labelText: 'Email')),
            TextField(controller: passwordController, decoration: const InputDecoration(labelText: 'Password'), obscureText: true),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: isLoading ? null : login,
              child: isLoading ? const CircularProgressIndicator() : const Text('Login'),
            ),
            TextButton(
              onPressed: () => Navigator.pushNamed(context, 'signup'),
              child: const Text('Create an account'),
            )
          ],
        ),
      ),
    );
  }
}