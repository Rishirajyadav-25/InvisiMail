// src/app/dashboard/page.jsx - WITH FALLBACK VERIFICATION
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiMail, FiInbox, FiSend } from 'react-icons/fi';
import Sidebar from '@/components/Sidebar';
import StatsCard from '@/components/StatsCard';
import RecentActivity from '@/components/RecentActivity';
import ChartCard from '@/components/ChartCard';
import AssistantChat from "../../components/AssistantChat";
import AssistantChatPhase2 from '@/components/AssistantChatPhase2';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [aliases, setAliases] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inboxStats, setInboxStats] = useState({ unreadCount: 0, totalEmails: 0, spamCount: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [useWebhook, setUseWebhook] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('upgraded') === 'true') {
      setSuccess('Payment successful! Verifying your Pro plan upgrade...');
      setRefreshing(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Try webhook-based polling first
      pollForPlanUpdate();
      
      // After 15 seconds, try direct API verification as fallback
      setTimeout(() => {
        if (user?.plan !== 'pro') {
          console.log('[Fallback] Switching to direct API verification');
          verifyPaymentDirectly();
        }
      }, 15000);
    } else {
      fetchUserData();
    }
    fetchAliases();
    fetchInboxStats();
    fetchActivities();
  }, []);

  // Direct API verification (fallback method)
  const verifyPaymentDirectly = async () => {
    try {
      console.log('[Fallback] Attempting direct payment verification');
      setSuccess('Using alternative verification method...');
      
      const response = await fetch('/api/upgrade/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.user?.plan === 'pro') {
          console.log('[Fallback] ✅ Successfully verified via API');
          setUser(data.user);
          setSuccess('🎉 Successfully upgraded to Pro! Welcome to the Pro plan.');
          setRefreshing(false);
          setUseWebhook(false);
          fetchAliases();
          fetchInboxStats();
          return true;
        } else {
          console.log('[Fallback] Payment not yet captured:', data.message);
          
          // Try again after 5 seconds, up to 3 times
          if (pollingAttempts < 20) {
            setTimeout(verifyPaymentDirectly, 5000);
          } else {
            setError('Unable to verify payment. Please contact support with your order details.');
            setRefreshing(false);
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('[Fallback] Error:', error);
      return false;
    }
  };

  // Webhook-based polling (primary method)
  const pollForPlanUpdate = async (maxAttempts = 10, attemptCount = 0) => {
    if (!useWebhook) return; // Stop if fallback is active
    
    setPollingAttempts(attemptCount + 1);
    
    try {
      console.log(`[Polling] Attempt ${attemptCount + 1}/${maxAttempts}`);
      
      const timestamp = Date.now();
      const response = await fetch(`/api/user?t=${timestamp}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log(`[Polling] User data:`, { plan: userData.plan, email: userData.email });
        
        setUser(userData);
        
        if (userData.plan === 'pro') {
          setSuccess('🎉 Successfully upgraded to Pro!');
          setRefreshing(false);
          fetchAliases();
          fetchInboxStats();
          console.log('[Polling] ✅ Success');
          return;
        }
      }
      
      if (attemptCount < maxAttempts) {
        setTimeout(() => {
          pollForPlanUpdate(maxAttempts, attemptCount + 1);
        }, 3000);
      } else {
        console.log('[Polling] Max attempts reached, switching to fallback');
        // Don't stop refreshing yet, let fallback take over
      }
      
    } catch (error) {
      console.error('[Polling] Error:', error);
      
      if (attemptCount < maxAttempts) {
        setTimeout(() => {
          pollForPlanUpdate(maxAttempts, attemptCount + 1);
        }, 3000);
      }
    }
  };

  const fetchUserData = async () => {
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/user?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('[Fetch] User data:', { plan: userData.plan });
        setUser(userData);
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

  const fetchInboxStats = async () => {
    try {
      const response = await fetch('/api/inbox/stats');
      if (response.ok) {
        const stats = await response.json();
        setInboxStats(stats);
      }
    } catch (error) {
      console.error('Error fetching inbox stats:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activities');
      if (response.ok) {
        const activityData = await response.json();
        setActivities(activityData);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const totalSent = activities.filter(a => a.type === 'sent').length;

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
        const { order, user: userInfo } = await response.json();
        
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: 'Email Alias Pro',
          description: 'Upgrade to Pro Plan',
          order_id: order.id,
          handler: function (response) {
            console.log('Payment successful:', response);
            window.location.href = '/dashboard?upgraded=true';
          },
          prefill: {
            email: userInfo?.email || user?.email,
            name: userInfo?.name || user?.name
          },
          theme: { color: '#3B82F6' },
          modal: {
            ondismiss: function () {
              setError('Payment cancelled.');
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

  const handleManualRefresh = () => {
    setError('');
    setSuccess('Checking your payment status...');
    verifyPaymentDirectly();
  };

  if (loading || refreshing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            {refreshing ? 'Verifying your Pro plan upgrade...' : 'Loading...'}
          </p>
          {refreshing && (
            <>
              <p className="text-sm text-gray-500 mt-2">
                {useWebhook ? 'Checking with payment gateway...' : 'Using direct verification...'}
              </p>
              <button
                onClick={handleManualRefresh}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Verify Now
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const isPro = user?.plan === 'pro';

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar user={user} onUpgrade={handleUpgrade} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleManualRefresh}
                  className="text-red-600 hover:text-red-800 text-sm font-medium underline"
                >
                  Verify Payment
                </button>
                <button 
                  onClick={() => setError('')} 
                  className="text-red-500 hover:text-red-700 text-lg font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium">Success</p>
                <p className="text-sm mt-1">{success}</p>
              </div>
              <button 
                onClick={() => setSuccess('')} 
                className="text-green-500 hover:text-green-700 text-lg font-bold"
              >
                ×
              </button>
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user?.name || 'User'}!
                </h2>
                <p className="text-gray-600 mt-1">
                  Manage your email aliases and stay organized.
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${ 
                isPro 
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                  : 'bg-gray-100 text-gray-800 border border-gray-200'
              }`}>
                {isPro ? 'Pro User' : 'Free Plan'}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard 
              title="Total Aliases" 
              stat={aliases.length} 
              icon={<FiMail />} 
              theme="blue" 
              subtitle={isPro ? "Unlimited" : `${aliases.filter(a => !a.isCollaborative).length}/5 personal`}
            />
            <StatsCard 
              title="Unread Emails" 
              stat={inboxStats.unreadCount} 
              icon={<FiInbox />} 
              theme="green" 
              actionLink="/dashboard/inbox"
              actionText="View Inbox"
            />
            <StatsCard 
              title="Emails Sent" 
              stat={totalSent} 
              icon={<FiSend />} 
              theme="rose" 
              actionLink="/dashboard/send"
              actionText="Compose"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard 
              title="Email Traffic Trends" 
              type="traffic" 
              data={[10, 18, 14, 22, 16, 24, 20]} 
            />
            <ChartCard 
              title="Spam vs. Legitimate Emails" 
              type="spamRatio" 
              inboxStats={inboxStats} 
            />
          </div>
          
          <RecentActivity activities={activities} aliases={aliases} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AssistantChat />
            <AssistantChatPhase2 />
          </div>
        </main>
      </div>
    </div>
  );
}