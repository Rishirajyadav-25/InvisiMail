// SendEmail.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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
    try {
      const action = mode === 'write' ? 'write' : 'enhance';
      const res = await fetch(`/api/ai/process?emailId=${emailId || 'placeholder'}&action=${action}&subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(formData.message)}&recipient=${encodeURIComponent(formData.to)}&prompt=${encodeURIComponent(prompt)}`, {
        method: 'GET',
      });
      const data = await res.json();
      if (res.ok) {
        if (action === 'write') {
          const [newSubject, ...rest] = data.writtenContent.split('\n\n');
          const newBody = rest.join('\n\n').trim();
          setFormData(prev => ({
            ...prev,
            subject: newSubject.replace('Subject: ', ''),
            message: newBody
          }));
        } else if (action === 'enhance') {
          const [newSubject, ...rest] = data.enhancedContent.split('\n\n');
          const newBody = rest.join('\n\n').trim();
          setFormData(prev => ({
            ...prev,
            subject: newSubject.replace('Subject: ', ''),
            message: newBody
          }));
        }
      } else {
        console.error('Failed to get AI suggestions:', data);
      }
    } catch (error) {
      console.error('Error in AI assistance:', error);
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

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Send Email</h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 p-3 mb-4 rounded">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 p-3 mb-4 rounded">{success}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Send From Alias
          </label>
          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To
          </label>
          <input
            type="email"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.to}
            onChange={(e) => setFormData({...formData, to: e.target.value})}
            placeholder="Recipient email"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <input
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.subject}
            onChange={(e) => setFormData({...formData, subject: e.target.value})}
            placeholder="Email subject"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            rows={12}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-y"
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            placeholder="Type your message here..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prompt (optional for auto-writing)
          </label>
          <input
            type="text"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Write a leave request email"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => handleAIAssist('placeholder', prompt ? 'write' : 'enhance')}
            className="bg-blue-200 hover:bg-blue-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
            disabled={!formData.to || !formData.subject || loading}
          >
            {prompt ? 'Auto-Write Email' : 'Improve Email'}
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
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                'Send Email'
              )}
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