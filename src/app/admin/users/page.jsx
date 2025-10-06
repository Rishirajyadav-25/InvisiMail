'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiLogOut, FiSearch } from 'react-icons/fi';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, [currentPage, planFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/users?page=${currentPage}&plan=${planFilter}&search=${searchTerm}`
      );
      
      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        setError('Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleAction = async (userId, action, data = {}) => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, data })
      });

      if (response.ok) {
        alert(`User ${action} successful`);
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(`Failed to ${action} user: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Failed to ${action} user`);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/signin';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-purple-500/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-colors border border-purple-500/30"
            >
              ← Dashboard
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">User Management</h1>
              <p className="text-sm text-purple-300 mt-1">Manage all user accounts</p>
            </div>
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
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-black/40 backdrop-blur-md rounded-xl border border-purple-500/20 p-6 mb-6 shadow-lg">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/30 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-purple-300/50"
              />
            </div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-4 py-2 bg-black/30 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-black/40 backdrop-blur-md rounded-xl border border-purple-500/20 overflow-hidden shadow-lg">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-purple-300">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-purple-300">No users found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-purple-500/20">
                  <thead className="bg-purple-900/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Aliases</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Activity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-purple-900/20 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-white">{user.name}</div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.plan === 'pro' 
                              ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30' 
                              : 'bg-gray-700/50 text-gray-300 border border-gray-500/30'
                          }`}>
                            {user.plan}
                          </span>
                          {user.isSuspended && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-900/50 text-red-300 border border-red-500/30">
                              Suspended
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{user.aliasCount || 0}</td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-400">
                            <div>Sent: {user.totalEmailsSent || 0}</div>
                            <div>Received: {user.totalEmailsReceived || 0}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {user.isSuspended ? (
                              <button
                                onClick={() => handleAction(user._id, 'unsuspend')}
                                className="px-3 py-1 text-xs bg-green-600/80 text-white rounded hover:bg-green-600 transition-colors"
                              >
                                Unsuspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(user._id, 'suspend')}
                                className="px-3 py-1 text-xs bg-red-600/80 text-white rounded hover:bg-red-600 transition-colors"
                              >
                                Suspend
                              </button>
                            )}
                            <button
                              onClick={() => handleAction(user._id, 'changePlan', { 
                                plan: user.plan === 'pro' ? 'free' : 'pro' 
                              })}
                              className="px-3 py-1 text-xs bg-blue-600/80 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              {user.plan === 'pro' ? 'Downgrade' : 'Upgrade'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-4 bg-purple-900/20 border-t border-purple-500/20 flex items-center justify-between">
                  <div className="text-sm text-purple-300">
                    Page {pagination.currentPage} of {pagination.totalPages} 
                    ({pagination.totalCount} total users)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={!pagination.hasPrev}
                      className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-purple-300 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={!pagination.hasNext}
                      className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-purple-300 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}