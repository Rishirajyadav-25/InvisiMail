// src/app/dashboard/send/SendEmail.jsx
'use client';
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchReplyData = async (emailId) => {
      try {
        const response = await fetch(`/api/inbox/${emailId}`);
        if (response.ok) {
          const email = await response.json();
          setSelectedAlias(email.aliasEmail);
          setFormData({
            to: email.from,
            subject: email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`,
            message: `\n\n\n--- Original Message on ${new Date(email.date).toLocaleString()} ---\nFrom: ${email.from}\nSubject: ${email.subject}\n\n${email.bodyPlain}`
          });
        }
      } catch (error) {
        console.error('Error fetching reply data:', error);
        setError('Failed to load reply data.');
      }
    };
    
    fetchUser();
    fetchAliases();
    const aliasFromQuery = searchParams.get('alias');
    const replyToId = searchParams.get('reply');
    
    if (aliasFromQuery) {
      setSelectedAlias(aliasFromQuery);
    }
    
    if (replyToId) {
      setReplyId(replyToId);
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

  const handleAIAssist = async (mode = 'enhance') => {
    setAiLoading(true);
    setError('');
    
    try {
      // Validate inputs based on mode
      if (mode === 'write' && !prompt.trim()) {
        setError('Please enter what you want to write in the AI Assistant field.');
        setAiLoading(false);
        return;
      }
      
      if (mode === 'enhance' && !formData.message.trim() && !formData.subject.trim()) {
        setError('Please enter a subject or message to improve.');
        setAiLoading(false);
        return;
      }

      // Build request body for POST
      const requestBody = {
        action: mode,
        subject: formData.subject || '',
        body: formData.message || '',
        recipient: formData.to || '',
        prompt: prompt || ''
      };

      if (replyId) {
        requestBody.emailId = replyId;
      }

      console.log('Sending AI request:', requestBody);
      
      const res = await fetch('/api/ai/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', res.status);

      // Check if response is OK
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${res.status} ${res.statusText}`);
      }

      // Parse JSON response
      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        console.error('JSON Parse Error:', jsonError);
        throw new Error('Invalid response from server. Please try again.');
      }

      console.log('AI Response:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Extract content based on action
      let content = '';
      if (mode === 'write') {
        content = data.writtenContent || data.content || '';
      } else if (mode === 'enhance') {
        content = data.enhancedContent || data.content || '';
      }

      if (!content) {
        throw new Error('No content received from AI. Please try again.');
      }

      // Parse the content for Subject and Body
      const subjectMatch = content.match(/Subject:\s*(.+?)(?:\n|$)/i);
      let newSubject = '';
      let newBody = content;

      if (subjectMatch) {
        newSubject = subjectMatch[1].trim();
        // Remove the subject line from body
        newBody = content.replace(/Subject:\s*.+?(?:\n|$)/i, '').trim();
      }

      // Update form data
      if (mode === 'write') {
        // For write mode, replace everything
        setFormData({
          to: formData.to,
          subject: newSubject || 'Email Subject',
          message: newBody || content
        });
        setPrompt(''); // Clear the prompt after writing
        setSuccess('✨ Email generated successfully!');
      } else {
        // For enhance mode, improve existing content
        setFormData(prev => ({
          ...prev,
          subject: newSubject || prev.subject,
          message: newBody || content
        }));
        setSuccess('✨ Email improved successfully!');
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
        
    } catch (error) {
      console.error('Error in AI assistance:', error);
      setError(error.message || 'Failed to process AI request. Please try again.');
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6 mb-6">
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

            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-md flex justify-between items-center">
                <span>{error}</span>
                <button 
                  onClick={() => setError('')} 
                  className="p-1 text-red-500 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            )}
            {success && (
              <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-md flex justify-between items-center">
                <span>{success}</span>
                <button 
                  onClick={() => setSuccess('')} 
                  className="p-1 text-green-500 dark:text-green-400 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Assistant Chat */}
            <AssistantChatPhase2 />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Email Details</h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FiMail className="inline w-4 h-4 mr-2" />
                    Send From Alias
                  </label>
                  <select
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:placeholder-gray-400"
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
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      No aliases available. Create an alias first.
                    </p>
                  )}
                </div>

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={12}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y transition-colors text-gray-900 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:placeholder-gray-400"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Type your message here or use AI to generate it..."
                    required
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.message.length} characters
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 rounded-lg p-4">
                  <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                    <FiZap className="inline w-4 h-4 mr-2" />
                    AI Assistant (Optional)
                  </label>
                  <input
                    type="text"
                    className="block w-full px-4 py-3 border border-blue-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:placeholder-gray-400"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Write a 5 day leave request for fever..."
                  />
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    💡 <strong>Generate Email:</strong> Enter what you want to write above, then click "Generate Email"
                    <br />
                    💡 <strong>Improve Email:</strong> Fill in subject/message, then click "Improve Email" to enhance it
                  </p>
                </div>

                <div className="flex items-center gap-3 py-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => handleAIAssist('write')}
                    disabled={aiLoading || loading || !prompt.trim()}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
                    title={!prompt.trim() ? 'Enter a prompt to generate email' : 'Generate email from prompt'}
                  >
                    {aiLoading ? (
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiZap className="w-4 h-4" />
                    )}
                    {aiLoading ? 'Generating...' : 'Generate Email'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAIAssist('enhance')}
                    disabled={aiLoading || loading || (!formData.subject.trim() && !formData.message.trim())}
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors dark:bg-purple-500 dark:hover:bg-purple-600"
                    title={(!formData.subject.trim() && !formData.message.trim()) ? 'Enter subject or message to improve' : 'Improve existing email'}
                  >
                    {aiLoading ? (
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiZap className="w-4 h-4" />
                    )}
                    {aiLoading ? 'Improving...' : 'Improve Email'}
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
                    className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                  >
                    Clear All
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-gray-200 dark:border-gray-700 gap-4">
                  <button
                    type="submit"
                    disabled={loading || !selectedAlias || aiLoading}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 px-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-gray-800"
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
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-left sm:text-right">
                    {selectedAlias && (
                      <span>Sending from: <strong className="text-gray-700 dark:text-gray-200">{selectedAlias}</strong></span>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}