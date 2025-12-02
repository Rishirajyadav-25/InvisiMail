'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { FiSend, FiMail, FiZap, FiRefreshCw, FiX } from 'react-icons/fi';
import AssistantChatPhase2 from '@/components/AssistantChatPhase2';

export default function SendEmail() {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: ''
  });
  const [aliases, setAliases] = useState([]);
  const [sendableAliases, setSendableAliases] = useState([]);
  const [selectedAlias, setSelectedAlias] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [prompt, setPrompt] = useState('');
  const [replyId, setReplyId] = useState(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch Reply Data Logic
  const fetchReplyData = useCallback(async (emailId) => {
    try {
      const response = await fetch(`/api/inbox/${emailId}`);
      if (response.ok) {
        const email = await response.json();
        // Set the alias to the one that received the original email
        if (email.aliasEmail) setSelectedAlias(email.aliasEmail);
        
        setFormData({
          to: email.from,
          subject: email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`,
          message: `\n\n\n--- Original Message on ${new Date(email.date).toLocaleString()} ---\nFrom: ${email.from}\nSubject: ${email.subject}\n\n${email.bodyPlain || email.body}`
        });
      }
    } catch (error) {
      console.error('Error fetching reply data:', error);
      setError('Failed to load reply data.');
    }
  }, []);

  // 1. Initial Data Fetch (User & Aliases) - Runs once
  useEffect(() => {
    const initData = async () => {
      try {
        const [userRes, aliasRes] = await Promise.all([
          fetch('/api/user'),
          fetch('/api/aliases')
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        }

        if (aliasRes.ok) {
          const aliasData = await aliasRes.json();
          setAliases(aliasData);
        }
      } catch (err) {
        console.error('Error initializing data:', err);
      }
    };

    initData();
  }, []);

  // 2. Handle Query Params (Reply & Pre-selected Alias)
  useEffect(() => {
    const aliasFromQuery = searchParams.get('alias');
    const replyToId = searchParams.get('reply');
    
    if (aliasFromQuery) {
      setSelectedAlias(aliasFromQuery);
    }
    
    if (replyToId) {
      setReplyId(replyToId);
      fetchReplyData(replyToId);
    }
  }, [searchParams, fetchReplyData]);

  // Filter aliases based on permissions
  useEffect(() => {
    if (user && aliases.length > 0) {
      const filtered = aliases.filter(a => {
        if (!a.isCollaborative) return true;
        if (a.ownerId.toString() === user._id.toString()) return true;
        const collab = a.collaborators?.find(c => c.userId.toString() === user._id.toString());
        return collab && (collab.role === 'member' || collab.role === 'admin');
      });
      setSendableAliases(filtered);
      
      // Only set default if nothing is selected (preserves selection from query params)
      if (!selectedAlias && filtered.length > 0) {
        setSelectedAlias(filtered[0].aliasEmail);
      }
    }
  }, [user, aliases, selectedAlias]);

  const handleAIAssist = async (mode = 'enhance') => {
    setAiLoading(true);
    setError('');
    
    try {
      // Validation
      if (mode === 'write' && !prompt.trim()) {
        throw new Error('Please enter what you want to write in the AI Assistant field.');
      }
      
      if (mode === 'enhance' && !formData.message.trim() && !formData.subject.trim()) {
        throw new Error('Please enter a subject or message to improve.');
      }

      const requestBody = {
        action: mode,
        subject: formData.subject || '',
        body: formData.message || '',
        recipient: formData.to || '',
        prompt: prompt || '',
        emailId: replyId || undefined
      };

      const res = await fetch('/api/ai/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        throw new Error(`API request failed: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Extract content
      let content = mode === 'write' 
        ? (data.writtenContent || data.content) 
        : (data.enhancedContent || data.content);

      if (!content) throw new Error('No content received from AI.');

      // Parse Subject/Body
      const subjectMatch = content.match(/Subject:\s*(.+?)(?:\n|$)/i);
      let newSubject = '';
      let newBody = content;

      if (subjectMatch) {
        newSubject = subjectMatch[1].trim();
        newBody = content.replace(/Subject:\s*.+?(?:\n|$)/i, '').trim();
      }

      // Update State
      if (mode === 'write') {
        setFormData({
          to: formData.to,
          subject: newSubject || 'Email Subject',
          message: newBody || content
        });
        setPrompt('');
        setSuccess('✨ Email generated successfully!');
      } else {
        setFormData(prev => ({
          ...prev,
          subject: newSubject || prev.subject,
          message: newBody || content
        }));
        setSuccess('✨ Email improved successfully!');
      }

      setTimeout(() => setSuccess(''), 3000);
        
    } catch (error) {
      console.error('Error in AI assistance:', error);
      setError(error.message || 'Failed to process AI request.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/send-email', {
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
        setTimeout(() => router.push('/dashboard/inbox'), 2000);
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

  const handleUpgrade = async () => {
    // ... existing upgrade logic (kept for brevity, functional as is) ...
    try {
      const response = await fetch('/api/upgrade', { method: 'POST' });
      if (response.ok) {
        const { order } = await response.json();
        if (window.Razorpay) {
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'Email Alias Pro',
            description: 'Upgrade to Pro Plan',
            order_id: order.id,
            handler: function (response) {
              window.location.href = '/dashboard?upgraded=true';
            },
            prefill: { email: user?.email, name: user?.name }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      }
    } catch (error) {
      setError('Failed to initiate upgrade process');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <Sidebar user={user} onUpgrade={handleUpgrade} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Added Header Component Here */}
        <Header user={user} title="Compose" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Page Title Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <FiSend className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Compose Email</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Send professional emails from your aliases with AI assistance
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex justify-between items-center shadow-sm">
                <span>{error}</span>
                <button onClick={() => setError('')} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg flex justify-between items-center shadow-sm">
                <span>{success}</span>
                <button onClick={() => setSuccess('')} className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Assistant Chat Component */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
               <AssistantChatPhase2 />
            </div>

            {/* Email Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Email Details</h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                {/* From Alias Selection */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FiMail className="inline w-4 h-4 mr-2" />
                      Send From Alias
                    </label>
                    <div className="relative">
                      <select
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 appearance-none"
                        value={selectedAlias}
                        onChange={(e) => setSelectedAlias(e.target.value)}
                        disabled={loading || sendableAliases.length === 0}
                        required
                      >
                        <option value="">Select an alias...</option>
                        {sendableAliases.map((alias) => (
                          <option key={alias._id.toString()} value={alias.aliasEmail}>
                            {alias.aliasEmail} {alias.isCollaborative && '(Collaborative)'}
                          </option>
                        ))}
                      </select>
                      {/* Custom dropdown arrow if needed, but appearance-none + styling usually cleaner */}
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                      </div>
                    </div>
                  </div>

                  {/* Recipient */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      To
                    </label>
                    <input
                      type="email"
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:placeholder-gray-400"
                      value={formData.to}
                      onChange={(e) => setFormData({...formData, to: e.target.value})}
                      placeholder="recipient@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:placeholder-gray-400"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="Email subject"
                    required
                  />
                </div>

                {/* Message Body */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={12}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y transition-colors text-gray-900 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:placeholder-gray-400 font-sans"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Type your message here..."
                    required
                  />
                  <div className="flex items-center justify-end mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.message.length} characters
                    </p>
                  </div>
                </div>

                {/* AI Assistant Section */}
                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-5">
                  <label className="block text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                    <FiZap className="w-4 h-4 mr-2 text-yellow-500" />
                    AI Assistant
                  </label>
                  
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      className="flex-1 px-4 py-3 border border-blue-200 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., 'Write a polite follow-up for the invoice...'"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAIAssist('write');
                        }
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleAIAssist('write')}
                      disabled={aiLoading || loading || !prompt.trim()}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm"
                    >
                      {aiLoading ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiZap className="w-3.5 h-3.5" />}
                      Generate
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAIAssist('enhance')}
                      disabled={aiLoading || loading || (!formData.subject.trim() && !formData.message.trim())}
                      className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm"
                    >
                      {aiLoading ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiZap className="w-3.5 h-3.5" />}
                      Improve Existing
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ to: '', subject: '', message: '' });
                        setPrompt('');
                        setReplyId(null);
                        setError('');
                        setSuccess('');
                        router.replace('/dashboard/send');
                      }}
                      disabled={aiLoading || loading}
                      className={'ml-auto text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline decoration-dotted underline-offset-2'}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Submit Section */}
                <div className="flex items-center justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={loading || !selectedAlias || aiLoading}
                    className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 disabled:opacity-50 text-white font-medium py-3 px-8 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 shadow-lg hover:shadow-xl transform active:scale-95"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <FiSend className="w-4 h-4" />
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}