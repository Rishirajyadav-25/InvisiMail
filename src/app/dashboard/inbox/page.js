'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// --- Component 1: The Sidebar (No Changes) ---
function InboxSidebar({ user, counts, mailType, setMailType, onLogout }) {
    return (
        <aside className="w-80 bg-white border-r border-gray-200 flex-col min-h-screen hidden lg:flex">
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
                    <li>
                        <Link href="/dashboard" className="block w-full px-4 py-3 rounded-lg text-center text-sm font-medium border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200">
                            <div className="flex items-center justify-center gap-3"><span className="text-lg">⬅️</span>Back to Dashboard</div>
                        </Link>
                    </li>
                    <li className="pt-2"><hr /></li>
                    {[
                        { name: 'All', type: 'all', icon: '🗂️', count: counts.all || 0 },
                        { name: 'Received', type: 'received', icon: '📥', count: counts.received || 0 },
                        { name: 'Sent', type: 'sent', icon: '📤', count: counts.sent || 0 },
                        { name: 'Spam', type: 'spam', icon: '🚫', count: counts.spam || 0 },
                    ].map((item) => (
                        <li key={item.name}>
                        <button
                            onClick={() => setMailType(item.type)}
                            className={`block w-full px-4 py-3 rounded-lg text-left text-sm font-medium border transition-all duration-200 ${
                            mailType === item.type
                                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3"><span className="text-lg">{item.icon}</span>{item.name}</div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    mailType === item.type ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'
                                }`}>{item.count}</span>
                            </div>
                        </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-6 border-t border-gray-200">
                <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-center text-sm font-medium border bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition-all duration-200">
                    <span className="text-lg">🚪</span>Logout
                </button>
            </div>
        </aside>
    );
}

// --- Component 2: The Detailed Email View Pane ---
function EmailDetailView({ emailId, onUpdate, user }) {
    const [email, setEmail] = useState(null);
    const [alias, setAlias] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
  
    const fetchEmailData = useCallback(async () => {
      if (!emailId) return;
      setLoading(true);
      setError('');
      try {
        const emailRes = await fetch(`/api/inbox/${emailId}`);
        if (!emailRes.ok) throw new Error(`Failed to fetch email (${emailRes.status})`);
        const emailData = await emailRes.json();
        setEmail(emailData);
  
        if (emailData.aliasEmail) {
          const aliasRes = await fetch('/api/aliases');
          if (aliasRes.ok) {
            const aliases = await aliasRes.json();
            const foundAlias = aliases.find(a => a.aliasEmail === emailData.aliasEmail);
            setAlias(foundAlias);
          }
        }
  
        if (!emailData.isRead) {
          await fetch(`/api/inbox/${emailId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRead: true }),
          });
        }
      } catch (err) {
        console.error('Error fetching email details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, [emailId]);
  
    useEffect(() => {
      fetchEmailData();
    }, [fetchEmailData]);
  
    const deleteEmail = async () => {
        if (!confirm('Are you sure you want to permanently delete this email?')) return;
        try {
            const response = await fetch(`/api/inbox/${emailId}`, { method: 'DELETE' });
            if (response.ok) onUpdate();
            else alert('Failed to delete email.');
        } catch (err) {
            alert('A network error occurred.');
        }
    };

    const toggleSpamStatus = async (isSpam) => {
        try {
            const response = await fetch(`/api/inbox/${emailId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isSpam }),
            });
            if (response.ok) onUpdate();
            else alert('Failed to update spam status.');
        } catch (err) {
            alert('A network error occurred.');
        }
    };
  
    const formatFullDate = (dateString) => new Date(dateString).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const getSpamLevelColor = (spamLevel) => {
        switch (spamLevel) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };
    const canUserReply = () => {
        if (!email || !user || !alias || email.isSentEmail || email.isSpam) return false;
        if (!alias.isCollaborative) return alias.ownerId?.toString() === user._id?.toString();
        if (alias.ownerId?.toString() === user._id?.toString()) return true;
        const collaborator = alias.collaborators?.find(c => c.userId?.toString() === user._id?.toString());
        return collaborator?.role === 'member';
    };
    
    if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    if (!email) return null;

    const displayInfo = {
        isSpam: email.isSpam || false,
        isSentEmail: email.isSentEmail || false,
        displayFrom: email.isSentEmail ? email.aliasEmail : email.from,
    };
  
    return (
        <div className="bg-white h-full flex flex-col overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold truncate">{email.subject || '(No Subject)'}</h2>
                    <p className="text-sm text-gray-500 truncate">From: {displayInfo.displayFrom}</p>
                </div>
                <div className="flex items-center space-x-2">
                    {canUserReply() && <Link href={`/dashboard/send?reply=${emailId}`} className="p-2 rounded-md hover:bg-gray-100 text-sm">Reply</Link>}
                    {displayInfo.isSpam ? <button onClick={() => toggleSpamStatus(false)} className="p-2 rounded-md hover:bg-gray-100 text-sm text-green-600">Not Spam</button> : <button onClick={() => toggleSpamStatus(true)} className="p-2 rounded-md hover:bg-gray-100 text-sm text-orange-600">Mark Spam</button>}
                    <button onClick={deleteEmail} className="p-2 rounded-md hover:bg-gray-100 text-sm text-red-600">Delete</button>
                </div>
            </div>
            <div className="flex-1 p-6">
                {displayInfo.isSpam && <div className={`p-4 mb-4 border-l-4 ${getSpamLevelColor(email.spamLevel)}`}><h3 className="font-bold">Spam Email Detected</h3><p className="text-sm mt-1">This email was marked as spam. Please be cautious.</p></div>}
                {email.bodyHtml ? <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: email.bodyHtml }} /> : <div className="whitespace-pre-wrap font-mono text-sm">{email.bodyPlain || 'No content.'}</div>}
            </div>
        </div>
    );
}

// --- Component 3: Reusable Email List Pane ---
// This component renders the header, filters, and list of emails.
function EmailListPane({ emails, loading, selectedEmailId, onSelectEmail, mailType, aliases, selectedAlias, setSelectedAlias, unreadOnly, setUnreadOnly, onRefresh, formatDate }) {
    return (
        <div className="bg-white flex flex-col h-full">
            <header className="p-4 border-b flex-shrink-0 flex justify-between items-center">
                <h1 className="text-xl font-bold capitalize">{mailType}</h1>
                <div className="flex items-center space-x-2">
                    <button onClick={onRefresh} className="p-2 rounded-md hover:bg-gray-100" title="Refresh">🔄</button>
                    <Link href="/dashboard/send" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium">Compose</Link>
                </div>
            </header>
            <div className="p-2 border-b flex-shrink-0 bg-gray-50 flex items-center space-x-2">
                <select value={selectedAlias} onChange={(e) => setSelectedAlias(e.target.value)} className="flex-1 w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                    <option value="">All Aliases</option>
                    {aliases.map((alias) => <option key={alias._id} value={alias.aliasEmail}>{alias.aliasEmail}</option>)}
                </select>
                <label className="flex items-center space-x-2 cursor-pointer pr-2">
                    <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                    <span className="text-sm text-gray-700">Unread</span>
                </label>
            </div>
            {loading ? (
                <div className="flex-1 flex items-center justify-center"><p>Loading emails...</p></div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    {emails.length > 0 ? emails.map(email => (
                        <button key={email._id} onClick={() => onSelectEmail(email._id)}
                            className={`w-full text-left p-3 border-b hover:bg-gray-50 transition-colors duration-150
                            ${selectedEmailId === email._id ? 'bg-blue-100 border-l-4 border-blue-500' :
                              email.isSpam ? 'bg-red-50 border-l-4 border-transparent' : // Spam has a light red background
                              !email.isRead ? 'bg-white border-l-4 border-blue-400' : 
                              'border-l-4 border-transparent'}`}
                        >
                            <div className={`flex justify-between text-sm ${!email.isRead && selectedEmailId !== email._id ? 'font-bold' : 'font-medium'}`}>
                                <p className="truncate">{email.isSentEmail ? `To: ${email.to}` : email.from}</p>
                                <p className="flex-shrink-0 ml-2">{formatDate(email.receivedAt)}</p>
                            </div>
                            <p className={`mt-1 truncate ${!email.isRead && selectedEmailId !== email._id ? 'text-gray-800' : 'text-gray-600'}`}>{email.subject || '(No Subject)'}</p>
                            <p className="text-sm text-gray-500 truncate">{email.bodyPlain?.substring(0, 100) || '...'}</p>
                        </button>
                    )) : (
                        <div className="p-8 text-center text-gray-500">No emails here.</div>
                    )}
                </div>
            )}
        </div>
    );
}


// --- Component 4: Main Inbox Layout ---
// This orchestrates the layout, switching between single and two-pane views.
function Inbox() {
    const [emails, setEmails] = useState([]);
    const [user, setUser] = useState(null);
    const [aliases, setAliases] = useState([]);
    const [counts, setCounts] = useState({});
    const [loadingList, setLoadingList] = useState(true);
    const [selectedEmailId, setSelectedEmailId] = useState(null);
    const [mailType, setMailType] = useState('all');
    const [selectedAlias, setSelectedAlias] = useState('');
    const [unreadOnly, setUnreadOnly] = useState(false);
    
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const emailIdFromUrl = searchParams.get('id');
        const typeFromUrl = searchParams.get('type');
        setSelectedEmailId(emailIdFromUrl); // This will be null if the param doesn't exist
        if (typeFromUrl) setMailType(typeFromUrl);
    }, [searchParams]);

    const fetchListData = useCallback(async () => {
        setLoadingList(true);
        try {
            const userResPromise = fetch('/api/user');
            const aliasesResPromise = fetch('/api/aliases');
            
            const params = new URLSearchParams({ type: mailType, limit: '100' });
            if (selectedAlias) params.append('alias', selectedAlias);
            if (unreadOnly) params.append('unread', 'true');
            
            const emailsRes = await fetch(`/api/inbox?${params}`);
            if (!emailsRes.ok) throw new Error('Failed to fetch emails');
            const emailData = await emailsRes.json();
            setEmails(emailData.emails || []);
            setCounts(emailData.counts || {});

            const userRes = await userResPromise;
            if(userRes.ok) setUser(await userRes.json());

            const aliasesRes = await aliasesResPromise;
            if(aliasesRes.ok) setAliases(await aliasesRes.json() || []);

        } catch (error) {
            console.error('Error fetching inbox list:', error);
        } finally {
            setLoadingList(false);
        }
    }, [mailType, selectedAlias, unreadOnly]);
    
    useEffect(() => {
        fetchListData();
    }, [fetchListData]);

    const handleSelectEmail = (emailId) => {
        router.push(`/dashboard/inbox?type=${mailType}&id=${emailId}`, { scroll: false });
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.ceil((now - date) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffDays <= 7) return date.toLocaleDateString([], { weekday: 'short' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    // Prepare props for the EmailListPane to avoid repetition
    const emailListProps = {
        emails, loading: loadingList, selectedEmailId, onSelectEmail: handleSelectEmail, mailType,
        aliases, selectedAlias, setSelectedAlias, unreadOnly, setUnreadOnly, onRefresh: fetchListData, formatDate
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <InboxSidebar user={user} counts={counts} mailType={setMailType} setMailType={setMailType} onLogout={handleLogout} />
            
            <div className="flex-1 flex flex-row overflow-hidden border-l">
                {selectedEmailId ? (
                    // --- TWO-PANE VIEW ---
                    <>
                        <div className="w-[450px] flex-shrink-0 border-r bg-white flex flex-col">
                           <EmailListPane {...emailListProps} />
                        </div>
                        <div className="flex-1 bg-gray-50">
                           <EmailDetailView 
                                key={selectedEmailId}
                                emailId={selectedEmailId}
                                user={user}
                                onUpdate={() => {
                                    router.push(`/dashboard/inbox?type=${mailType}`, { scroll: false });
                                    // No need to set ID to null here, useEffect will handle it
                                    fetchListData();
                                }}
                            />
                        </div>
                    </>
                ) : (
                    // --- SINGLE-PANE (FULL-WIDTH) VIEW ---
                    <EmailListPane {...emailListProps} />
                )}
            </div>
        </div>
    );
}


// --- Page Wrapper with Suspense ---
export default function UnifiedInboxPage() {
    return (
        <Suspense fallback={
            <div className="h-screen w-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <Inbox />
        </Suspense>
    );
}