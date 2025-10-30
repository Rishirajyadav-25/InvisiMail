'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Inbox, Send, AlertOctagon, Trash2, Reply, MoreVertical, RefreshCw, LogOut, ChevronLeft, ChevronRight, User } from 'lucide-react';
import AssistantChatPhase2 from '@/components/AssistantChatPhase2';

// Enhanced Sidebar with hover expand/collapse
function EnhancedSidebar({ user, counts, mailType, setMailType, onLogout, isExpanded, setIsExpanded }) {
    return (
        <aside 
            className={`bg-white border-r border-gray-200 flex-col h-screen hidden lg:flex transition-all duration-300 ease-in-out ${
                isExpanded ? 'w-64' : 'w-20'
            } relative group`}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* User Profile Section */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {user?.name ? user.name.charAt(0).toUpperCase() : <User size={24} />}
                    </div>
                </div>
                {isExpanded && (
                    <div className="text-center overflow-hidden">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{user?.name || 'User'}</h3>
                        <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 overflow-y-auto">
                <ul className="space-y-2">
                    {/* Back to Dashboard */}
                    <li>
                        <Link 
                            href="/dashboard" 
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200 group/item"
                            title="Back to Dashboard"
                        >
                            <ChevronLeft size={20} className="flex-shrink-0" />
                            {isExpanded && <span className="text-sm font-medium">Dashboard</span>}
                        </Link>
                    </li>
                    
                    <li className="py-2">
                        <hr className="border-gray-200" />
                    </li>

                    {/* Mail Categories */}
                    {[
                        { name: 'All', type: 'all', icon: Mail, count: counts.all || 0 },
                        { name: 'Received', type: 'received', icon: Inbox, count: counts.received || 0 },
                        { name: 'Sent', type: 'sent', icon: Send, count: counts.sent || 0 },
                        { name: 'Spam', type: 'spam', icon: AlertOctagon, count: counts.spam || 0 },
                    ].map((item) => {
                        const IconComponent = item.icon;
                        const isActive = mailType === item.type;
                        
                        return (
                            <li key={item.name}>
                                <button
                                    onClick={() => setMailType(item.type)}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                    title={item.name}
                                >
                                    <IconComponent size={20} className="flex-shrink-0" />
                                    {isExpanded && (
                                        <>
                                            <span className="flex-1 text-left">{item.name}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                isActive ? 'bg-white/20' : 'bg-gray-200'
                                            }`}>
                                                {item.count}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Logout Button */}
            <div className="p-3 border-t border-gray-200">
                <button 
                    onClick={onLogout} 
                    className="w-full flex items-center justify-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                    title="Logout"
                >
                    <LogOut size={20} className="flex-shrink-0" />
                    {isExpanded && <span>Logout</span>}
                </button>
            </div>

            {/* Expand/Collapse Toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-md"
            >
                {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
        </aside>
    );
}

// Enhanced Email Detail View with real API integration
function EnhancedEmailDetail({ emailId, onUpdate, user }) {
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

    const formatFullDate = (dateString) => new Date(dateString).toLocaleString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    const canUserReply = () => {
        if (!email || !user || !alias || email.isSentEmail || email.isSpam) return false;
        if (!alias.isCollaborative) return alias.ownerId?.toString() === user._id?.toString();
        if (alias.ownerId?.toString() === user._id?.toString()) return true;
        const collaborator = alias.collaborators?.find(c => c.userId?.toString() === user._id?.toString());
        return collaborator?.role === 'member';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-3"></div>
                    <p className="text-gray-600">Loading email...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-600 mb-4">Error: {error}</div>
                <button onClick={fetchEmailData} className="text-blue-600 hover:text-blue-700">Try Again</button>
            </div>
        );
    }

    if (!email) return null;

    const displayInfo = {
        isSpam: email.isSpam || false,
        isSentEmail: email.isSentEmail || false,
        displayFrom: email.isSentEmail ? email.aliasEmail : email.from,
    };

    return (
        <div className="bg-white h-full flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">{email.subject || '(No Subject)'}</h2>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                    {displayInfo.displayFrom.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium">{displayInfo.displayFrom}</span>
                            </div>
                            <span className="text-slate-400">•</span>
                            <span>{formatFullDate(email.receivedAt)}</span>
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {canUserReply() && (
                            <Link 
                                href={`/dashboard/send?reply=${emailId}`}
                                className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                                title="Reply"
                            >
                                <Reply size={18} />
                            </Link>
                        )}
                        {displayInfo.isSpam ? (
                            <button 
                                onClick={() => toggleSpamStatus(false)}
                                className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                                title="Not Spam"
                            >
                                <AlertOctagon size={18} />
                            </button>
                        ) : (
                            <button 
                                onClick={() => toggleSpamStatus(true)}
                                className="p-2 rounded-lg hover:bg-orange-50 text-orange-600 transition-colors"
                                title="Mark as Spam"
                            >
                                <AlertOctagon size={18} />
                            </button>
                        )}
                        <button 
                            onClick={deleteEmail}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                            <MoreVertical size={18} />
                        </button>
                    </div>
                </div>

                {/* Tags */}
                <div className="flex gap-2">
                    {!email.isRead && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                            Unread
                        </span>
                    )}
                    {displayInfo.isSpam && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                            Spam
                        </span>
                    )}
                </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 p-6 bg-white overflow-y-auto">
                {displayInfo.isSpam && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                        <div className="flex items-start gap-3">
                            <AlertOctagon className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-semibold text-red-900">Spam Warning</h3>
                                <p className="text-sm text-red-700 mt-1">This email was identified as spam. Be cautious with links and attachments.</p>
                            </div>
                        </div>
                    </div>
                )}
                
                {email.bodyHtml ? (
                    <div 
                        className="prose max-w-none text-slate-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                    />
                ) : (
                    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-mono text-sm bg-gray-50 p-4 rounded-md border">
                        {email.bodyPlain || 'No content.'}
                    </div>
                )}
            </div>
        </div>
    );
}

// Enhanced Email List Item
function EmailListItem({ email, isSelected, onClick, formatDate }) {
    const isUnread = !email.isRead;
    
    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-4 border-b border-slate-100 transition-all duration-200 ${
                isSelected 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                    : email.isSpam
                    ? 'bg-red-50/50 hover:bg-red-50 border-l-4 border-l-red-300'
                    : isUnread
                    ? 'bg-white hover:bg-slate-50 border-l-4 border-l-blue-400'
                    : 'bg-white hover:bg-slate-50 border-l-4 border-l-transparent'
            }`}
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
                    email.isSpam 
                        ? 'bg-gradient-to-br from-red-400 to-red-600'
                        : 'bg-gradient-to-br from-blue-400 to-purple-500'
                }`}>
                    {(email.isSentEmail ? (email.to || 'T') : (email.from || 'F')).charAt(0).toUpperCase()}
                </div>
                
                {/* Email Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <p className={`truncate ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {email.isSentEmail ? `To: ${email.to}` : email.from}
                        </p>
                        <span className="text-xs text-slate-500 ml-2 flex-shrink-0">{formatDate(email.receivedAt)}</span>
                    </div>
                    
                    <p className={`truncate text-sm mb-1 ${isUnread ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                        {email.subject || '(No Subject)'}
                    </p>
                    
                    <p className="text-sm text-slate-500 truncate">
                        {email.bodyPlain?.substring(0, 80) || '...'}
                    </p>
                    
                    {/* Badges */}
                    <div className="flex gap-2 mt-2">
                        {email.isSpam && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                Spam
                            </span>
                        )}
                        {isUnread && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                New
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
}

// Enhanced Email List Pane with real API integration
function EnhancedEmailList({ emails, loading, selectedEmailId, onSelectEmail, mailType, aliases, selectedAlias, setSelectedAlias, unreadOnly, setUnreadOnly, onRefresh, formatDate }) {
    return (
        <div className="bg-white flex flex-col h-full border-r border-slate-200">
            {/* Header */}
            <header className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
                <div className="flex justify-between items-center mb-3">
                    <h1 className="text-xl font-bold text-slate-900 capitalize">{mailType} Emails</h1>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onRefresh}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={18} />
                        </button>
                        <Link 
                            href="/dashboard/send"
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-lg text-base font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200 flex items-center gap-2"
                        >
                            <Send size={18} />
                            Compose
                        </Link>
                    </div>
                </div>
                
                {/* Filters */}
                <div className="flex items-center gap-3">
                    <select 
                        value={selectedAlias} 
                        onChange={(e) => setSelectedAlias(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                        <option value="">All Aliases</option>
                        {aliases.map((alias) => (
                            <option key={alias._id} value={alias.aliasEmail}>{alias.aliasEmail}</option>
                        ))}
                    </select>
                    
                    <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <input 
                            type="checkbox" 
                            checked={unreadOnly} 
                            onChange={(e) => setUnreadOnly(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Unread only</span>
                    </label>
                </div>
                <div className="mt-3">
  <AssistantChatPhase2 />
</div>
            </header>

            {/* Email List */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mx-auto mb-3"></div>
                        <p className="text-slate-600">Loading emails...</p>
                    </div>
                </div>
            ) : emails.length > 0 ? (
                <div className="flex-1 overflow-y-auto">
                    {emails.map(email => (
                        <EmailListItem
                            key={email._id}
                            email={email}
                            isSelected={selectedEmailId === email._id}
                            onClick={() => onSelectEmail(email._id)}
                            formatDate={formatDate}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Mail className="mx-auto mb-3 text-slate-300" size={48} />
                        <p className="text-slate-500 font-medium">No emails here</p>
                        <p className="text-sm text-slate-400 mt-1">Your inbox is empty</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Main Inbox Component with real API integration
function InboxMainComponent() {
    const [emails, setEmails] = useState([]);
    const [user, setUser] = useState(null);
    const [aliases, setAliases] = useState([]);
    const [counts, setCounts] = useState({});
    const [loadingList, setLoadingList] = useState(true);
    const [selectedEmailId, setSelectedEmailId] = useState(null);
    const [mailType, setMailType] = useState('all');
    const [selectedAlias, setSelectedAlias] = useState('');
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const emailIdFromUrl = searchParams.get('id');
        const typeFromUrl = searchParams.get('type');
        setSelectedEmailId(emailIdFromUrl);
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

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            <EnhancedSidebar
                user={user}
                counts={counts}
                mailType={mailType}
                setMailType={setMailType}
                onLogout={handleLogout}
                isExpanded={isExpanded}
                setIsExpanded={setIsExpanded}
            />
            
            <div className="flex-1 flex overflow-hidden">
                {selectedEmailId ? (
                    <>
                        <div className="w-96 flex-shrink-0">
                            <EnhancedEmailList
                                emails={emails}
                                loading={loadingList}
                                selectedEmailId={selectedEmailId}
                                onSelectEmail={handleSelectEmail}
                                mailType={mailType}
                                aliases={aliases}
                                selectedAlias={selectedAlias}
                                setSelectedAlias={setSelectedAlias}
                                unreadOnly={unreadOnly}
                                setUnreadOnly={setUnreadOnly}
                                onRefresh={fetchListData}
                                formatDate={formatDate}
                            />
                        </div>
                        <div className="flex-1">
                            <EnhancedEmailDetail
                                key={selectedEmailId}
                                emailId={selectedEmailId}
                                user={user}
                                onUpdate={() => {
                                    router.push(`/dashboard/inbox?type=${mailType}`, { scroll: false });
                                    fetchListData();
                                }}
                            />
                        </div>
                    </>
                ) : (
                    <EnhancedEmailList
                        emails={emails}
                        loading={loadingList}
                        selectedEmailId={selectedEmailId}
                        onSelectEmail={handleSelectEmail}
                        mailType={mailType}
                        aliases={aliases}
                        selectedAlias={selectedAlias}
                        setSelectedAlias={setSelectedAlias}
                        unreadOnly={unreadOnly}
                        setUnreadOnly={setUnreadOnly}
                        onRefresh={fetchListData}
                        formatDate={formatDate}
                    />
                )}
            </div>
        </div>
    );
}

// Page Wrapper with Suspense - This is the default export
export default function UnifiedInboxPage() {
    return (
        <Suspense fallback={
            <div className="h-screen w-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <InboxMainComponent />
        </Suspense>
    );
}