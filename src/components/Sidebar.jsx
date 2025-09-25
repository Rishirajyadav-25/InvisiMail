// src/components/Sidebar.jsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiUser,
  FiPlus,
  FiSend,
  FiInbox,
  FiFileText
} from 'react-icons/fi';

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  const navigationItems = [
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: FiUser,
      active: pathname === '/dashboard/profile',
    },
    {
      name: 'Create alias',
      href: '/dashboard/create-alias',
      icon: FiPlus,
      active: pathname === '/dashboard/create-alias',
      onClick: () => {
        // Scroll to the create alias form if on the same page
        const element = document.getElementById('create-alias-form');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    },
    {
      name: 'Compose',
      href: '/dashboard/send',
      icon: FiSend,
      active: pathname === '/dashboard/compose',
    },
    {
      name: 'Inbox',
      href: '/dashboard/inbox',
      icon: FiInbox,
      active: pathname === '/dashboard/inbox',
    },
    {
      name: 'Total Aliases',
      href: '/dashboard/aliases',
      icon: FiFileText,
      active: pathname === '/dashboard/aliases',
    },
  ];

  const handleNavClick = (item, e) => {
    if (item.onClick) {
      e.preventDefault();
      item.onClick();
    }
    // If there's no custom onClick or it doesn't handle navigation, let Link handle it
  };

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      {/* Header with user profile */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600">
              <FiUser className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6">
        <ul className="space-y-3">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={(e) => handleNavClick(item, e)}
                className={`block w-full px-4 py-3 rounded-lg text-center text-sm font-medium border transition-all duration-200 ${
                  item.active
                    ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}