// lib/screens/splash_screen.dart

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:invisimail_app/services/api_service.dart';
import 'package:invisimail_app/screens/dashboard_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
  }

  Future<void> _checkLoginStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final cookie = prefs.getString('cookie');

    // Wait for a moment to show splash screen (optional, good for UX)
    await Future.delayed(const Duration(milliseconds: 500));

    if (cookie == null || cookie.isEmpty) {
      // No cookie, go to login
      if (mounted) {
        Navigator.pushReplacementNamed(context, 'login');
      }
      return;
    }

    // Cookie exists, try to validate it
    try {
      final api = ApiService();
      final data = await api.fetchDashboardWithCookie(cookie);

      if (data != null && mounted) {
        // Cookie is valid, go to dashboard
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => DashboardScreen(initialData: data)),
        );
      } else {
        // Cookie is invalid or expired, go to login
        if (mounted) {
          Navigator.pushReplacementNamed(context, 'login');
        }
      }
    } catch (e) {
      // Error fetching, go to login
      if (mounted) {
        Navigator.pushReplacementNamed(context, 'login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Show a loading indicator while checking status
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}