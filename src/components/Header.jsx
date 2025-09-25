// src/components/Header.jsx
'use client';

import { FiSearch, FiBell, FiSettings, FiLogOut } from 'react-icons/fi';

export default function Header({ isPro, onLogout, onUpgrade }) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <FiSearch className="absolute w-5 h-5 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 text-sm border bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Action Icons & Logout */}
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
            <FiBell className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
            <FiSettings className="w-5 h-5" />
          </button>

          {/* Conditionally render Upgrade button */}
          {!isPro && (
            <button
              onClick={onUpgrade}
              className="hidden sm:inline-flex bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-indigo-700 font-semibold"
            >
              Upgrade
            </button>
          )}

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Logout
            <FiLogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}