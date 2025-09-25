'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import EmailList from '../../../components/EmailList';
import EmailDetail from '../../../components/EmailDetail';

export default function InboxNew() {
  const [emails, setEmails] = useState([]);
  const [aliases, setAliases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [user, setUser] = useState(null);
  const [alias, setAlias] = useState(null);
  const [inboxStats, setInboxStats] = useState({ unreadCount: 0, totalEmails: 0, spamCount: 0 });
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchUserData();
    fetchEmails();
    fetchAliases();
    fetchInboxStats();
    
    // Set selected email from URL if present
    const emailId = searchParams.get('emailId');
    if (emailId) {
      setSelectedEmailId(emailId);
      fetchEmailDetails(emailId);
    }
  }, [searchParams]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 401) {
        router.push('/signin');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50'
      });
      
      const response = await fetch(`/api/inbox?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
        setInboxStats({
          unreadCount: data.counts?.unread || 0,
          totalEmails: data.counts?.all || 0,
          spamCount: data.counts?.spam || 0
        });
      } else if (response.status === 401) {
        router.push('/signin');
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
    setLoading(false);
  };

  const fetchAliases = async () => {
    try {
      const response = await fetch('/api/aliases');
      if (response.ok) {
        const aliasData = await response.json();
        setAliases(aliasData);
      }
    } catch (error) {
      console.error('Error fetching aliases:', error);
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
          spamCount: data.counts?.spam || 0
        });
      }
    } catch (error) {
      console.error('Error fetching inbox stats:', error);
    }
  };

  const fetchEmailDetails = async (emailId) => {
    try {
      const response = await fetch(`/api/inbox/${emailId}`);
      if (response.ok) {
        const emailData = await response.json();
        setSelectedEmail(emailData);

        // Fetch alias data if needed
        if (emailData.aliasEmail) {
          const aliasResponse = await fetch('/api/aliases');
          if (aliasResponse.ok) {
            const aliases = await aliasResponse.json();
            const foundAlias = aliases.find(a => a.aliasEmail === emailData.aliasEmail);
            setAlias(foundAlias);
          }
        }

        // Mark as read if unread
        if (!emailData.isRead) {
          await markAsRead(emailId, true);
        }
      }
    } catch (error) {
      console.error('Error fetching email details:', error);
    }
  };

  const handleEmailSelect = (emailId) => {
    setSelectedEmailId(emailId);
    fetchEmailDetails(emailId);
    // Update URL without page reload
    const url = new URL(window.location);
    url.searchParams.set('emailId', emailId);
    window.history.pushState({}, '', url);
  };

  const markAsRead = async (emailId, isRead) => {
    try {
      await fetch(`/api/inbox/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead })
      });
      fetchEmails(); // Refresh the list
    } catch (error) {
      console.error('Error updating email:', error);
    }
  };

  const deleteEmail = async (emailId) => {
    if (!confirm('Delete this email?')) return;
    try {
      await fetch(`/api/inbox/${emailId}`, { method: 'DELETE' });
      if (selectedEmailId === emailId) {
        setSelectedEmailId(null);
        setSelectedEmail(null);
        // Remove from URL
        const url = new URL(window.location);
        url.searchParams.delete('emailId');
        window.history.pushState({}, '', url);
      }
      fetchEmails();
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  };

  const markAsSpam = async (emailId, isSpam) => {
    try {
      await fetch(`/api/inbox/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSpam })
      });
      fetchEmails();
    } catch (error) {
      console.error('Error updating spam status:', error);
    }
  };

  if (loading && emails.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen email-client-bg flex items-center justify-center p-4">
      <div className="h-[95vh] w-full max-w-7xl email-window flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar inboxStats={inboxStats} />
        
        {/* Middle Column - Email List */}
        <div className="flex-1 flex flex-col min-w-0">
          <EmailList
            emails={emails}
            loading={loading}
            selectedEmailId={selectedEmailId}
            onEmailSelect={handleEmailSelect}
            onMarkAsRead={markAsRead}
            onDelete={deleteEmail}
            onMarkAsSpam={markAsSpam}
          />
        </div>
        
        {/* Right Column - Email Detail */}
        <div className="flex-1 flex flex-col min-w-0 border-l border-gray-200">
          <EmailDetail
            email={selectedEmail}
            user={user}
            alias={alias}
          />
        </div>
      </div>
    </div>
  );
}
