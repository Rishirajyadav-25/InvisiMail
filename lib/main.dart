// lib/main.dart

import 'package:flutter/material.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/signup_screen.dart';
import 'screens/dashboard_screen.dart';

void main() => runApp(const InvisiMailApp());

class InvisiMailApp extends StatelessWidget {
  const InvisiMailApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'InvisiMail',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      initialRoute: 'login',
      routes: {
        'login': (context) => const LoginScreen(),
        'signup': (context) => const SignupScreen(),
        'dashboard': (context) => const DashboardScreen(),
      },
    );
  }
}