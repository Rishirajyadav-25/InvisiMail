// src/app/dashboard/page.jsx - ENHANCED WITH THEME TOGGLE AND FOOTER
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiMail,
  FiInbox,
  FiSend,
  FiActivity,
  FiBarChart2,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiX,
  FiUser,
  FiZap,
  FiSun,
  FiMoon
} from 'react-icons/fi';
import Sidebar from '@/components/Sidebar';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

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
  const [theme, setTheme] = useState('dark');
  const router = useRouter();

  // --- Effect for initializing theme ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('upgraded') === 'true') {
      setSuccess('Payment successful! Verifying your Pro plan upgrade...');
      setRefreshing(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      
      pollForPlanUpdate();
      
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
  }, [user?.plan]);

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
          
          if (pollingAttempts < 20) {
            setPollingAttempts(prev => prev + 1);
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

  const pollForPlanUpdate = async (maxAttempts = 10, attemptCount = 0) => {
    if (!useWebhook) return;
    
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
  
  // --- Theme Toggle Handler ---
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (loading || refreshing) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-[#0F172A] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin-glow"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin-glow" style={{animationDuration: '1s'}}></div>
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            {refreshing ? 'Verifying Your Upgrade' : 'Loading Dashboard'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {refreshing ? 'This just takes a moment...' : 'Preparing your secure workspace.'}
          </p>

          {refreshing && (
            <div className="animate-fade-in-up" style={{animationDelay: '0.5s'}}>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                {useWebhook ? 'Checking with payment gateway...' : 'Using direct verification...'}
              </p>
              <button
                onClick={handleManualRefresh}
                className="btn-glass primary"
              >
                <FiZap className="inline -mt-1 mr-2" />
                Verify Manually
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isPro = user?.plan === 'pro';

  // --- Dynamic styles for charts ---
  const axisStrokeColor = theme === 'dark' ? '#6B7280' : '#9CA3AF';
  const tooltipContentStyle = (theme, borderColor = '#3B82F6') => ({
    backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    borderColor: theme === 'dark' ? borderColor : '#E5E7EB',
    borderRadius: '8px',
    backdropFilter: 'blur(10px)',
  });
  const tooltipItemStyle = (theme) => ({
    color: theme === 'dark' ? '#E5E7EB' : '#1F2937',
  });
  const tooltipLabelStyle = (theme) => ({
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  });
  
  const trafficData = [
    { name: 'Mon', emails: 10 },
    { name: 'Tue', emails: 18 },
    { name: 'Wed', emails: 14 },
    { name: 'Thu', emails: 22 },
    { name: 'Fri', emails: 16 },
    { name: 'Sat', emails: 24 },
    { name: 'Sun', emails: 20 },
  ];

  const spamData = [
    { name: 'Legitimate', value: Math.max(0, (inboxStats.totalEmails || 0) - (inboxStats.spamCount || 0)) },
    { name: 'Spam', value: inboxStats.spamCount || 0 },
  ];
  
  const hasEmailData = spamData.some(item => item.value > 0);
  const displaySpamData = hasEmailData ? spamData : [{ name: 'No Data', value: 1 }];
  const spamColors = ['#3B82F6', '#EF4444'];
  
  const getActivityIcon = (type) => {
    switch (type) {
      case 'sent': return <FiSend className="text-blue-400" />;
      case 'received': return <FiInbox className="text-green-400" />;
      case 'blocked': return <FiShield className="text-red-400" />;
      default: return <FiActivity className="text-gray-400" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-[#0F172A] text-gray-800 dark:text-gray-300">
      <Sidebar user={user} onUpgrade={handleUpgrade} theme={theme} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 main-content-scroll scroll-smooth">
          
          {/* Toast Notifications */}
          <div className="fixed top-6 right-6 z-50 w-full max-w-sm space-y-3">
            {error && (
              <div className="glass-panel p-4 flex items-start gap-3 border-red-500/50 shadow-lg shadow-red-500/10 animate-toast-in" style={{animationFillMode: 'forwards'}}>
                <FiAlertTriangle className="text-red-400 text-2xl flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">Error</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{error}</p>
                  {error.includes('Unable to verify') && (
                    <button
                      onClick={handleManualRefresh}
                      className="text-xs font-medium text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-white mt-2"
                    >
                      Click to Verify Manually
                    </button>
                  )}
                </div>
                <button onClick={() => setError('')} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                  <FiX />
                </button>
              </div>
            )}
            {success && (
              <div className="glass-panel p-4 flex items-start gap-3 border-green-500/50 shadow-lg shadow-green-500/10 animate-toast-in" style={{animationFillMode: 'forwards'}}>
                <FiCheckCircle className="text-green-400 text-2xl flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">Success</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{success}</p>
                </div>
                <button onClick={() => setSuccess('')} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                  <FiX />
                </button>
              </div>
            )}
          </div>
          
          {/* Header */}
          <div className="glass-panel p-6 md:p-8 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome back, <span className="animated-gradient-text">{user?.name || 'User'}</span>!
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Here's your secure dashboard overview.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                  title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                  {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
                </button>

                <div 
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2
                    transition-all duration-300
                    ${isPro 
                      ? 'bg-blue-500/20 text-blue-500 dark:text-blue-300 border-blue-500/30 shadow-electric-glow' 
                      : 'bg-gray-200 text-gray-600 border-gray-300 dark:bg-gray-700/30 dark:text-gray-400 dark:border-gray-600/50'
                    }
                  `}
                >
                  {isPro ? <FiZap className={isPro ? "text-blue-500 dark:text-blue-300" : "text-gray-600 dark:text-gray-400"} /> : <FiUser className={isPro ? "text-blue-500 dark:text-blue-300" : "text-gray-600 dark:text-gray-400"} />}
                  {isPro ? 'Pro Plan' : 'Free Plan'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div 
              className="glass-panel p-6 group transition-all duration-300 ease-out hover:scale-[1.03] dark:hover:shadow-electric-glow animate-fade-in-up" 
              style={{animationDelay: '0.1s'}}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-base font-medium text-gray-600 dark:text-gray-400">Total Aliases</h3>
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <FiMail className="w-5 h-5" />
                </div>
              </div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-4">{aliases.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {isPro ? "Unlimited Aliases" : `${aliases.filter(a => !a.isCollaborative).length} / 5 personal`}
              </p>
            </div>
            
            <div 
              className="glass-panel p-6 group transition-all duration-300 ease-out hover:scale-[1.03] dark:hover:shadow-electric-glow animate-fade-in-up" 
              style={{animationDelay: '0.2s'}}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-base font-medium text-gray-600 dark:text-gray-400">Unread Emails</h3>
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <FiInbox className="w-5 h-5" />
                </div>
              </div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-4">{inboxStats.unreadCount}</p>
              <a href="/dashboard/inbox" className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors mt-1 group-hover:underline">
                View Inbox →
              </a>
            </div>

            <div 
              className="glass-panel p-6 group transition-all duration-300 ease-out hover:scale-[1.03] dark:hover:shadow-electric-glow animate-fade-in-up" 
              style={{animationDelay: '0.3s'}}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-base font-medium text-gray-600 dark:text-gray-400">Emails Sent</h3>
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <FiSend className="w-5 h-5" />
                </div>
              </div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-4">{totalSent}</p>
              <a href="/dashboard/send" className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors mt-1 group-hover:underline">
                Compose New →
              </a>
            </div>
          </div>
          
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="glass-panel p-6 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Email Traffic Trends</h3>
              <div className="h-72">
                {trafficData && trafficData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trafficData} margin={{ top: 5, right: 10, left: -30, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke={axisStrokeColor} fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke={axisStrokeColor} fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={tooltipContentStyle(theme)} 
                        itemStyle={tooltipItemStyle(theme)}
                        labelStyle={tooltipLabelStyle(theme)}
                      />
                      <Area type="monotone" dataKey="emails" stroke="#3B82F6" strokeWidth={2} fill="url(#colorTraffic)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 dark:text-gray-500">No traffic data available</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="glass-panel p-6 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Spam vs. Legitimate</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={displaySpamData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {displaySpamData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={hasEmailData ? spamColors[index % spamColors.length] : axisStrokeColor} stroke={hasEmailData ? spamColors[index % spamColors.length] : axisStrokeColor} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={tooltipContentStyle(theme, (theme === 'dark' ? '#9CA3AF' : '#D1D5DB'))}
                      itemStyle={tooltipItemStyle(theme)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="glass-panel p-6 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-6 max-h-96 overflow-y-auto main-content-scroll pr-2">
              
              {aliases && aliases.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FiMail className="w-4 h-4 text-green-400" />
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">Recently Created Aliases</h4>
                  </div>
                  <div className="space-y-2">
                    {aliases
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 3)
                      .map((alias) => (
                        <div key={alias._id} className="flex items-center justify-between p-3 bg-gray-200/60 dark:bg-gray-700/30 rounded-lg hover:bg-gray-300/60 dark:hover:bg-gray-600/30 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              alias.isCollaborative ? 'bg-purple-500/20' : 'bg-blue-500/20'
                            }`}>
                              <span className={`text-sm font-medium ${
                                alias.isCollaborative ? 'text-purple-500 dark:text-purple-400' : 'text-blue-500 dark:text-blue-400'
                              }`}>
                                {alias.aliasEmail.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {alias.aliasEmail}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {new Date(alias.createdAt).toLocaleDateString()}
                                </p>
                                {alias.isCollaborative && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 dark:text-purple-300">
                                    Team
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <a 
                              href={`/dashboard/inbox?alias=${alias.aliasEmail}`}
                              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-300/50 dark:hover:bg-gray-600 rounded-md transition-colors"
                              title="View Inbox"
                            >
                              <FiInbox className="w-4 h-4" />
                            </a>
                            <a 
                              href={`/dashboard/send?alias=${alias.aliasEmail}`}
                              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-md transition-colors"
                              title="Send Email"
                            >
                              <FiSend className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">Email Activities</h4>
                {activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.slice(0, 5).map((activity, index) => {
                      const activityText = activity.description || 
                        (activity.type === 'sent' ? `Email sent to ${activity.data?.to || 'recipient'}` :
                         activity.type === 'received' ? `Email received from ${activity.data?.from || 'sender'}` :
                         activity.type === 'blocked' ? `Email blocked from ${activity.data?.from || 'sender'}` :
                         'Activity logged');
                      
                      const activityTime = activity.timestamp || activity.createdAt;
                      const aliasEmail = activity.aliasId ? 
                        aliases.find(a => a._id === activity.aliasId || a.id === activity.aliasId)?.aliasEmail || 'Unknown' :
                        activity.data?.aliasEmail || '';

                      return (
                        <div key={activity._id || activity.id || index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <div className="p-3 bg-gray-200/60 dark:bg-gray-700/50 rounded-full border border-gray-300/50 dark:border-gray-600/30">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{activityText}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {activityTime ? new Date(activityTime).toLocaleString() : 'Recent'}
                              {aliasEmail && ` | Alias: ${aliasEmail}`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-500 text-center py-4">No recent email activities.</p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <a 
                    href="/dashboard/aliases" 
                    className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium transition-colors"
                  >
                    View all aliases →
                  </a>
                  <a 
                    href="/dashboard/inbox" 
                    className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium transition-colors"
                  >
                    Go to inbox →
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* --- NEW: Footer --- */}
          <footer 
            className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 animate-fade-in-up" 
            style={{animationDelay: '0.7s'}}
          >
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p>&copy; {new Date().getFullYear()} Email Alias. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <a href="/privacy" className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors">Privacy Policy</a>
                <a href="/terms" className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors">Terms of Service</a>
              </div>
            </div>
          </footer>
          {/* --- End of Footer --- */}

        </main>
      </div>

      {/* --- GLOBAL STYLES --- */}
      <style jsx global>{`
        /* --- Default Light Theme --- */
        body {
          background-color: #F3F4F6; /* bg-gray-100 */
          color: #1F2937; /* text-gray-800 */
          overscroll-behavior: none;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        /* --- Dark Theme Overrides --- */
        .dark body {
          background-color: #0F172A;
          color: #d1d5db; /* text-gray-300 */
        }

        /* Animated Gradient Background (Dark Mode Only) */
        .dark body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -50;
          background: linear-gradient(
            -45deg,
            #0f172a,
            #0f172a,
            #132447, /* Dark blue */
            #1e1b4b  /* Dark violet */
          );
          background-size: 400% 400%;
          animation: gradient-pan 20s ease infinite;
          opacity: 0.8;
        }

        /* --- KEYFRAME ANIMATIONS (Unchanged) --- */
        
        @keyframes gradient-pan {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes gradient-text {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        @keyframes toast-in {
          0% { opacity: 0; transform: translateX(100%); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .animate-toast-in {
           animation: toast-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 4s infinite ease-in-out;
        }
        @keyframes spin-glow {
          0% {
            transform: rotate(0deg);
            box-shadow: 0 0 10px #3B82F6, 0 0 20px #3B82F6;
          }
          50% {
            box-shadow: 0 0 20px #06B6D4, 0 0 40px #06B6D4;
          }
          100% {
            transform: rotate(360deg);
            box-shadow: 0 0 10px #3B82F6, 0 0 20px #3B82F6;
          }
        }
        .animate-spin-glow {
          animation: spin-glow 1.5s linear infinite;
        }


        /* --- CUSTOM COMPONENT CLASSES (Now Theme-Aware) --- */

        /* The core glassmorphism panel style */
        .glass-panel {
          /* Light Mode */
          background-color: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 1rem;
          box-shadow: 
            0 8px 32px 0 rgba(0, 0, 0, 0.1),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.6);
          transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .dark .glass-panel {
          /* Dark Mode */
          background-color: rgba(28, 37, 58, 0.6); /* bg-glass-bg */
          border: 1px solid rgba(255, 255, 255, 0.1); /* border-glass-stroke */
          box-shadow: 
            0 8px 32px 0 rgba(0, 0, 0, 0.37), /* shadow-lg */
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.05); /* shadow-inner-light */
        }

        /* Animated gradient text (Unchanged, gradient looks good on light/dark) */
        .animated-gradient-text {
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          background-image: linear-gradient(
            90deg,
            #a5b4fc, /* Indigo-200 */
            #3b82f6, /* Blue-500 */
            #06b6d4, /* Cyan-500 */
            #a5b4fc
          );
          background-size: 200% auto;
          animation: gradient-text 4s linear infinite;
        }
        
        /* Custom styled scrollbar */
        .main-content-scroll::-webkit-scrollbar {
          width: 0.5rem; /* w-2 */
        }
        .main-content-scroll::-webkit-scrollbar-track {
          background-color: rgba(15, 23, 42, 0.0); /* transparent dark */
        }
        .dark .main-content-scroll::-webkit-scrollbar-track {
          background-color: rgba(15, 23, 42, 0.5); /* bg-base-dark/50 */
        }
        .main-content-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(59, 130, 246, 0.5); /* bg-electric-blue/50 */
          border-radius: 9999px; /* rounded-full */
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .main-content-scroll::-webkit-scrollbar-thumb:hover {
          background-color: rgba(59, 130, 246, 0.8); /* bg-electric-blue/80 */
        }

        /* Glass button style */
        .btn-glass {
          /* Light Mode */
          padding: 0.5rem 1.25rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #1F2937; /* text-gray-800 */
          background-color: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.7);
          transition: all 0.3s;
        }
        .dark .btn-glass {
          /* Dark Mode */
          color: white;
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.05);
        }
        
        .btn-glass:hover {
          background-color: rgba(255, 255, 255, 0.7);
          border-color: rgba(0, 0, 0, 0.15);
          transform: scale(1.03);
        }
        .dark .btn-glass:hover {
          background-color: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        .btn-glass.primary {
           /* Light Mode Primary */
           background-color: rgba(59, 130, 246, 0.2);
           border-color: rgba(59, 130, 246, 0.4);
           color: #1e40af; /* text-blue-800 */
        }
        .dark .btn-glass.primary {
           /* Dark Mode Primary */
           background-color: rgba(59, 130, 246, 0.3); /* bg-blue-500/30 */
           border-color: rgba(59, 130, 246, 0.5); /* border-blue-500/50 */
           color: #bfdbfe; /* text-blue-200 */
        }
        
        .btn-glass.primary:hover {
           background-color: rgba(59, 130, 246, 0.3);
           border-color: rgba(59, 130, 246, 0.5);
        }
        .dark .btn-glass.primary:hover {
           background-color: rgba(59, 130, 246, 0.4);
           border-color: rgba(59, 130, 246, 0.6);
           box-shadow: 0 0 20px 0 rgba(59, 130, 246, 0.4);
        }

        /* Custom glow shadows (Dark Mode Only) */
        .dark .shadow-electric-glow {
          box-shadow: 0 0 20px 0 rgba(59, 130, 246, 0.4);
        }
        .dark .hover\\:shadow-electric-glow:hover {
          box-shadow: 0 0 20px 0 rgba(59, 130, 246, 0.4);
        }

        /* Ensure recharts tooltips are styled */
        .recharts-tooltip-wrapper {
          z-index: 50 !important;
        }
      `}</style>
    </div>
  );
}