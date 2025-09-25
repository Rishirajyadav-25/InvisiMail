// src/components/RecentActivity.jsx
'use client';

export default function RecentActivity({ activities }) {
  // Helper function moved from the main dashboard to keep the component self-contained
  const getActivityText = (act) => {
    switch (act.type) {
      case 'sent':
        return `Email sent to ${act.data.to}: ${act.data.subject}`;
      case 'added_collaborator':
        return `Added ${act.data.addedUserEmail} as ${act.data.role}`;
      case 'removed_collaborator':
        return `Removed ${act.data.removedUserEmail}`;
      default:
        return 'Activity logged';
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow-md">
      <div className="px-5 py-3 border-b">
        <p className="text-sm text-gray-500">Recent Activity</p>
      </div>
      <div className="divide-y">
        {activities && activities.length > 0 ? (
          activities.slice(0, 5).map((act) => (
            <div key={act._id} className="px-5 py-3 flex items-center justify-between text-sm">
              <p className="text-gray-700 truncate pr-4">{getActivityText(act)}</p>
              <span className="text-gray-400 whitespace-nowrap text-xs">
                {new Date(act.createdAt).toLocaleString()}
              </span>
            </div>
          ))
        ) : (
          <div className="px-5 py-6 text-sm text-gray-500">No recent activity.</div>
        )}
      </div>
    </div>
  );
}