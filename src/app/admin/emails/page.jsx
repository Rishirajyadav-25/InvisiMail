'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiAlertTriangle, FiSend, FiInbox, FiLogOut, FiTrash2, FiCheck } from 'react-icons/fi';

export default function AdminEmails() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
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
        setSelectedEmails(new Set()); // Clear selection on refresh
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

  const handleDeleteEmail = async (emailId) => {
    if (!confirm('Are you sure you want to delete this email? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(emailId);
      const response = await fetch(`/api/admin/emails?emailId=${emailId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Email deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
        // Remove from local state
        setEmails(emails.filter(email => email._id !== emailId));
        setSelectedEmails(prev => {
          const newSet = new Set(prev);
          newSet.delete(emailId);
          return newSet;
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete email');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      setError('Failed to delete email');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmails.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedEmails.size} email(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      setBulkDeleting(true);
      const response = await fetch('/api/admin/emails', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          emailIds: Array.from(selectedEmails)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message || 'Emails deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
        // Refresh the list
        fetchEmails();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete emails');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error bulk deleting emails:', error);
      setError('Failed to delete emails');
      setTimeout(() => setError(''), 3000);
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleEmailSelection = (emailId) => {
    setSelectedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEmails.size === emails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(emails.map(e => e._id)));
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
              <p className="text-sm text-purple-300 mt-1">Monitor and manage system-wide email traffic</p>
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
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-900/30 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg backdrop-blur-sm flex items-center gap-2">
            <FiCheck className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-black/40 backdrop-blur-md rounded-xl border border-purple-500/20 p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
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

            {/* Bulk Actions */}
            {selectedEmails.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiTrash2 className="w-4 h-4" />
                {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedEmails.size})`}
              </button>
            )}
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
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedEmails.size === emails.length && emails.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">From</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {emails.map((email) => (
                      <tr key={email._id} className="hover:bg-purple-900/20 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedEmails.has(email._id)}
                            onChange={() => toggleEmailSelection(email._id)}
                            className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                          />
                        </td>
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
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteEmail(email._id)}
                            disabled={deletingId === email._id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            title="Delete email"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            {deletingId === email._id ? 'Deleting...' : 'Delete'}
                          </button>
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
                    {selectedEmails.size > 0 && (
                      <span className="ml-4">• {selectedEmails.size} selected</span>
                    )}
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