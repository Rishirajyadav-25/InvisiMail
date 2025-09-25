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
          className="w-28 h-28 rounded-full"
          style={{ background: `conic-gradient(#ef4444 ${spamPct}%, #3b82f6 0)` }}
        />
        <div className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-700">Legitimate ({legitPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-700">Spam ({spamPct}%)</span>
          </div>
        </div>
      </div>
    );
  };

  // --- Traffic Chart Logic ---
  const renderTrafficChart = () => {
    return (
      <div className="h-40 flex items-end gap-2 mt-4">
        {data.map((value, idx) => (
          <div key={idx} className="flex-1 bg-blue-100 rounded">
            <div
              style={{ height: `${value * 4}px` }}
              className="w-full bg-blue-500 rounded-t"
              title={`${value} emails`}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border shadow-md p-5">
      <p className="text-sm text-gray-700 mb-2">{title}</p>
      
      {/* Conditionally render the correct chart based on the 'type' prop */}
      {type === 'traffic' && renderTrafficChart()}
      {type === 'spamRatio' && renderSpamRatioChart()}
    </div>
  );
}