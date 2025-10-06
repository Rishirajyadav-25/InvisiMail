'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiAlertTriangle, FiSend, FiInbox, FiLogOut } from 'react-icons/fi';

export default function AdminEmails() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchEmails();
  }, [currentPage, typeFilter]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/emails?page=${currentPage}&type=${typeFilter}`
      );
      
      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails);
        setPagination(data.pagination);
      } else {
        setError('Failed to load emails');
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError('Failed to load emails');
    } finally {
      setLoading(false);
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
              <h1 className="text-2xl font-bold text-white">Email Activity</h1>
              <p className="text-sm text-purple-300 mt-1">Monitor system-wide email traffic</p>
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
          <div className="flex gap-4">
            <button
              onClick={() => { setTypeFilter('all'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                typeFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30'
              }`}
            >
              <FiMail className="w-4 h-4" />
              All Emails
            </button>
            <button
              onClick={() => { setTypeFilter('sent'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                typeFilter === 'sent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30'
              }`}
            >
              <FiSend className="w-4 h-4" />
              Sent
            </button>
            <button
              onClick={() => { setTypeFilter('received'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                typeFilter === 'received'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-600/20 text-green-300 hover:bg-green-600/30 border border-green-500/30'
              }`}
            >
              <FiInbox className="w-4 h-4" />
              Received
            </button>
            <button
              onClick={() => { setTypeFilter('spam'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                typeFilter === 'spam'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30'
              }`}
            >
              <FiAlertTriangle className="w-4 h-4" />
              Spam
            </button>
          </div>
        </div>

        {/* Emails Table */}
        <div className="bg-black/40 backdrop-blur-md rounded-xl border border-purple-500/20 overflow-hidden shadow-lg">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-purple-300">Loading emails...</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="p-8 text-center text-purple-300">No emails found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-purple-500/20">
                  <thead className="bg-purple-900/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">From</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {emails.map((email) => (
                      <tr key={email._id} className="hover:bg-purple-900/20 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-300 truncate max-w-xs">
                          {email.from || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300 truncate max-w-xs">
                          {email.to || email.aliasEmail}
                        </td>
                        <td className="px-6 py-4 text-sm text-white truncate max-w-sm">
                          {email.subject || '(No Subject)'}
                        </td>
                        <td className="px-6 py-4">
                          {email.isSpam ? (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-900/50 text-red-300 border border-red-500/30">
                              Spam
                            </span>
                          ) : email.isSentEmail ? (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-900/50 text-blue-300 border border-blue-500/30">
                              Sent
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-900/50 text-green-300 border border-green-500/30">
                              Received
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {new Date(email.receivedAt).toLocaleDateString()}
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
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-purple-300 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage === pagination.totalPages}
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