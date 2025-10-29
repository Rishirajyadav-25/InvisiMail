// lib/main.dart
import 'package:flutter/material.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/signup_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/create_alias_screen.dart'; // <-- Import the new screen
import 'screens/compose_screen.dart'; // <-- *** IMPORT COMPOSE SCREEN ***

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
      initialRoute: '/',
      routes: {
        '/': (context) => const SplashScreen(),
        'login': (context) => const LoginScreen(),
        'signup': (context) => const SignupScreen(),
        'dashboard': (context) => const DashboardScreen(),
        'create_alias': (context) => const CreateAliasScreen(), // <-- Add the route
        'compose': (context) => const ComposeScreen(), // <-- *** ADD COMPOSE ROUTE ***
      },
    );
  }
}