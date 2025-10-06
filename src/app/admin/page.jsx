'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUsers, FiMail, FiAlertTriangle, FiDollarSign, FiLogOut, FiActivity } from 'react-icons/fi';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      
      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Failed to load admin statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load admin statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/signin';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-300">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-6 py-4 rounded-lg backdrop-blur-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <header className="bg-black/40 backdrop-blur-md border-b border-purple-500/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-purple-300 mt-1">System overview and management</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors border border-red-500/30"
          >
            <FiLogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats?.overview?.totalUsers || 0}
            icon={<FiUsers />}
            subtitle={`${stats?.overview?.proUsers || 0} Pro, ${stats?.overview?.freeUsers || 0} Free`}
            theme="blue"
          />
          <StatCard
            title="Total Emails"
            value={stats?.overview?.totalEmails || 0}
            icon={<FiMail />}
            subtitle={`${stats?.overview?.spamEmails || 0} spam`}
            theme="green"
          />
          <StatCard
            title="Total Aliases"
            value={stats?.overview?.totalAliases || 0}
            icon={<FiAlertTriangle />}
            subtitle={`${stats?.overview?.collaborativeAliases || 0} collaborative`}
            theme="red"
          />
          <StatCard
            title="Revenue"
            value={`₹${stats?.overview?.totalRevenue || 0}`}
            icon={<FiDollarSign />}
            subtitle={`${stats?.overview?.conversionRate || 0}% conversion`}
            theme="yellow"
          />
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <NavCard
            title="Manage Users"
            description="View, suspend, or modify user accounts"
            href="/admin/users"
            count={stats?.overview?.recentRegistrations || 0}
            countLabel="new this month"
            icon={<FiUsers />}
          />
          <NavCard
            title="View Aliases"
            description="Monitor all email aliases across the system"
            href="/admin/aliases"
            count={stats?.overview?.totalAliases || 0}
            countLabel="total aliases"
            icon={<FiAlertTriangle />}
          />
          <NavCard
            title="Email Activity"
            description="Track email volume and spam detection"
            href="/admin/emails"
            count={stats?.overview?.totalEmails || 0}
            countLabel="total emails"
            icon={<FiActivity />}
          />
        </div>

        {/* Email Trends Chart */}
        {stats?.emailTrends && stats.emailTrends.length > 0 && (
          <div className="bg-black/40 backdrop-blur-md rounded-xl border border-purple-500/20 p-6 mb-8 shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FiActivity className="w-5 h-5 text-purple-400" />
              Email Volume (Last 7 Days)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.emailTrends}>
                <defs>
                  <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#4c1d95" opacity={0.3} />
                <XAxis 
                  dataKey="_id" 
                  stroke="#a78bfa"
                  tick={{ fill: '#a78bfa' }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#a78bfa" tick={{ fill: '#a78bfa' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                    border: '1px solid #8b5cf6',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorEmails)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Users Table */}
        {stats?.topUsers && stats.topUsers.length > 0 && (
          <div className="bg-black/40 backdrop-blur-md rounded-xl border border-purple-500/20 p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-4">Most Active Users</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-purple-500/20">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase">Aliases</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase">Emails Sent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase">Emails Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {stats.topUsers.map((user, index) => (
                    <tr key={index} className="hover:bg-purple-900/20 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-white">{user.user.name}</div>
                          <div className="text-sm text-gray-400">{user.user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.user.plan === 'pro' 
                            ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30' 
                            : 'bg-gray-700/50 text-gray-300 border border-gray-500/30'
                        }`}>
                          {user.user.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">{user.aliasCount}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{user.emailsSent}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{user.emailsReceived}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle, theme = 'blue' }) {
  const themeClasses = {
    blue: 'from-blue-900/50 to-blue-800/30 border-blue-500/30 text-blue-300',
    green: 'from-green-900/50 to-green-800/30 border-green-500/30 text-green-300',
    purple: 'from-purple-900/50 to-purple-800/30 border-purple-500/30 text-purple-300',
 red: 'from-red-900/50 to-red-800/30 border-red-500/30 text-red-300', 
    yellow: 'from-yellow-900/50 to-yellow-800/30 border-yellow-500/30 text-yellow-300',
  };

  return (
    <div className={`bg-gradient-to-br ${themeClasses[theme]} border rounded-xl p-6 backdrop-blur-md shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold text-white">{value}</span>
      </div>
      <h3 className="text-sm font-medium text-gray-300">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function NavCard({ title, description, href, count, countLabel, icon }) {
  return (
    <a
      href={href}
      className="bg-black/40 backdrop-blur-md border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-all cursor-pointer shadow-lg hover:shadow-purple-500/20"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="text-purple-400 text-2xl">{icon}</div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="text-sm text-gray-400 mb-4">{description}</p>
      <div className="flex items-baseline">
        <span className="text-2xl font-bold text-purple-400">{count}</span>
        <span className="ml-2 text-sm text-gray-500">{countLabel}</span>
      </div>
    </a>
  );
}