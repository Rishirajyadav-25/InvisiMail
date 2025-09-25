// src/components/StatsCard.jsx
'use client';

export default function StatsCard({ title, stat, icon, theme }) {
  // Color mapping for different themes
  const colorThemes = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
    },
    rose: {
      bg: 'bg-rose-100',
      text: 'text-rose-600',
    },
  };

  const selectedTheme = colorThemes[theme] || colorThemes.blue;

  return (
    <div className="bg-white rounded-xl border shadow-md p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{stat}</p>
        </div>
        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${selectedTheme.bg} ${selectedTheme.text}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}