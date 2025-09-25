'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiMail, FiInbox, FiSend } from 'react-icons/fi';
import AssistantChat from "../../components/AssistantChat";
import AssistantChatPhase2 from '@/components/AssistantChatPhase2';

// Import all required components (except Sidebar)
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import RecentActivity from '@/components/RecentActivity';
import ChartCard from '@/components/ChartCard';
import Footer from '@/components/Footer';

// --- Sidebar Component ---
// This component is now defined directly in the dashboard file.
function Sidebar({ user }) {
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
    }
  }, []);
  
  const handleLogout = async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
  };

  const navigationItems = [
    ...(pathname !== '/dashboard' ? [{ name: 'Back to Dashboard', href: '/dashboard', icon: '⬅️' }] : []),
    { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
    { name: 'Create alias', href: '/dashboard', icon: '➕', id: 'create-alias-nav' },
    { name: 'Compose', href: '/dashboard/send', icon: '✉️' },
    { name: 'Inbox', href: '/dashboard/inbox', icon: '📥' },
    { name: 'Total Aliases', href: '/dashboard', icon: '📄', id: 'aliases-overview-nav' },
  ];

  const handleNavClick = (item, e) => {
    if (item.id) {
      e.preventDefault();
      if (pathname === '/dashboard') {
        const element = document.getElementById(item.id.replace('-nav', '-form'));
        element?.scrollIntoView({ behavior: 'smooth' });
      } else {
        sessionStorage.setItem('scrollTo', item.id.replace('-nav', '-form'));
        window.location.href = '/dashboard';
      }
    }
  };

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col min-h-screen hidden lg:flex">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600 text-2xl">
              {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
            </div>
          </div>
        </div>
        <h3 className="text-center font-bold text-gray-800">{user?.name || 'User'}</h3>
        <p className="text-center text-sm text-gray-500">{user?.email}</p>
      </div>
      <nav className="flex-1 p-6">
        <ul className="space-y-3">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <a
                href={item.href}
                onClick={(e) => handleNavClick(item, e)}
                className={`block w-full px-4 py-3 rounded-lg text-center text-sm font-medium border transition-all duration-200 ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  {item.name}
                </div>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-center text-sm font-medium border bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition-all duration-200"
          >
            <span className="text-lg">🚪</span>
            Logout
          </button>
      </div>
    </aside>
  );
}


// --- Main Dashboard Page Component ---
export default function Dashboard() {
  // State and logic for the dashboard
  const [user, setUser] = useState(null);
  const [aliases, setAliases] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inboxStats, setInboxStats] = useState({ unreadCount: 0, totalEmails: 0, spamCount: 0 });
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
    fetchAliases();
    fetchInboxStats();
    fetchActivities();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        router.push('/signin');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data.');
    } finally {
        setLoading(false);
    }
  };

  const fetchAliases = async () => {
    try {
      const response = await fetch('/api/aliases');
      if (response.ok) setAliases(await response.json());
    } catch (error) {
      console.error('Error fetching aliases:', error);
    }
  };
  
  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/shared-activities');
      if (response.ok) setActivities(await response.json());
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchInboxStats = async () => {
    try {
      const response = await fetch('/api/inbox?limit=1');
      if (response.ok) {
        const data = await response.json();
        setInboxStats({
          unreadCount: data.counts?.unread || 0,
          totalEmails: data.counts?.all || 0,
          spamCount: data.counts?.spam || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching inbox stats:', error);
    }
  };
  
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const upgradeToPro = async () => {
    // This function remains unchanged...
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const isPro = user?.plan === 'pro';
  const totalSent = aliases.reduce((sum, a) => sum + (a.emailsSent || 0), 0);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* The Sidebar component is now called from within this file */}
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header isPro={isPro} onLogout={logout} onUpgrade={upgradeToPro} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">{success}</div>}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard title="Total Aliases" stat={aliases.length} icon={<FiMail />} theme="blue" />
            <StatsCard title="Unread Emails" stat={inboxStats.unreadCount} icon={<FiInbox />} theme="green" />
            <StatsCard title="Total Emails Sent" stat={totalSent} icon={<FiSend />} theme="rose" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ChartCard title="Email Traffic Trends" type="traffic" data={[10, 18, 14, 22, 16, 24, 20]} />
              <ChartCard title="Spam vs. Legitimate Emails Ratio" type="spamRatio" inboxStats={inboxStats} />
          </div>
          
          <RecentActivity activities={activities} />
          
          {/* Assistant Chat Widgets */}
          <div className="mt-6">
            <AssistantChat />
          </div>
          <div className="mt-6">
              <AssistantChatPhase2/>
          </div>

          <Footer />
        </main>
      </div>
    </div>
  );
}
