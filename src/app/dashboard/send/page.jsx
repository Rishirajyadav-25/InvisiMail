// src/app/dashboard/send/page.jsx - ENHANCED VERSION WITH SIDEBAR
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { FiSend, FiMail, FiZap, FiRefreshCw } from 'react-icons/fi';

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
  const [prompt, setPrompt] = useState(''); // New state for prompt
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchUser();
    fetchAliases();
    const aliasFromQuery = searchParams.get('alias');
    const replyToId = searchParams.get('reply');
    
    if (aliasFromQuery) {
      setSelectedAlias(aliasFromQuery);
    }
    
    if (replyToId) {
      fetchReplyData(replyToId);
    }
  }, [searchParams]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        setUser(await response.json());
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
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
        await handleAIAssist(email._id, 'enhance'); // Enhance existing reply
      }
    } catch (error) {
      console.error('Error fetching reply data:', error);
    }
  };

  const handleAIAssist = async (emailId, mode = 'enhance') => {
    setAiLoading(true);
    setError('');
    
    try {
      const action = mode === 'write' ? 'write' : 'enhance';
      const res = await fetch(`/api/ai/process?emailId=${emailId || 'placeholder'}&action=${action}&subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(formData.message)}&recipient=${encodeURIComponent(formData.to)}&prompt=${encodeURIComponent(prompt)}`, {
        method: 'GET',
      });
      const data = await res.json();
      
      if (res.ok) {
        let content = '';
        if (action === 'write') {
          content = data.writtenContent;
        } else if (action === 'enhance') {
          content = data.enhancedContent;
        }
        
        // Enhanced parsing to extract subject and body
        const lines = content.split('\n');
        let newSubject = '';
        let newBody = '';
        let bodyStarted = false;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          if (line.startsWith('Subject:')) {
            newSubject = line.replace('Subject:', '').trim();
          } else if (line.startsWith('Dear ') || bodyStarted) {
            bodyStarted = true;
            if (line !== '') {
              newBody += (newBody ? '\n' : '') + line;
            }
          }
        }
        
        // If parsing failed, use the whole content as body
        if (!newSubject && !newBody) {
          const subjectMatch = content.match(/Subject:\s*(.+)/i);
          if (subjectMatch) {
            newSubject = subjectMatch[1].trim();
            newBody = content.replace(/Subject:\s*.+/i, '').trim();
          } else {
            newBody = content;
          }
        }
        
        setFormData(prev => ({
          ...prev,
          subject: newSubject || prev.subject,
          message: newBody || content
        }));
        
        // Clear prompt after successful generation
        if (mode === 'write' && prompt) {
          setPrompt('');
        }
        
      } else {
        setError(`AI assistance failed: ${data.error || 'Unknown error'}`);
        console.error('Failed to get AI suggestions:', data);
      }
    } catch (error) {
      console.error('Error in AI assistance:', error);
      setError('Network error while getting AI assistance');
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
        setTimeout(() => router.push('/dashboard/inbox'), 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Send email error:', error);
      setError('Network error while sending email');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
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
            prefill: {
              email: user?.email,
              name: user?.name
            }
          };
          
          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      }
    } catch (error) {
      setError('Failed to initiate upgrade process');
    }
  };

  useEffect(() => {
    if (user && aliases.length > 0) {
      const filtered = aliases.filter(a => {
        if (!a.isCollaborative) return true;
        if (a.ownerId.toString() === user._id.toString()) return true;
        const collab = a.collaborators?.find(c => c.userId.toString() === user._id.toString());
        return collab && (collab.role === 'member' || collab.role === 'admin');
      });
      setSendableAliases(filtered);
      if (!selectedAlias && filtered.length > 0) {
        setSelectedAlias(filtered[0].aliasEmail);
      }
    }
  }, [user, aliases, selectedAlias]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar user={user} onUpgrade={handleUpgrade} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* <Header user={user} /> */}
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiSend className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Compose Email</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Send professional emails from your aliases with AI assistance
                  </p>
                </div>
              </div>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
                <button 
                  onClick={() => setError('')} 
                  className="float-right text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            )}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                {success}
                <button 
                  onClick={() => setSuccess('')} 
                  className="float-right text-green-500 hover:text-green-700"
                >
                  ×
                </button>
              </div>
            )}

            {/* Main Form */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Email Details</h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* From Alias Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiMail className="inline w-4 h-4 mr-2" />
                    Send From Alias
                  </label>
                  <select
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                  {sendableAliases.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      No aliases available. Create an alias first.
                    </p>
                  )}
                </div>

                {/* To Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To
                  </label>
                  <input
                    type="email"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={formData.to}
                    onChange={(e) => setFormData({...formData, to: e.target.value})}
                    placeholder="recipient@example.com"
                    required
                  />
                </div>

                {/* Subject Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="Email subject"
                    required
                  />
                </div>

               

                {/* Message Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={12}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y transition-colors"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Type your message here or use AI to generate it..."
                    required
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {formData.message.length} characters
                    </p>
                  </div>
                </div>
                 {/* AI Prompt Field */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    <FiZap className="inline w-4 h-4 mr-2" />
                    AI Assistant (Optional)
                  </label>
                  <input
                    type="text"
                    className="block w-full px-4 py-3 border border-blue-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Write a 5 day leave request for fever, Schedule a meeting for project discussion"
                  />
                  <p className="text-xs text-blue-600 mt-2">
                    Describe what kind of email you want to write, and AI will generate it for you.
                  </p>
                </div>

                {/* AI Buttons */}
                <div className="flex items-center gap-3 py-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleAIAssist('placeholder', prompt ? 'write' : 'enhance')}
                    disabled={aiLoading || loading}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    {aiLoading ? (
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiZap className="w-4 h-4" />
                    )}
                    {aiLoading ? 'Generating...' : (prompt ? 'Generate Email' : 'Improve Email')}
                  </button>
                  
                  {formData.message && !prompt && (
                    <button
                      type="button"
                      onClick={() => handleAIAssist('placeholder', 'enhance')}
                      disabled={aiLoading || loading}
                      className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <FiRefreshCw className="w-4 h-4" />
                      Enhance Text
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ to: '', subject: '', message: '' });
                      setPrompt('');
                    }}
                    className="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <button
                      type="submit"
                      disabled={loading || !selectedAlias || aiLoading}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 px-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                  
                  <div className="text-sm text-gray-500">
                    {selectedAlias && (
                      <span>Sending from: <strong>{selectedAlias}</strong></span>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* AI Tips Section */}
            {/* <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                <FiZap className="inline w-5 h-5 mr-2 text-blue-600" />
                AI Email Assistant Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Leave Requests:</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• "Write a 5 day sick leave for fever"</li>
                    <li>• "Request 3 days leave for family emergency"</li>
                    <li>• "Medical leave application for 1 week"</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Business Emails:</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• "Schedule a team meeting for project review"</li>
                    <li>• "Follow up on pending invoice payment"</li>
                    <li>• "Request quote for software development"</li>
                  </ul>
                </div>
              </div>
            </div> */}
          </div>
        </main>
      </div>
    </div>
  );
}