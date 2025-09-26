// src/app/dashboard/domains/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import DomainManagement from '@/components/DomainManagement';

export default function DomainsPage() {
  const [user, setUser] = useState(null);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        if (userData.plan !== 'pro') {
          setError('Custom domains are a Pro feature. Please upgrade to access.');
          setTimeout(() => router.push('/dashboard'), 3000); // Redirect after showing message
        } else {
          fetchDomains(); // Fetch domains only if Pro
        }
      } else {
        router.push('/signin');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/domains');
      if (response.ok) {
        const domainData = await response.json();
        setDomains(domainData);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
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
          description: 'Upgrade to Pro Plan - Unlimited aliases & collaboration',
          order_id: order.id,
          handler: function (response) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const isPro = user?.plan === 'pro';

  if (!isPro) {
    return (
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        <Sidebar user={user} onUpgrade={handleUpgrade} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar user={user} onUpgrade={handleUpgrade} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Manage Custom Domains</h1>
            <p className="text-sm text-gray-600 mt-1">
              Add and verify your custom domains for personalized email aliases.
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
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

          <div className="max-w-4xl">
            <DomainManagement 
              user={user} 
              onDomainsUpdate={(updatedDomains) => setDomains(updatedDomains)} 
            />
          </div>
        </main>
      </div>
    </div>
  );
}