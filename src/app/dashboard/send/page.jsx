'use client';
import { useState, useEffect } from 'react';

// --- Sidebar Component ---
// This version uses standard <a> tags and browser APIs to avoid dependency issues.
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

// --- Main Email Sending Form Component ---
function SendEmailForm({ user }) {
    const [formData, setFormData] = useState({ to: '', subject: '', message: '' });
    const [aliases, setAliases] = useState([]);
    const [sendableAliases, setSendableAliases] = useState([]);
    const [selectedAlias, setSelectedAlias] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [prompt, setPrompt] = useState('');
  
    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const aliasFromQuery = params.get('alias');
      const replyToId = params.get('reply');
  
      fetchAliases();
      
      if (aliasFromQuery) setSelectedAlias(aliasFromQuery);
      if (replyToId) fetchReplyData(replyToId);
      
    }, []);
  
    const fetchAliases = async () => {
        try {
            const response = await fetch('/api/aliases');
            if (response.ok) setAliases(await response.json());
        } catch (error) {
            console.error('Error fetching aliases:', error);
        }
    };

    const fetchReplyData = async (emailId) => {
        try {
            const response = await fetch(`/api/inbox/${emailId}`);
            if (response.ok) {
                const email = await response.json();
                setSelectedAlias(email.aliasEmail);
                setFormData({
                    to: email.from,
                    subject: email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`,
                    message: `\n\n--- Original Message ---\nFrom: ${email.from}\nTo: ${email.aliasEmail}\nSubject: ${email.subject}\n\n${email.bodyPlain}`
                });
                await handleAIAssist(email._id, 'enhance');
            }
        } catch (error) {
            console.error('Error fetching reply data:', error);
        }
    };
  
    const handleAIAssist = async (emailId, mode = 'enhance') => {
        setLoading(true);
        try {
          const action = mode === 'write' ? 'write' : 'enhance';
          const res = await fetch(`/api/ai/process?emailId=${emailId || 'placeholder'}&action=${action}&subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(formData.message)}&recipient=${encodeURIComponent(formData.to)}&prompt=${encodeURIComponent(prompt)}`);
          
          const data = await res.json();
          if (res.ok) {
            const content = action === 'write' ? data.writtenContent : data.enhancedContent;
            const [newSubject, ...rest] = content.split('\n\n');
            const newBody = rest.join('\n\n').trim();
            
            setFormData(prev => ({ ...prev, subject: newSubject.replace('Subject: ', ''), message: newBody }));
          } else {
            setError(data.error || 'Failed to get AI suggestions.');
          }
        } catch (error) {
          setError('An error occurred while using AI assist.');
        } finally {
          setLoading(false);
        }
    };
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        const response = await fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: selectedAlias,
            to: formData.to,
            subject: formData.subject,
            text: formData.message
          })
        });
        if (response.ok) {
          setSuccess('Email sent successfully!');
          setFormData({ to: '', subject: '', message: '' });
          setPrompt('');
          setTimeout(() => window.location.href = '/dashboard/inbox-new', 2000);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to send email');
        }
      } catch (error) {
        setError('Network error while sending email');
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      if (user && aliases.length > 0) {
        const filtered = aliases.filter(a => {
          if (!a.isCollaborative) return true;
          if (user._id && a.ownerId.toString() === user._id.toString()) return true;
          const collab = a.collaborators?.find(c => user._id && c.userId.toString() === user._id.toString());
          return collab && (collab.role === 'member' || collab.role === 'admin');
        });
        setSendableAliases(filtered);
        if (!selectedAlias && filtered.length > 0) {
          setSelectedAlias(filtered[0].aliasEmail);
        }
      }
    }, [user, aliases, selectedAlias]);

  return (
    <div className="max-w-4xl w-full mx-auto p-6 bg-white rounded-lg shadow-md">
       <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">Compose Email</h1>
       {error && <div className="bg-red-100 border border-red-400 text-red-700 p-3 mb-4 rounded">{error}</div>}
       {success && <div className="bg-green-100 border border-green-400 text-green-700 p-3 mb-4 rounded">{success}</div>}
       <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={selectedAlias}
            onChange={(e) => setSelectedAlias(e.target.value)}
            disabled={loading || sendableAliases.length === 0}
            required
          >
            <option value="" disabled>Select an alias to send from...</option>
            {sendableAliases.map((alias) => (
              <option key={alias._id.toString()} value={alias.aliasEmail}>
                {alias.aliasEmail} {alias.isCollaborative && '(Team)'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
          <input
            type="email"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.to}
            onChange={(e) => setFormData({...formData, to: e.target.value})}
            placeholder="recipient@example.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
          <input
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.subject}
            onChange={(e) => setFormData({...formData, subject: e.target.value})}
            placeholder="Email subject line"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
          <textarea
            rows={14}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-y"
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            placeholder="Type your message here..."
            required
          />
        </div>
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <label className="block text-sm font-medium text-gray-800">AI Assistant ✨</label>
          <input
            type="text"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Optional: Enter a prompt to auto-write the email (e.g., a professional follow-up)"
          />
          <button
            type="button"
            onClick={() => handleAIAssist('placeholder', prompt ? 'write' : 'enhance')}
            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!formData.to || !formData.subject || loading}
          >
            {prompt ? 'Auto-Write with AI' : 'Improve Draft with AI'}
          </button>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={loading || !selectedAlias}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : 'Send Email'}
            </button>
            <button
              type="button"
              onClick={() => setFormData({ to: '', subject: '', message: '' })}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {formData.message.length} characters
          </div>
        </div>
      </form>
    </div>
  );
}

// --- Parent Page Component ---
export default function SendPageLayout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/user');
        if (response.ok) setUser(await response.json());
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    }
    fetchUser();
  }, []);

  return (
    <div className="flex bg-gray-100 h-screen overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col">
        {/* Header has been removed */}
        <div className="flex-1 overflow-y-auto p-6">
          <SendEmailForm user={user} />
        </div>
      </main>
    </div>
  );
}

