// src/components/RecentActivity.jsx
'use client';

import Link from 'next/link';
import { FiMail, FiPlus, FiUsers, FiEye } from 'react-icons/fi';

export default function RecentActivity({ activities, aliases }) {
  // Helper function to get activity text and icon
  const getActivityDetails = (act) => {
    switch (act.type) {
      case 'sent':
        return {
          text: `Email sent to ${act.data.to}`,
          subject: act.data.subject,
          icon: FiMail,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-100'
        };
      case 'added_collaborator':
        return {
          text: `Added ${act.data.addedUserEmail}`,
          subject: `as ${act.data.role}`,
          icon: FiUsers,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      case 'removed_collaborator':
        return {
          text: `Removed ${act.data.removedUserEmail}`,
          subject: 'from collaboration',
          icon: FiUsers,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-100'
        };
      default:
        return {
          text: 'Activity logged',
          subject: '',
          icon: FiEye,
          iconColor: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
    }
  };

  // Get last 3 created aliases
  const recentAliases = aliases 
    ? [...aliases]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3)
    : [];

  // Get recent activities (limit to 5)
  const recentActivities = activities 
    ? [...activities]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    : [];

  return (
    <div className="bg-white rounded-xl border shadow-md">
      <div className="px-5 py-3 border-b">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        <p className="text-sm text-gray-500">Your latest aliases and activities</p>
      </div>
      
      <div className="divide-y divide-gray-100">
        {/* Recently Created Aliases Section */}
        {recentAliases.length > 0 && (
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <FiPlus className="w-4 h-4 text-green-600" />
              <h4 className="text-sm font-medium text-gray-800">Recently Created Aliases</h4>
            </div>
            <div className="space-y-2">
              {recentAliases.map((alias) => (
                <div key={alias._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      alias.isCollaborative ? 'bg-indigo-100' : 'bg-blue-100'
                    }`}>
                      <span className={`text-sm font-medium ${
                        alias.isCollaborative ? 'text-indigo-600' : 'text-blue-600'
                      }`}>
                        {alias.aliasEmail.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {alias.aliasEmail}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">
                          {new Date(alias.createdAt).toLocaleDateString()}
                        </p>
                        {alias.isCollaborative && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Team
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Link 
                      href={`/dashboard/inbox?alias=${alias.aliasEmail}`}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                      title="View Inbox"
                    >
                      <FiMail className="w-4 h-4" />
                    </Link>
                    <Link 
                      href={`/dashboard/send?alias=${alias.aliasEmail}`}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                      title="Send Email"
                    >
                      <FiPlus className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activities Section */}
        <div className="p-5">
          <h4 className="text-sm font-medium text-gray-800 mb-3">Email Activities</h4>
          {recentActivities && recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((act) => {
                const details = getActivityDetails(act);
                const IconComponent = details.icon;
                
                return (
                  <div key={act._id} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${details.bgColor} flex-shrink-0`}>
                      <IconComponent className={`w-4 h-4 ${details.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 font-medium truncate">
                        {details.text}
                      </p>
                      {details.subject && (
                        <p className="text-xs text-gray-600 truncate">
                          {details.subject}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(act.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <FiEye className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent email activities.</p>
            </div>
          )}
        </div>

        {/* View More Links */}
        <div className="px-5 py-3 bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-between text-sm">
            <Link 
              href="/dashboard/aliases" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              View all aliases →
            </Link>
            <Link 
              href="/dashboard/inbox" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Go to inbox →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}