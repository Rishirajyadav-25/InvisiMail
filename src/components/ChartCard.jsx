// src/components/ChartCard.jsx
'use client';

export default function ChartCard({ title, type, data = [], inboxStats = {} }) {
  // --- Spam Ratio Chart Logic ---
  const renderSpamRatioChart = () => {
    const spam = inboxStats?.spamCount || 0;
    const total = Math.max(inboxStats?.totalEmails || 0, spam + 1); // Avoids division by zero
    const spamPct = Math.min(100, Math.round((spam / total) * 100));
    const legitPct = 100 - spamPct;

    return (
      <div className="flex items-center gap-6 w-full mt-4">
        <div
          className="w-24 h-24 rounded-full"
          style={{ 
            background: `conic-gradient(from 0deg, #ef4444 ${spamPct}%, #10b981 0)`
          }}
        />
        <div className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-green-400" />
            <span className="text-gray-300">Legitimate ({legitPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-red-400" />
            <span className="text-gray-300">Spam ({spamPct}%)</span>
          </div>
        </div>
      </div>
    );
  };

  // --- Traffic Chart Logic ---
  const renderTrafficChart = () => {
    const maxValue = Math.max(...data);
    
    return (
      <div className="h-40 flex items-end gap-2 mt-4">
        {data.map((value, idx) => {
          const height = (value / maxValue) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div
                style={{ height: `${height}%` }}
                className="w-full bg-blue-500 rounded-t transition-colors hover:bg-blue-400"
                title={`${value} emails`}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="premium-card bg-gray-800 rounded-lg border border-gray-700 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">{title}</h3>
      
      {/* Conditionally render the correct chart based on the 'type' prop */}
      {type === 'traffic' && renderTrafficChart()}
      {type === 'spamRatio' && renderSpamRatioChart()}
    </div>
  );
}