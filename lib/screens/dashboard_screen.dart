// lib/screens/dashboard_screen.dart

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
// Remove import 'package:invisimail_app/screens/create_alias_screen.dart'; // No longer needed here if navigating by name

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
  bool _isLoadingAliases = true; // <-- New loading state for aliases
  List<dynamic> _emails = [];
  List<dynamic> _aliases = []; // <-- New state for aliases

  // Define menu items - let's add an 'Aliases' item
  final List<Map<String, dynamic>> _menuItems = [
    {"name": "Inbox", "type": "received", "icon": Icons.inbox},
    {"name": "Sent", "type": "sent", "icon": Icons.send},
    {"name": "Spam", "type": "spam", "icon": Icons.block},
    {"name": "Aliases", "type": "aliases", "icon": Icons.alternate_email}, // <-- New menu item
    {"name": "Settings", "type": "settings", "icon": Icons.settings},
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
      // Fetch both emails and aliases initially
      await Future.wait([_fetchEmails(), _fetchAliases()]); // Fetch in parallel
    } else {
      setState(() {
        _isLoadingEmails = false;
        _isLoadingAliases = false;
      });
    }
  }

  Future<void> _fetchEmails() async {
    if (_cookie == null) return;
    // Only set loading if we are showing the email list
    if (_menuItems[_selectedIndex]['type'] != 'aliases') {
      setState(() { _isLoadingEmails = true; });
    }

    final mailType = _menuItems[_selectedIndex]['type']!;
    // Only fetch if it's an email type
    if (mailType == 'received' || mailType == 'sent' || mailType == 'spam') {
      final fetchedEmails = await _apiService.fetchEmails(cookie: _cookie!, mailType: mailType);
      if (mounted) {
        setState(() {
          _emails = fetchedEmails;
          _isLoadingEmails = false;
        });
      }
    } else {
      if (mounted) {
        setState(() { _isLoadingEmails = false; }); // Ensure loading stops for non-email views
      }
    }
  }

  // *** NEW FUNCTION to fetch aliases ***
  Future<void> _fetchAliases() async {
    if (_cookie == null) return;
    if (mounted) { // Check mounted before setState
      setState(() { _isLoadingAliases = true; });
    }
    final fetchedAliases = await _apiService.fetchAliases(cookie: _cookie!);
    if (mounted) { // Check mounted again before final setState
      setState(() {
        _aliases = fetchedAliases;
        _isLoadingAliases = false;
      });
    }
  }


  Future<void> _logout() async {
    // ... (keep existing logout code)
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('cookie');
    await prefs.remove('username');
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, 'login');
  }

  void _onMenuItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
      _isLoadingEmails = true; // Assume loading until fetch completes or is skipped
    });

    final type = _menuItems[index]['type'];

    if (type == 'received' || type == 'sent' || type == 'spam') {
      _fetchEmails();
    } else if (type == 'aliases') {
      // Aliases are already loaded or being loaded, just ensure email loading stops
      setState(() { _isLoadingEmails = false; });
    } else {
      // For unimplemented sections like Settings, show an empty list
      setState(() {
        _emails = [];
        _isLoadingEmails = false;
      });
    }
    Navigator.pop(context); // Close drawer
  }

  // Function to navigate and potentially refresh aliases
  Future<void> _navigateAndRefreshAliases() async {
    final result = await Navigator.pushNamed(context, 'create_alias');
    // If the create alias screen returned true (success), refresh the alias list
    if (result == true && mounted) {
      await _fetchAliases();
    }
  }

  // *** NEW: Function to navigate to Compose screen ***
  void _navigateToCompose() {
    Navigator.pushNamed(context, 'compose');
  }

  // Build Alias List Widget
  Widget _buildAliasList() {
    if (_isLoadingAliases) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_aliases.isEmpty) {
      return const Center(child: Text('No aliases found. Create one!'));
    }
    return ListView.builder(
      itemCount: _aliases.length,
      itemBuilder: (context, index) {
        final alias = _aliases[index];
        final isActive = alias['isActive'] ?? true; // Default to true if missing
        return Card(
          margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
          child: ListTile(
            leading: Icon(
              Icons.alternate_email,
              color: isActive ? Colors.green : Colors.grey,
            ),
            title: Text(alias['aliasEmail'] ?? 'Unknown Alias'),
            subtitle: Text(isActive ? 'Active' : 'Inactive'),
            trailing: Icon(
              Icons.circle,
              size: 12,
              color: isActive ? Colors.green : Colors.red,
            ),
            // Add onTap later for alias details/edit
          ),
        );
      },
    );
  }

  // Build Email List Widget (similar to before)
  Widget _buildEmailList() {
    if (_isLoadingEmails) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_emails.isEmpty) {
      return Center(child: Text('No emails found in ${_menuItems[_selectedIndex]['name']}.'));
    }
    // ... (keep existing ListView.builder for emails)
    return ListView.builder(
      itemCount: _emails.length,
      itemBuilder: (context, index) {
        final email = _emails[index];
        // Simple display for now
        return Card(
          margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
          child: ListTile(
            leading: Icon(email['isRead'] == false ? Icons.mark_email_unread_outlined : Icons.email_outlined),
            title: Text(email['subject'] ?? '(No Subject)'),
            subtitle: Text(
                "From: ${email['from'] ?? 'Unknown'} \nTo: ${email['to'] ?? email['aliasEmail'] ?? 'Unknown'}"
            ),
            isThreeLine: true,
            // Add onTap later for email details
          ),
        );
      },
    );
  }


  // *** NEW: Helper to determine which FAB to show ***
  Widget? _buildFloatingActionButton() {
    final selectedType = _menuItems[_selectedIndex]['type'];

    switch (selectedType) {
      case 'aliases':
      // Show Create Alias FAB
        return FloatingActionButton.extended(
          onPressed: _navigateAndRefreshAliases,
          icon: const Icon(Icons.add),
          label: const Text('Create Alias'),
          tooltip: 'Create a new email alias',
        );
      case 'received':
      case 'sent':
      case 'spam':
      // Show Compose FAB
        return FloatingActionButton(
          onPressed: _navigateToCompose,
          // *** THIS IS THE FIX: 'icon:' changed to 'child:' ***
          child: const Icon(Icons.edit),
          tooltip: 'Compose Email',
        );
      case 'settings':
      default:
      // Show no FAB
        return null;
    }
  }


  @override
  Widget build(BuildContext context) {
    // Determine which view to show based on selected index
    final selectedType = _menuItems[_selectedIndex]['type'];
    final bool showAliases = selectedType == 'aliases';

    return Scaffold(
      appBar: AppBar(
        title: Text("InvisiMail: ${_menuItems[_selectedIndex]['name']!}"),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
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
              accountEmail: const Text(""), // Email not directly available, keep empty or fetch if needed
              currentAccountPicture: CircleAvatar(
                  backgroundColor: Colors.white,
                  child: Text(_username.isNotEmpty ? _username[0].toUpperCase() : '?',
                      style: const TextStyle(fontSize: 24.0, color: Colors.blue))),
            ),
            for (int i = 0; i < _menuItems.length; i++)
              ListTile(
                leading: Icon(_menuItems[i]['icon'] as IconData?), // Use defined icon
                title: Text(_menuItems[i]['name']!),
                selected: _selectedIndex == i,
                onTap: () => _onMenuItemTapped(i),
                selectedTileColor: Colors.blue.withOpacity(0.1),
              ),
          ],
        ),
      ),
      // Show either email list or alias list
      body: showAliases ? _buildAliasList() : _buildEmailList(),

      // *** MODIFIED: Use the helper function for the FAB ***
      floatingActionButton: _buildFloatingActionButton(),
    );
  }
}