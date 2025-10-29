// lib/screens/compose_screen.dart

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class ComposeScreen extends StatefulWidget {
  const ComposeScreen({super.key});

  @override
  _ComposeScreenState createState() => _ComposeScreenState();
}

class _ComposeScreenState extends State<ComposeScreen> {
  final ApiService _apiService = ApiService();
  String? _cookie;
  bool _isLoadingAliases = true;
  bool _isSending = false;
  List<dynamic> _aliases = [];
  String? _selectedAlias;

  final TextEditingController _toController = TextEditingController();
  final TextEditingController _subjectController = TextEditingController();
  final TextEditingController _bodyController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final prefs = await SharedPreferences.getInstance();
    _cookie = prefs.getString('cookie');

    if (_cookie == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Error: Not logged in.')),
        );
        Navigator.pop(context); // Go back if not logged in
      }
      return;
    }

    await _fetchAliases();
  }

  Future<void> _fetchAliases() async {
    if (_cookie == null) return;
    setState(() { _isLoadingAliases = true; });

    final fetchedAliases = await _apiService.fetchAliases(cookie: _cookie!);
    if (mounted) {
      setState(() {
        _aliases = fetchedAliases;
        // Set default alias if available
        if (_aliases.isNotEmpty) {
          _selectedAlias = _aliases.first['aliasEmail']?.toString();
        }
        _isLoadingAliases = false;
      });
    }
  }

  Future<void> _sendEmail() async {
    final to = _toController.text.trim();
    final subject = _subjectController.text.trim();
    final body = _bodyController.text.trim();

    if (_selectedAlias == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a "From" alias.')),
      );
      return;
    }
    if (to.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a recipient.')),
      );
      return;
    }
    if (_cookie == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error: Not logged in.')),
      );
      return;
    }

    setState(() { _isSending = true; });

    try {
      final result = await _apiService.sendEmail(
        cookie: _cookie!,
        fromAlias: _selectedAlias!,
        to: to,
        subject: subject,
        body: body,
      );

      if (!mounted) return;

      if (result['ok'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Email sent successfully!')),
        );
        Navigator.pop(context); // Go back after sending
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send email: ${result['error'] ?? 'Unknown error'}')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('An error occurred: $e')),
      );
    } finally {
      if (mounted) {
        setState(() { _isSending = false; });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Compose Email'),
        actions: [
          IconButton(
            icon: const Icon(Icons.send),
            onPressed: _isSending ? null : _sendEmail,
            tooltip: 'Send',
          ),
        ],
      ),
      body: _isLoadingAliases
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // --- From Dropdown ---
            DropdownButtonFormField<String>(
              value: _selectedAlias,
              hint: const Text('Select "From" Alias'),
              isExpanded: true,
              items: _aliases.map((alias) {
                final email = alias['aliasEmail']?.toString() ?? 'Unknown Alias';
                return DropdownMenuItem<String>(
                  value: email,
                  child: Text(email),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedAlias = value;
                });
              },
              decoration: const InputDecoration(
                labelText: 'From',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // --- To Field ---
            TextField(
              controller: _toController,
              decoration: const InputDecoration(
                labelText: 'To',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
              enabled: !_isSending,
            ),
            const SizedBox(height: 16),

            // --- Subject Field ---
            TextField(
              controller: _subjectController,
              decoration: const InputDecoration(
                labelText: 'Subject',
                border: OutlineInputBorder(),
              ),
              textCapitalization: TextCapitalization.sentences,
              enabled: !_isSending,
            ),
            const SizedBox(height: 16),

            // --- Body Field ---
            TextField(
              controller: _bodyController,
              decoration: const InputDecoration(
                labelText: 'Body',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
              ),
              maxLines: 10,
              textCapitalization: TextCapitalization.sentences,
              enabled: !_isSending,
            ),
            const SizedBox(height: 24),

            // --- Send Button (alternative) ---
            ElevatedButton.icon(
              onPressed: _isSending ? null : _sendEmail,
              icon: _isSending
                  ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
                  : const Icon(Icons.send),
              label: const Text('Send'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }
}