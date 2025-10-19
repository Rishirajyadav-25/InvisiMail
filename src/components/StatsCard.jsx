// src/components/StatsCard.jsx
'use client';

import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

export default function StatsCard({ 
  title, 
  stat, 
  icon, 
  theme = 'gold', 
  subtitle = null, 
  actionLink = null, 
  actionText = null 
}) {
  const themeClasses = {
    blue: {
      bg: 'bg-blue-500/10',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      statColor: 'text-blue-300',
      border: 'border-blue-500/30'
    },
    green: {
      bg: 'bg-green-500/10',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
      statColor: 'text-green-300',
      border: 'border-green-500/30'
    },
    purple: {
      bg: 'bg-purple-500/10',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      statColor: 'text-purple-300',
      border: 'border-purple-500/30'
    }
  };

  const currentTheme = themeClasses[theme] || themeClasses.blue;

  return (
    <div className={`premium-card ${currentTheme.bg} ${currentTheme.border} border rounded-lg p-6 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className={`${currentTheme.iconBg} p-3 rounded-lg`}>
              <div className={`${currentTheme.iconColor} w-6 h-6`}>
                {icon}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
              <p className={`text-2xl font-bold ${currentTheme.statColor} mb-1`}>
                {stat}
              </p>
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
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