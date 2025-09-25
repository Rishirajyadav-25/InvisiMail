'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EmailDetail({ email, user, alias }) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const router = useRouter();

  if (!email) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📧</div>
          <p className="text-gray-500">Select an email to view its content</p>
        </div>
      </div>
    );
  }

  const formatFullDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const getEmailType = () => {
    if (email.isSpam) return 'Spam';
    if (email.isSentEmail) return 'Sent';
    return 'Received';
  };

  const getEmailTypeColor = () => {
    if (email.isSpam) return 'bg-red-100 text-red-800';
    if (email.isSentEmail) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const closeContextMenu = () => {
    setShowContextMenu(false);
  };

  const contextMenuActions = [
    { label: 'Open', icon: '📖', action: () => router.push(`/dashboard/inbox/${email._id}`) },
    { label: 'Reply', icon: '↩️', action: () => router.push(`/dashboard/send?reply=${email._id}`) },
    { label: 'Reply All', icon: '↩️↩️', action: () => router.push(`/dashboard/send?reply=${email._id}&replyAll=true`) },
    { label: 'Forward', icon: '↪️', action: () => router.push(`/dashboard/send?forward=${email._id}`) },
    { label: 'Forward with attachment', icon: '📎', action: () => {} },
    { label: 'Mark as unread', icon: '📬', action: () => {} },
    { label: 'Move to Junk', icon: '🚫', action: () => {} },
    { label: 'Mute', icon: '🔇', action: () => {} },
    { label: 'Delete', icon: '🗑️', action: () => {} },
    { label: 'Star', icon: '⭐', action: () => {} },
    { label: 'Archive', icon: '📦', action: () => {} },
    { label: 'Move to', icon: '📁', action: () => {} },
    { label: 'Copy to', icon: '📋', action: () => {} }
  ];

  return (
    <div className="flex-1 bg-white flex flex-col relative" onContextMenu={handleContextMenu}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            {/* Avatar */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              email.isSpam 
                ? 'bg-gradient-to-br from-red-400 to-red-600' 
                : email.isSentEmail 
                  ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
                  : 'bg-gradient-to-br from-gray-400 to-gray-600'
            }`}>
              <span className="text-white text-lg font-medium">
                {getSenderInitial(email)}
              </span>
            </div>

            {/* Email Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  {getSenderName(email)}
                </h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEmailTypeColor()}`}>
                  {getEmailType()}
                </span>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  <span className="font-medium text-gray-700">To:</span> {email.isSentEmail ? email.to : email.aliasEmail}
                </div>
                {email.isSentEmail && (
                  <div>
                    <span className="font-medium text-gray-700">From:</span> {email.aliasEmail}
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Date:</span> {formatFullDate(email.receivedAt)}
                </div>
                {email.attachments?.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Attachments:</span> {email.attachments.length} file{email.attachments.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.push(`/dashboard/send?reply=${email._id}`)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Reply
            </button>
            <button
              onClick={() => router.push(`/dashboard/send?reply=${email._id}&replyAll=true`)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Reply All
            </button>
            <button
              onClick={() => router.push(`/dashboard/send?forward=${email._id}`)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Forward
            </button>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
              🗑️
            </button>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors">
              ⭐
            </button>
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Spam Warning */}
        {email.isSpam && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start space-x-3">
              <span className="text-yellow-600">⚠️</span>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Potentially Harmful Content</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This email may contain malicious links, attachments, or requests for personal information. 
                  Do not click links or download attachments unless you trust the sender.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Email Content */}
        {email.bodyHtml ? (
          <div
            className={`prose max-w-none text-gray-700 leading-relaxed ${email.isSpam ? 'opacity-75' : ''}`}
            dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
          />
        ) : (
          <div className={`whitespace-pre-wrap text-gray-700 leading-relaxed font-mono text-sm bg-gray-50 p-4 rounded-md border ${email.isSpam ? 'opacity-75' : ''}`}>
            {email.bodyPlain || 'No email content available.'}
          </div>
        )}

        {/* Attachments */}
        {email.attachments?.length > 0 && (
          <div className="mt-6 p-4 border border-gray-200 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Attachments ({email.attachments.length})
              {email.isSpam && (
                <span className="ml-2 text-xs text-red-600 font-normal">
                  ⚠️ Do not download from spam emails
                </span>
              )}
            </h4>
            <div className="space-y-2">
              {email.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    email.isSpam 
                      ? 'bg-red-50 border-red-200 opacity-75' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <span className="text-xl">📎</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.filename || `Attachment ${index + 1}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {attachment.contentType || 'Unknown type'}
                      {attachment.size && ` • ${Math.round(attachment.size / 1024)} KB`}
                    </p>
                  </div>
                  <button
                    className={`flex-shrink-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 rounded ${
                      email.isSpam
                        ? 'text-red-400 cursor-not-allowed'
                        : 'text-blue-600 hover:text-blue-700 focus:ring-blue-500'
                    }`}
                    onClick={() =>
                      email.isSpam 
                        ? alert('Cannot download attachments from spam emails for security reasons.')
                        : alert('Download functionality would be implemented here with proper file serving.')
                    }
                    disabled={email.isSpam}
                  >
                    {email.isSpam ? 'Blocked' : 'Download'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={closeContextMenu}
            onContextMenu={closeContextMenu}
          ></div>
          <div
            className="fixed z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px] context-menu"
            style={{
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
              maxHeight: '400px',
              overflowY: 'auto'
            }}
          >
            {contextMenuActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.action();
                  closeContextMenu();
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
            
            {/* Star Rating */}
            <div className="px-4 py-2 border-t border-gray-200">
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-700">Star:</span>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    className="text-lg hover:scale-110 transition-transform"
                    style={{ color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#8b5cf6'][rating - 1] }}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
