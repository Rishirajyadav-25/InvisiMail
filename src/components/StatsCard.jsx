// src/components/StatsCard.jsx
'use client';

import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

export default function StatsCard({ 
  title, 
  stat, 
  icon, 
  theme = 'blue', 
  subtitle = null, 
  actionLink = null, 
  actionText = null 
}) {
  const themeClasses = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      statColor: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      statColor: 'text-green-600',
      border: 'border-green-200'
    },
    rose: {
      bg: 'bg-rose-50',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      statColor: 'text-rose-600',
      border: 'border-rose-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      statColor: 'text-yellow-600',
      border: 'border-yellow-200'
    }
  };

  const currentTheme = themeClasses[theme] || themeClasses.blue;

  return (
    <div className={`${currentTheme.bg} ${currentTheme.border} border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className={`${currentTheme.iconBg} p-3 rounded-lg`}>
              <div className={`${currentTheme.iconColor} w-6 h-6`}>
                {icon}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className={`text-2xl font-bold ${currentTheme.statColor}`}>
                {stat}
              </p>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {actionLink && actionText && (
          <div className="ml-4">
            <Link 
              href={actionLink}
              className={`inline-flex items-center gap-2 text-sm font-medium ${currentTheme.iconColor} hover:underline transition-colors`}
            >
              {actionText}
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}