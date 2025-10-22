'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiHome,
  FiPlus,
  FiSend,
  FiInbox,
  FiFileText,
  FiStar,
  FiLogOut,
  FiGlobe,
  FiUser
} from 'react-icons/fi';

export default function Sidebar({ user, onUpgrade }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/'; // Redirect to home or signin page
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: FiHome,
      active: pathname === '/dashboard',
    },
    {
      name: 'Create Alias',
      href: '/dashboard/create-alias',
      icon: FiPlus,
      active: pathname === '/dashboard/create-alias',
    },
    {
      name: 'Compose',
      href: '/dashboard/send',
      icon: FiSend,
      active: pathname === '/dashboard/send',
    },
    {
      name: 'Inbox',
      href: '/dashboard/inbox',
      icon: FiInbox,
      active: pathname.startsWith('/dashboard/inbox'),
    },
    {
      name: 'All Aliases',
      href: '/dashboard/aliases',
      icon: FiFileText,
      active: pathname === '/dashboard/aliases',
    },
  ];

  const isPro = user?.plan === 'pro';

  if (isPro) {
    navigationItems.push({
      name: 'Custom Domains',
      href: '/dashboard/domains',
      icon: FiGlobe,
      active: pathname === '/dashboard/domains',
    });
  }

  return (
    <aside className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-screen transition-colors duration-300 ease-in-out"> {/* Added transition */}
      {/* Header with user profile */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300 ease-in-out"> {/* Added transition */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-600 rounded-lg flex items-center justify-center transition-colors duration-300 ease-in-out"> {/* Added transition */}
            {user?.name ? (
              <span className="text-xl font-bold text-blue-800 dark:text-white transition-colors duration-300 ease-in-out"> {/* Added transition */}
                {user.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <FiUser className="w-6 h-6 text-blue-800 dark:text-white transition-colors duration-300 ease-in-out" /> /* Added transition */
            )}
          </div>
        </div>
        <div className="text-center">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-1 transition-colors duration-300 ease-in-out">{user?.name || 'User'}</h3> {/* Added transition */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 transition-colors duration-300 ease-in-out">{user?.email}</p> {/* Added transition */}
          <div className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border transition-colors duration-300 ease-in-out ${ /* Added transition */
            isPro
              ? 'bg-blue-100 dark:bg-blue-600/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/30'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
          }`}>
            {isPro && <FiStar className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-400 transition-colors duration-300 ease-in-out" />} {/* Added transition */}
            {isPro ? 'Pro Plan' : 'Free Plan'}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`block w-full px-4 py-3 rounded-lg text-sm font-medium border transition-colors duration-300 ease-in-out ${ /* Added transition */
                  item.active
                    ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 transition-colors duration-300 ease-in-out ${ /* Added transition */
                    item.active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <span>{item.name}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {/* Upgrade to Pro Button */}
        {!isPro && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300 ease-in-out"> {/* Added transition */}
            <button
              onClick={onUpgrade}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30 hover:bg-blue-100 dark:hover:bg-blue-600/30 transition-colors duration-300 ease-in-out" /* Added transition */
            >
              <FiStar className="w-4 h-4 text-blue-600 dark:text-blue-400 transition-colors duration-300 ease-in-out" /> {/* Added transition */}
              <span>Upgrade to Pro</span>
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2 transition-colors duration-300 ease-in-out"> {/* Added transition */}
              Unlock unlimited aliases & collaboration
            </p>
          </div>
        )}

        {/* Pro Benefits Display */}
        {isPro && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300 ease-in-out"> {/* Added transition */}
            <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-4 transition-colors duration-300 ease-in-out"> {/* Added transition */}
              <div className="flex items-center gap-2 mb-3">
                <FiStar className="w-4 h-4 text-green-600 dark:text-green-400 transition-colors duration-300 ease-in-out" /> {/* Added transition */}
                <span className="text-sm font-medium text-green-800 dark:text-green-300 transition-colors duration-300 ease-in-out">Pro Benefits Active</span> {/* Added transition */}
              </div>
              <ul className="text-xs text-green-700 dark:text-green-200 space-y-1 transition-colors duration-300 ease-in-out"> {/* Added transition */}
                <li>• Unlimited email aliases</li>
                <li>• Team collaboration</li>
                <li>• Custom domains</li>
                <li>• Advanced analytics</li>
              </ul>
            </div>
          </div>
        )}
      </nav>

      {/* Logout Button */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300 ease-in-out"> {/* Added transition */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border bg-red-50 dark:bg-red-600/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-600/30 transition-colors duration-300 ease-in-out" /* Added transition */
        >
          <FiLogOut className="w-4 h-4 text-red-600 dark:text-red-400 transition-colors duration-300 ease-in-out" /> {/* Added transition */}
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}