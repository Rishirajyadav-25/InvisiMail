// lib/screens/dashboard_screen.dart

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class DashboardScreen extends StatefulWidget {
  final Map<String, dynamic>? initialData;

  const DashboardScreen({super.key, this.initialData});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();

  String? _cookie;
  String _username = "User";
  int _selectedIndex = 0;
  bool _isLoadingEmails = true;
  List<dynamic> _emails = [];

  final List<Map<String, String>> _menuItems = [
    {"name": "Inbox", "type": "received"},
    {"name": "Sent", "type": "sent"},
    {"name": "Spam", "type": "spam"},
    {"name": "Trash", "type": "trash"}, // Note: 'trash' type might not exist on backend yet
    {"name": "Settings", "type": "settings"},
  ];

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _cookie = prefs.getString('cookie');

    if (widget.initialData != null) {
      _username = (widget.initialData?['user']?['name'] ?? widget.initialData?['name'] ?? 'User').toString();
    } else {
      _username = prefs.getString('username') ?? "User";
    }

    if (_cookie != null) {
      _fetchEmails();
    } else {
      // If there's no cookie, we can't fetch data. Something went wrong.
      setState(() {
        _isLoadingEmails = false;
      });
    }
  }

  Future<void> _fetchEmails() async {
    if (_cookie == null) return;
    setState(() {
      _isLoadingEmails = true;
      _emails = []; // Clear old emails
    });

    final mailType = _menuItems[_selectedIndex]['type']!;
    final fetchedEmails = await _apiService.fetchEmails(cookie: _cookie!, mailType: mailType);

    if (mounted) {
      setState(() {
        _emails = fetchedEmails;
        _isLoadingEmails = false;
      });
    }
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('cookie');
    await prefs.remove('username');
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, 'login');
  }

  void _onMenuItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
    // For now, only fetch emails for Inbox, Sent, and Spam
    if (index <= 2) {
      _fetchEmails();
    } else {
      // For unimplemented sections like Trash/Settings, show an empty list
      setState(() {
        _emails = [];
      });
    }
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("InvisiMail: ${_menuItems[_selectedIndex]['name']!}"),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            UserAccountsDrawerHeader(
              accountName: Text(_username),
              accountEmail: const Text("Logged In"),
              currentAccountPicture: const CircleAvatar(child: Icon(Icons.person)),
            ),
            for (int i = 0; i < _menuItems.length; i++)
              ListTile(
                leading: Icon( i == 0 ? Icons.inbox : i == 1 ? Icons.send : i == 2 ? Icons.block : i == 3 ? Icons.delete : Icons.settings ),
                title: Text(_menuItems[i]['name']!),
                selected: _selectedIndex == i,
                onTap: () => _onMenuItemTapped(i),
              ),
          ],
        ),
      ),
      body: _isLoadingEmails
          ? const Center(child: CircularProgressIndicator())
          : _emails.isEmpty
          ? const Center(child: Text('No emails found.'))
          : ListView.builder(
        itemCount: _emails.length,
        itemBuilder: (context, index) {
          final email = _emails[index];
          return Card(
            margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
            child: ListTile(
              title: Text(email['subject'] ?? '(No Subject)'),
              subtitle: Text(
                  "${email['from'] ?? 'Unknown Sender'} • ${email['bodyPlain']?.substring(0, (email['bodyPlain']?.length ?? 0) > 50 ? 50 : email['bodyPlain']?.length ?? 0).replaceAll('\n', ' ')}..."
              ),
              leading: const Icon(Icons.email_outlined),
              onTap: () {
                // You can add navigation to a detailed email view here
              },
            ),
          );
        },
      ),
    );
  }
}