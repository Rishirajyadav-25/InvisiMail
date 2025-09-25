// src/components/CreateAliasForm.jsx
'use client';

export default function CreateAliasForm({
  isPro,
  personalAliasesCount,
  canCreateMore,
  newAlias,
  isCollaborative,
  // Functions passed from the parent
  handleCreateAlias,
  setNewAlias,
  setIsCollaborative,
}) {
  return (
    <div id="create-alias-form" className="bg-white rounded-xl shadow-md border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Create New Alias</h3>
        <p className="mt-1 text-sm text-gray-600">
          Create a new email alias to receive emails at a custom address.
          {!isPro && (
            <span className="block mt-1 text-amber-600 font-medium">
              Free plan: {personalAliasesCount}/5 personal aliases used. Upgrade to Pro for unlimited aliases.
            </span>
          )}
        </p>
      </div>
      <div className="p-6">
        <form onSubmit={handleCreateAlias} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="alias-input" className="block text-sm font-medium text-gray-700 mb-2">
                Alias Name
              </label>
              <div className="flex">
                <input
                  id="alias-input"
                  type="text"
                  placeholder="e.g., support, contact"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  disabled={!canCreateMore}
                  required
                />
                <span className="inline-flex items-center text-gray-500 px-3 py-2 bg-gray-50 border border-l-0 border-gray-300 rounded-r-md">
                  @{process.env.NEXT_PUBLIC_MAILGUN_DOMAIN || 'yourdomain.com'}
                </span>
              </div>
            </div>
          </div>

          {isPro && (
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isCollaborative}
                  onChange={(e) => setIsCollaborative(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Make this a collaborative alias</span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={!canCreateMore || !newAlias}
            className={`w-full sm:w-auto font-medium py-2 px-4 rounded-md transition-colors ${
              canCreateMore && newAlias
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canCreateMore ? 'Create Alias' : 'Upgrade to create more'}
          </button>
        </form>
      </div>
    </div>
  );
}