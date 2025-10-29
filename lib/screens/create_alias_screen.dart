// lib/screens/create_alias_screen.dart

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class CreateAliasScreen extends StatefulWidget {
  const CreateAliasScreen({super.key});

  @override
  _CreateAliasScreenState createState() => _CreateAliasScreenState();
}

class _CreateAliasScreenState extends State<CreateAliasScreen> {
  final TextEditingController aliasController = TextEditingController();
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  String? _cookie;

  @override
  void initState() {
    super.initState();
    _loadCookie();
  }

  Future<void> _loadCookie() async {
    final prefs = await SharedPreferences.getInstance();
    _cookie = prefs.getString('cookie');
  }

  Future<void> _submitCreateAlias() async {
    final aliasName = aliasController.text.trim();

    if (aliasName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an alias name.')),
      );
      return;
    }

    if (_cookie == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error: Not logged in.')),
      );
      return;
    }

    setState(() { _isLoading = true; });

    try {
      final result = await _apiService.createAlias(
        aliasName: aliasName,
        cookie: _cookie!,
      );

      if (!mounted) return;

      if (result['ok'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Alias created successfully!')),
        );
        // Pass back 'true' to indicate success
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to create alias: ${result['error'] ?? 'Unknown error'}')),
        );
      }
    } catch (e) {
       if (!mounted) return;
       ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('An error occurred: $e')),
       );
    } finally {
      if (mounted) {
        setState(() { _isLoading = false; });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
     // Get the default domain from environment (replace with your actual domain)
    const String defaultDomain = "@codetodo.me"; // Or load dynamically if needed

    return Scaffold(
      appBar: AppBar(title: const Text('Create New Alias')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: aliasController,
              decoration: InputDecoration(
                labelText: 'Alias Name',
                hintText: 'e.g., newsletter, support',
                // Display the domain as a suffix
                suffixText: defaultDomain,
                border: const OutlineInputBorder(),
              ),
              enabled: !_isLoading,
            ),
            const SizedBox(height: 8),
            const Text(
               'Use letters, numbers, dots (.), hyphens (-), underscores (_).',
                style: TextStyle(color: Colors.grey, fontSize: 12),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _submitCreateAlias,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Create Alias'),
            ),
          ],
        ),
      ),
    );
  }
}