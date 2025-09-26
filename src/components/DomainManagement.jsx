// src/components/DomainManagement.jsx
'use client';

import { useState, useEffect } from 'react';
import {
  FiPlus,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiClock,
  FiRefreshCw,
  FiTrash2,
  FiCopy,
  FiExternalLink,
  FiInfo
} from 'react-icons/fi';

export default function DomainManagement({ user, onDomainsUpdate }) {
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedRecord, setCopiedRecord] = useState('');

  useEffect(() => {
    if (user?.plan === 'pro') {
      fetchDomains();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Automatically refresh domains every 30 seconds
  useEffect(() => {
    if (user?.plan === 'pro') {
      const interval = setInterval(() => {
        fetchDomains();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [user]);


  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/domains');
      if (response.ok) {
        const data = await response.json();
        setDomains(data);
        if (onDomainsUpdate) {
          onDomainsUpdate(data);
        }
      } else {
        setError('Failed to fetch domains');
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Domain ${newDomain} added successfully! Please verify ownership.`);
        setNewDomain('');
        setShowAddForm(false);
        fetchDomains();
      } else {
        setError(data.error || 'Failed to add domain');
      }
    } catch (error) {
      console.error('Error adding domain:', error);
      setError('Network error while adding domain');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckMailgunStatus = async (domainId) => {
    setVerifying(prev => ({ ...prev, [`${domainId}_mailgun`]: true }));

    try {
      const response = await fetch('/api/domains', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId, action: 'check_mailgun_status' })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        fetchDomains();
      } else {
        setError(data.error || 'Failed to check Mailgun status');
      }
    } catch (error) {
      console.error('Error checking Mailgun status:', error);
      setError('Network error');
    } finally {
      setVerifying(prev => ({ ...prev, [`${domainId}_mailgun`]: false }));
    }
  };

  const handleDeleteDomain = async (domainId, domainName) => {
    if (!confirm(`Are you sure you want to delete domain ${domainName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/domains?id=${domainId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Domain ${domainName} deleted successfully`);
        fetchDomains();
      } else {
        setError(data.error || 'Failed to delete domain');
      }
    } catch (error) {
      console.error('Error deleting domain:', error);
      setError('Network error while deleting domain');
    }
  };

  const copyToClipboard = async (text, recordType) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRecord(recordType);
      setTimeout(() => setCopiedRecord(''), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getStatusIcon = (domain) => {
    if (domain.isVerified && domain.mailgunStatus === 'active') {
      return <FiCheck className="w-5 h-5 text-green-600" />;
    } else if (domain.isVerified && domain.mailgunStatus === 'added') {
      return <FiClock className="w-5 h-5 text-yellow-600" />;
    } else if (domain.isVerified) {
      return <FiAlertTriangle className="w-5 h-5 text-orange-600" />;
    } else {
      return <FiX className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusText = (domain) => {
    if (domain.isVerified && domain.mailgunStatus === 'active') {
      return 'Active';
    } else if (domain.isVerified && domain.mailgunStatus === 'added') {
      return 'Pending DNS Setup';
    } else if (domain.isVerified) {
      return 'Verified';
    } else {
      return 'Verifying Automatically...';
    }
  };

  const getStatusColor = (domain) => {
    if (domain.isVerified && domain.mailgunStatus === 'active') {
      return 'bg-green-100 text-green-800';
    } else if (domain.isVerified && domain.mailgunStatus === 'added') {
      return 'bg-yellow-100 text-yellow-800';
    } else if (domain.isVerified) {
      return 'bg-orange-100 text-orange-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (user?.plan !== 'pro') {
    return (
      <div className="bg-white rounded-xl shadow-md border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Custom Domains</h3>
          <p className="mt-1 text-sm text-gray-600">
            Use your own domain for email aliases
          </p>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <FiInfo className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Pro Feature</h4>
            <p className="text-gray-600 mb-4">
              Custom domains are available for Pro users. Upgrade to use your own domain for email aliases.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Custom Domains</h3>
            <p className="mt-1 text-sm text-gray-600">
              Manage your custom domains for creating email aliases
            </p>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Add Domain
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
            {success}
          </div>
        )}

        {/* Add Domain Form */}
        {showAddForm && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-md font-medium text-gray-900 mb-3">Add New Domain</h4>
            <form onSubmit={handleAddDomain} className="flex gap-3">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting || !newDomain.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewDomain('');
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Domains List */}
        {domains.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🌐</div>
            <p className="text-gray-500">No custom domains added yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your first domain to start using custom email aliases</p>
          </div>
        ) : (
          <div className="space-y-4">
            {domains.map((domain) => (
              <div key={domain._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(domain)}
                    <div>
                      <h4 className="font-medium text-gray-900">{domain.domain}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(domain)}`}>
                          {getStatusText(domain)}
                        </span>
                        {domain.createdAt && (
                          <span className="text-xs text-gray-500">
                            Added {new Date(domain.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!domain.isVerified && (
                      <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-md text-sm">
                        <FiClock className="w-4 h-4" />
                        Verifying Automatically...
                      </span>
                    )}
                    {domain.isVerified && domain.mailgunStatus !== 'active' && (
                      <button
                        onClick={() => handleCheckMailgunStatus(domain._id)}
                        disabled={verifying[`${domain._id}_mailgun`]}
                        className="inline-flex items-center gap-2 bg-orange-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-orange-700 disabled:opacity-50 transition-colors"
                      >
                        {verifying[`${domain._id}_mailgun`] ? (
                          <>
                            <FiRefreshCw className="w-4 h-4 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <FiRefreshCw className="w-4 h-4" />
                            Check Status
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteDomain(domain._id, domain.domain)}
                      className="inline-flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-700 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* DNS Instructions */}
                {!domain.isVerified && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-3">
                    <h5 className="text-sm font-medium text-yellow-800 mb-2">
                      Domain Verification Required
                    </h5>
                    <p className="text-sm text-yellow-700 mb-3">
                      Please add the following TXT record to your DNS settings to verify ownership:
                    </p>
                    <div className="bg-white border border-yellow-300 rounded p-3 font-mono text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Type:</span>
                        <span>TXT</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Name:</span>
                        <div className="flex items-center gap-2">
                          <span className="break-all">_mailalias-verification.{domain.domain}</span>
                          <button
                            onClick={() => copyToClipboard(`_mailalias-verification.${domain.domain}`, `${domain._id}_name`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {copiedRecord === `${domain._id}_name` ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Value:</span>
                        <div className="flex items-center gap-2">
                          <span className="break-all">{domain.verificationToken}</span>
                          <button
                            onClick={() => copyToClipboard(domain.verificationToken, `${domain._id}_value`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {copiedRecord === `${domain._id}_value` ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-yellow-600 mt-2">
                      DNS changes may take up to 24 hours to propagate. We are checking for the record automatically.
                    </p>
                  </div>
                )}

                {/* Mailgun DNS Setup Instructions */}
                {domain.isVerified && domain.mailgunStatus !== 'active' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-blue-800">
                        Complete DNS Setup for Email Delivery
                      </h5>
                      <a
                        href={`https://app.mailgun.com/app/domains/${domain.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <FiExternalLink className="w-4 h-4" />
                        Mailgun Dashboard
                      </a>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      Your domain is verified but requires additional DNS records for email delivery:
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        {domain.mxVerified ? (
                          <FiCheck className="w-4 h-4 text-green-600" />
                        ) : (
                          <FiX className="w-4 h-4 text-red-600" />
                        )}
                        <span className={domain.mxVerified ? 'text-green-700' : 'text-red-700'}>
                          MX Records {domain.mxVerified ? 'Configured' : 'Required'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {domain.dkimVerified ? (
                          <FiCheck className="w-4 h-4 text-green-600" />
                        ) : (
                          <FiX className="w-4 h-4 text-red-600" />
                        )}
                        <span className={domain.dkimVerified ? 'text-green-700' : 'text-red-700'}>
                          DKIM Authentication {domain.dkimVerified ? 'Configured' : 'Required'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {domain.spfVerified ? (
                          <FiCheck className="w-4 h-4 text-green-600" />
                        ) : (
                          <FiX className="w-4 h-4 text-red-600" />
                        )}
                        <span className={domain.spfVerified ? 'text-green-700' : 'text-red-700'}>
                          SPF Record {domain.spfVerified ? 'Configured' : 'Required'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Visit the Mailgun dashboard for exact DNS record values and setup instructions.
                    </p>
                  </div>
                )}

                {/* Success State */}
                {domain.isVerified && domain.mailgunStatus === 'active' && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FiCheck className="w-5 h-5 text-green-600" />
                      <h5 className="text-sm font-medium text-green-800">
                        Domain Active and Ready
                      </h5>
                    </div>
                    <p className="text-sm text-green-700">
                      Your domain is fully configured and ready for creating email aliases.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}