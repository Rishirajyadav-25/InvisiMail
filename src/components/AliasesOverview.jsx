'use client';

import Link from 'next/link';

export default function AliasesOverview({
  user,
  aliases,
  activities,
  isPro,
  toggleLoading,
  managingAliasId,
  addEmail,
  addRole,
  // Functions passed from the parent
  onToggleStatus,
  onDelete,
  onAddCollaborator,
  onRemoveCollaborator,
  setManagingAliasId,
  setAddEmail,
  setAddRole,
}) {

  const personalAliases = aliases.filter(a => !a.isCollaborative);
  const collaborativeAliases = aliases.filter(a => a.isCollaborative);

  const getActivityText = (act) => {
    // This helper is specific to this component's needs
    switch (act.type) {
        case 'sent': return `Email sent to ${act.data.to}: ${act.data.subject}`;
        case 'added_collaborator': return `Added ${act.data.addedUserEmail} as ${act.data.role}`;
        case 'removed_collaborator': return `Removed ${act.data.removedUserEmail}`;
        default: return 'Activity logged';
    }
  };

  return (
    <div id="aliases-overview" className="bg-white rounded-xl shadow-md border">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Your Email Aliases</h3>
          <span className="text-sm text-gray-500">
            {aliases.length} alias{aliases.length !== 1 ? 'es' : ''}
            {!isPro && <span className="text-amber-600 font-medium ml-2">({personalAliases.length}/5 personal)</span>}
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {aliases.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <span className="text-4xl mb-4 block">📭</span>
            <p className="text-gray-500 mb-4">No aliases created yet.</p>
            <p className="text-sm text-gray-400">
              Create your first alias to start receiving emails at custom addresses.
            </p>
          </div>
        ) : (
          <>
            {/* Personal Aliases */}
            {personalAliases.length > 0 && (
              <div className="p-4">
                <h4 className="text-md font-medium text-gray-900 mb-2 px-2">Personal Aliases</h4>
                {personalAliases.map((alias) => (
                  <div key={alias._id} className="p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Alias Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <span className="text-blue-600 font-medium text-lg">
                                            {alias.aliasEmail.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {alias.aliasEmail}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                        Forwards to: {alias.realEmail}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status & Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${alias.isActive !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span>{alias.isActive !== false ? 'Active' : 'Inactive'}</span>
                            </div>
                            <div className="text-center">
                                <p className="font-medium">{alias.emailsSent || 0}</p>
                                <p className="text-xs text-gray-400">Sent</p>
                            </div>
                            <div className="text-center">
                                <p className="font-medium">{alias.emailsReceived || 0}</p>
                                <p className="text-xs text-gray-400">Received</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => onToggleStatus(alias._id, alias.isActive !== false)}
                                disabled={toggleLoading[alias._id]}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${alias.isActive !== false ? 'bg-blue-600' : 'bg-gray-200'} ${toggleLoading[alias._id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={`Click to ${alias.isActive !== false ? 'deactivate' : 'activate'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${alias.isActive !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                            <Link href={`/dashboard/inbox?alias=${alias.aliasEmail}`} className="p-2 text-gray-500 hover:bg-gray-200 rounded-md" title="View Inbox">
                                📬
                            </Link>
                            <Link href={`/dashboard/send?alias=${alias.aliasEmail}`} className="p-2 text-gray-500 hover:bg-gray-200 rounded-md" title="Send Email">
                                ✉️
                            </Link>
                            <button onClick={() => onDelete(alias._id)} className="p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-md" title="Delete Alias">
                                🗑️
                            </button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Collaborative Aliases */}
            {collaborativeAliases.length > 0 && (
              <div className="p-4">
                <h4 className="text-md font-medium text-gray-900 mb-2 px-2">Collaborative Aliases</h4>
                {collaborativeAliases.map((alias) => {
                  const isOwner = alias.ownerId?.toString() === user?._id?.toString();
                  return (
                    <div key={alias._id} className="p-4 rounded-lg hover:bg-gray-50">
                       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            {/* Alias Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <span className="text-indigo-600 font-medium text-lg">
                                                {alias.aliasEmail.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {alias.aliasEmail}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            Owner: {alias.owner?.[0]?.name || alias.owner?.[0]?.email || 'Unknown'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Status & Stats */}
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${alias.isActive !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <span>{alias.isActive !== false ? 'Active' : 'Inactive'}</span>
                                </div>
                                <div className="text-center">
                                    <p className="font-medium">{alias.emailsSent || 0}</p>
                                    <p className="text-xs text-gray-400">Sent</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-medium">{alias.emailsReceived || 0}</p>
                                    <p className="text-xs text-gray-400">Received</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2">
                                {isOwner && (
                                    <button
                                        onClick={() => onToggleStatus(alias._id, alias.isActive !== false)}
                                        disabled={toggleLoading[alias._id]}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${alias.isActive !== false ? 'bg-blue-600' : 'bg-gray-200'} ${toggleLoading[alias._id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title={`Click to ${alias.isActive !== false ? 'deactivate' : 'activate'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${alias.isActive !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                )}
                                <Link href={`/dashboard/inbox?alias=${alias.aliasEmail}`} className="p-2 text-gray-500 hover:bg-gray-200 rounded-md" title="View Inbox">
                                    📬
                                </Link>
                                <Link href={`/dashboard/send?alias=${alias.aliasEmail}`} className="p-2 text-gray-500 hover:bg-gray-200 rounded-md" title="Send Email">
                                    ✉️
                                </Link>
                                {isOwner && (
                                    <button onClick={() => onDelete(alias._id)} className="p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-md" title="Delete Alias">
                                    🗑️
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Collaborators & Activity Section */}
                        <div className="mt-4 pl-14">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Collaborators List & Add Form */}
                                <div>
                                    <h4 className="font-medium text-sm text-gray-800 mb-2">Collaborators</h4>
                                    <div className="space-y-2">
                                        {alias.collaborators?.map((c) => (
                                            <div key={c.userId} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
                                                <span className="text-gray-700">
                                                    {c.userDetails?.name || c.userDetails?.email || 'Unknown User'} ({c.role})
                                                </span>
                                                {isOwner && (
                                                    <button onClick={() => onRemoveCollaborator(alias._id, c.userId)} className="text-red-500 hover:text-red-700 text-xs font-semibold">
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {alias.collaborators?.length === 0 && (
                                            <p className="text-gray-500 text-sm py-2">No collaborators yet.</p>
                                        )}
                                    </div>

                                    {isOwner && (
                                        <div className="mt-3">
                                            <div className="flex space-x-2">
                                                <input
                                                    type="email"
                                                    placeholder="Add user by email"
                                                    value={managingAliasId === alias._id ? addEmail : ''}
                                                    onChange={(e) => { setManagingAliasId(alias._id); setAddEmail(e.target.value); }}
                                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <button
                                                    onClick={() => onAddCollaborator(alias._id, addEmail, addRole)}
                                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-300"
                                                    disabled={!addEmail || managingAliasId !== alias._id}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Recent Activity */}
                                <div>
                                    <h4 className="font-medium text-sm text-gray-800 mb-2">Recent Activity</h4>
                                    <div className="space-y-1 text-xs text-gray-600">
                                        {activities.filter(act => act.aliasId?.toString() === alias._id?.toString()).slice(0, 3).map((act) => (
                                            <p key={act._id} className="truncate p-2 bg-gray-50 rounded-md">
                                            {getActivityText(act)}
                                            <span className="text-gray-400 ml-2">({new Date(act.createdAt).toLocaleDateString()})</span>
                                            </p>
                                        ))}
                                        {activities.filter(act => act.aliasId?.toString() === alias._id?.toString()).length === 0 && (
                                            <p className="text-gray-500 text-sm py-2">No activity recorded.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}