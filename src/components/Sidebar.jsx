// // src/components/Sidebar.jsx
// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';
// import { usePathname, useRouter } from 'next/navigation';
// import {
//   FiUser,
//   FiPlus,
//   FiSend,
//   FiInbox,
//   FiFileText,
//   FiStar,
//   FiLogOut,
//   FiGlobe // New icon for custom domains
// } from 'react-icons/fi';

// export default function Sidebar({ user, onUpgrade }) {
//   const pathname = usePathname();
//   const router = useRouter();

//   const handleLogout = async () => {
//     await fetch('/api/auth/logout', { method: 'POST' });
//     window.location.href = '/';
//   };

//   const navigationItems = [
//     {
//       name: 'Dashboard',
//       href: '/dashboard',
//       icon: FiUser,
//       active: pathname === '/dashboard/profile',
//     },
//     {
//       name: 'Create Alias',
//       href: '/dashboard/create-alias',
//       icon: FiPlus,
//       active: pathname === '/dashboard/create-alias',
//     },
//     {
//       name: 'Compose',
//       href: '/dashboard/send',
//       icon: FiSend,
//       active: pathname === '/dashboard/send',
//     },
//     {
//       name: 'Inbox',
//       href: '/dashboard/inbox',
//       icon: FiInbox,
//       active: pathname === '/dashboard/inbox',
//     },
//     {
//       name: 'All Aliases',
//       href: '/dashboard/aliases',
//       icon: FiFileText,
//       active: pathname === '/dashboard/aliases',
//     },
//   ];

//   const isPro = user?.plan === 'pro';

//   // Add Custom Domains only for Pro users
//   if (isPro) {
//     navigationItems.push({
//       name: 'Custom Domains',
//       href: '/dashboard/domains',
//       icon: FiGlobe,
//       active: pathname === '/dashboard/domains',
//     });
//   }

//   return (
//     <aside className="w-80 bg-white border-r border-gray-200 flex flex-col min-h-screen">
//       {/* Header with user profile */}
//       <div className="p-6 border-b border-gray-200">
//         <div className="flex items-center justify-center mb-4">
//           <div className="w-16 h-16 bg-gray-100 rounded-full border-2 border-gray-300 flex items-center justify-center">
//             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600">
//               {user?.name ? (
//                 <span className="text-xl font-semibold">{user.name.charAt(0).toUpperCase()}</span>
//               ) : (
//                 <FiUser className="w-6 h-6" />
//               )}
//             </div>
//           </div>
//         </div>
//         <div className="text-center">
//           <h3 className="font-bold text-gray-800">{user?.name || 'User'}</h3>
//           <p className="text-sm text-gray-500">{user?.email}</p>
//           <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
//             isPro ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
//           }`}>
//             {isPro && <FiStar className="w-3 h-3 mr-1" />}
//             {isPro ? 'Pro Plan' : 'Free Plan'}
//           </div>
//         </div>
//       </div>

//       {/* Navigation */}
//       <nav className="flex-1 p-6">
//         <ul className="space-y-3">
//           {navigationItems.map((item) => (
//             <li key={item.name}>
//               <Link
//                 href={item.href}
//                 className={`block w-full px-4 py-3 rounded-lg text-center text-sm font-medium border transition-all duration-200 ${
//                   item.active
//                     ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
//                     : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
//                 }`}
//               >
//                 <div className="flex items-center justify-center gap-3">
//                   <item.icon className="w-4 h-4" />
//                   {item.name}
//                 </div>
//               </Link>
//             </li>
//           ))}
//         </ul>

//         {/* Upgrade to Pro Button (only for free users) */}
//         {!isPro && (
//           <div className="mt-6 pt-6 border-t border-gray-200">
//             <button
//               onClick={onUpgrade}
//               className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-center text-sm font-medium border bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-200 hover:from-yellow-100 hover:to-yellow-200 transition-all duration-200 shadow-sm"
//             >
//               <FiStar className="w-4 h-4" />
//               Upgrade to Pro
//             </button>
//             <p className="text-xs text-gray-500 text-center mt-2">
//               Unlock unlimited aliases & collaboration
//             </p>
//           </div>
//         )}
//       </nav>

//       {/* Logout Button */}
//       <div className="p-6 border-t border-gray-200">
//         <button
//           onClick={handleLogout}
//           className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-center text-sm font-medium border bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition-all duration-200"
//         >
//           <FiLogOut className="w-4 h-4" />
//           Logout
//         </button>
//       </div>
//     </aside>
//   );
// }














// src/components/Sidebar.jsx - ENHANCED VERSION WITH PROPER ACTIVE STATES
'use client';

import { useState } from 'react';
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
    window.location.href = '/';
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

  // Add Custom Domains only for Pro users
  if (isPro) {
    navigationItems.push({
      name: 'Custom Domains',
      href: '/dashboard/domains',
      icon: FiGlobe,
      active: pathname === '/dashboard/domains',
    });
  }

  return (
    <aside className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col min-h-screen">
      {/* Header with user profile */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
            {user?.name ? (
              <span className="text-xl font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <FiUser className="w-6 h-6 text-white" />
            )}
          </div>
        </div>
        <div className="text-center">
          <h3 className="font-bold text-gray-100 text-lg mb-1">{user?.name || 'User'}</h3>
          <p className="text-sm text-gray-400 mb-3">{user?.email}</p>
          <div className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${
            isPro 
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/30' 
              : 'bg-gray-700 text-gray-300 border-gray-600'
          }`}>
            {isPro && <FiStar className="w-3 h-3 mr-1" />}
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
                className={`block w-full px-4 py-3 rounded-lg text-sm font-medium border transition-colors ${
                  item.active
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/30'
                    : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${
                    item.active ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                  <span>{item.name}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {/* Upgrade to Pro Button (only for free users) */}
        {!isPro && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={onUpgrade}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border bg-blue-600/20 text-blue-300 border-blue-500/30 hover:bg-blue-600/30 transition-colors"
            >
              <FiStar className="w-4 h-4" />
              <span>Upgrade to Pro</span>
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              Unlock unlimited aliases & collaboration
            </p>
          </div>
        )}

        {/* Pro Benefits Display */}
        {isPro && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiStar className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-300">Pro Benefits Active</span>
              </div>
              <ul className="text-xs text-green-200 space-y-1">
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
      <div className="p-6 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border bg-red-600/20 text-red-300 border-red-500/30 hover:bg-red-600/30 transition-colors"
        >
          <FiLogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}