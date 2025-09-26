// src/app/dashboard/create-alias/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import CreateAliasForm from '@/components/CreateAliasForm';

export default function CreateAliasPage() {
  const [user, setUser] = useState(null);
  const [aliases, setAliases] = useState([]);
  const [verifiedDomains, setVerifiedDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [newAlias, setNewAlias] = useState('');
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('upgraded') === 'true') {
      setPolling(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      pollUserStatus();
    } else {
      fetchUserData();
    }
    fetchAliases();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user', { cache: 'no-store' });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        if (userData.plan === 'pro') {
          fetchVerifiedDomains();
          if (polling) {
            setSuccess('Successfully upgraded to Pro! You can now use custom domains and unlimited aliases.');
            setPolling(false);
          }
        }
      } else {
        router.push('/signin');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data.');
    } finally {
      if (!polling) setLoading(false);
    }
  };

  const pollUserStatus = async () => {
    const maxAttempts = 10;
    const interval = 2000; // 2 seconds
    let attempt = 0;

    while (attempt < maxAttempts) {
      await fetchUserData();
      if (user?.plan === 'pro') {
        setPolling(false);
        setLoading(false);
        break;
      }
      attempt++;
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    if (attempt >= maxAttempts) {
      setError('Failed to confirm Pro plan upgrade. Please try refreshing or contact support.');
      setPolling(false);
      setLoading(false);
    }
  };

  const fetchAliases = async () => {
    try {
      const response = await fetch('/api/aliases', { cache: 'no-store' });
      if (response.ok) {
        const aliasData = await response.json();
        setAliases(aliasData);
      }
    } catch (error) {
      console.error('Error fetching aliases:', error);
    }
  };

  const fetchVerifiedDomains = async () => {
    try {
      const response = await fetch('/api/domains', { cache: 'no-store' });
      if (response.ok) {
        const domainData = await response.json();
        const verified = domainData.filter(d => d.isVerified && d.mailgunStatus === 'active');
        setVerifiedDomains(verified);
      }
    } catch (error) {
      console.error('Error fetching verified domains:', error);
    }
  };

  const handleCreateAlias = async (e, domain) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/aliases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alias: newAlias.trim(),
          isCollaborative,
          domain: domain || process.env.NEXT_PUBLIC_MAILGUN_DOMAIN
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Alias created successfully!');
        setNewAlias('');
        setIsCollaborative(false);
        setSelectedDomain('');
        await fetchAliases();
        setTimeout(() => {
          router.push('/dashboard/aliases');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create alias');
      }
    } catch (error) {
      setError('Network error while creating alias');
    } finally {
      setSubmitting(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    try {
      setError('');
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Failed to load payment system. Please try again.');
        return;
      }

      const response = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const { order } = await response.json();
        
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: 'Email Alias Pro',
          description: 'Upgrade to Pro Plan',
          order_id: order.id,
          handler: function (response) {
            setPolling(true);
            setLoading(true);
            pollUserStatus();
            window.location.href = '/dashboard?upgraded=true';
          },
          prefill: {
            email: user?.email,
            name: user?.name
          },
          theme: {
            color: '#3B82F6'
          },
          modal: {
            ondismiss: function () {
              setError('Payment cancelled. You can try again anytime.');
            }
          }
        };
        
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setError(`Payment failed: ${response.error.description}`);
        });
        rzp.open();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create payment order');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      setError('Failed to initiate upgrade process');
    }
  };

  if (loading || polling) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{polling ? 'Verifying your Pro plan...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  const isPro = user?.plan === 'pro';
  const personalAliases = aliases.filter(a => !a.isCollaborative);
  const canCreateMore = isPro || personalAliases.length < 5;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar user={user} onUpgrade={handleUpgrade} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Create New Alias</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create a new email alias to receive emails at a custom address.
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {success}
            </div>
          )}

          <div className="max-w-2xl">
            <CreateAliasForm
              isPro={isPro}
              personalAliasesCount={personalAliases.length}
              canCreateMore={canCreateMore}
              newAlias={newAlias}
              isCollaborative={isCollaborative}
              submitting={submitting}
              verifiedDomains={verifiedDomains}
              selectedDomain={selectedDomain}
              setSelectedDomain={setSelectedDomain}
              handleCreateAlias={handleCreateAlias}
              setNewAlias={setNewAlias}
              setIsCollaborative={setIsCollaborative}
            />
          </div>
        </main>
      </div>
    </div>
  );
}