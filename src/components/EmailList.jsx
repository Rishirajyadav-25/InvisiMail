'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EmailList({ 
  emails = [], 
  loading = false, 
  onMarkAsRead, 
  onDelete, 
  onMarkAsSpam,
  selectedEmailId = null,
  onEmailSelect
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const router = useRouter();

  const filters = [
    { name: 'All', count: emails.length },
    { name: 'Read', count: emails.filter(e => e.isRead).length },
    { name: 'Unread', count: emails.filter(e => !e.isRead).length }
  ];

  const filteredEmails = emails.filter(email => {
    const matchesSearch = searchTerm === '' || 
      email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.bodyPlain?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = activeFilter === 'All' ||
      (activeFilter === 'Read' && email.isRead) ||
      (activeFilter === 'Unread' && !email.isRead);
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays <= 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getSenderInitial = (email) => {
    if (email.isSentEmail) {
      return (email.to?.charAt(0) || 'T')?.toUpperCase();
    }
    return (email.from?.charAt(0) || '?')?.toUpperCase();
  };

  const getSenderName = (email) => {
    if (email.isSentEmail) {
      return email.to || 'Unknown recipient';
    }
    return email.from || 'Unknown sender';
  };

  const getEmailPreview = (email) => {
    const preview = email.bodyPlain || 'No preview available';
    return preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
  };

  if (loading) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading emails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Inbox</h1>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <Link
              href="/dashboard/send"
              className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Link>
            <button className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex space-x-1">
          {filters.map((filter) => (
            <button
              key={filter.name}
              onClick={() => setActiveFilter(filter.name)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeFilter === filter.name
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {filter.name}
            </button>
          ))}
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {filteredEmails.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-4">📪</div>
              <p className="text-gray-500">
                {searchTerm ? 'No emails match your search' : 'No emails found'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredEmails.map((email) => (
              <div
                key={email._id}
                onClick={() => onEmailSelect(email._id)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 group email-item-hover ${
                  selectedEmailId === email._id ? 'bg-blue-50 border-r-4 border-blue-500 shadow-md' : ''
                } ${!email.isRead ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    email.isSpam 
                      ? 'bg-red-100' 
                      : email.isSentEmail 
                        ? 'bg-green-100' 
                        : 'bg-blue-100'
                  }`}>
                    <span className={`text-sm font-medium ${
                      email.isSpam 
                        ? 'text-red-600' 
                        : email.isSentEmail 
                          ? 'text-green-600' 
                          : 'text-blue-600'
                    }`}>
                      {getSenderInitial(email)}
                    </span>
                  </div>

                  {/* Email Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <p className={`text-sm font-medium ${
                          !email.isRead ? 'text-green-600 font-semibold' : 'text-gray-900'
                        }`}>
                          {getSenderName(email)}
                        </p>
                        {!email.isRead && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(email.receivedAt)}
                      </span>
                    </div>

                    <p className={`text-sm mb-1 ${
                      !email.isRead ? 'font-semibold text-gray-900' : 'text-gray-900'
                    }`}>
                      {email.subject || '(No Subject)'}
                    </p>

                    <p className="text-sm text-gray-600 line-clamp-2">
                      {getEmailPreview(email)}
                    </p>

                    {/* Email Status Badges */}
                    <div className="flex items-center space-x-2 mt-2">
                      {email.isSentEmail && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Sent
                        </span>
                      )}
                      {email.isSpam && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Spam
                        </span>
                      )}
                      {email.attachments?.length > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          📎 {email.attachments.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(email._id, !email.isRead);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title={email.isRead ? 'Mark unread' : 'Mark read'}
                    >
                      {email.isRead ? '📭' : '📬'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/send?reply=${email._id}`);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Reply"
                    >
                      ↩️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(email._id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
