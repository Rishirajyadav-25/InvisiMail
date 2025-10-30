// src/components/CreateAliasForm.jsx
'use client';

import { FiPlus, FiInfo, FiStar, FiGlobe } from 'react-icons/fi';

export default function CreateAliasForm({
  isPro,
  personalAliasesCount,
  canCreateMore,
  newAlias,
  isCollaborative,
  submitting = false,
  verifiedDomains = [],
  selectedDomain,
  setSelectedDomain,
  handleCreateAlias,
  setNewAlias,
  setIsCollaborative,
}) {
  const defaultDomain = process.env.NEXT_PUBLIC_MAILGUN_DOMAIN || 'yourdomain.com';
  const availableDomains = [defaultDomain, ...verifiedDomains.map(d => d.domain)];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiPlus className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Create New Email Alias</h3>
            <p className="text-sm text-gray-600 mt-1">
              Generate a custom email address that forwards to your inbox.
            </p>
          </div>
        </div>
        
        {/* Plan Status */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiInfo className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Current Plan Status</span>
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              isPro ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {isPro && <FiStar className="w-3 h-3" />}
              {isPro ? 'Pro Plan' : 'Free Plan'}
            </div>
          </div>
          
          {!isPro && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Personal aliases used:</span>
                <span className={`font-medium ${personalAliasesCount >= 5 ? 'text-red-600' : 'text-blue-600'}`}>
                  {personalAliasesCount}/5
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    personalAliasesCount >= 5 ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min((personalAliasesCount / 5) * 100, 100)}%` }}
                ></div>
              </div>
              {personalAliasesCount >= 4 && (
                <p className="text-xs text-amber-600 mt-1 font-medium">
                  {personalAliasesCount >= 5 
                    ? 'Alias limit reached. Upgrade to Pro for unlimited aliases.'
                    : `Only ${5 - personalAliasesCount} alias${5 - personalAliasesCount !== 1 ? 'es' : ''} remaining.`
                  }
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={(e) => handleCreateAlias(e, selectedDomain)} className="space-y-6">
          <div>
            <label htmlFor="alias-input" className="block text-sm font-medium text-gray-700 mb-2">
              Alias Name <span className="text-red-500">*</span>
            </label>
            <div className="flex rounded-lg shadow-sm">
              <input
                id="alias-input"
                type="text"
                placeholder="e.g., support, contact, info"
                className={`flex-1 px-4 py-3 bg-white border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-400 transition-colors ${
                  !canCreateMore ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                disabled={!canCreateMore || submitting}
                required
                pattern="[a-zA-Z0-9._-]+"
                title="Only letters, numbers, dots, hyphens and underscores allowed"
              />
              <span className="inline-flex items-center px-4 py-3 text-gray-700 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm font-medium">
                @{selectedDomain || defaultDomain}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Use letters, numbers, dots (.), hyphens (-), and underscores (_) only. 2-50 characters.
            </p>
          </div>

          {/* Domain Selection (Pro only) */}
          {isPro && verifiedDomains.length > 0 && (
            <div>
              <label htmlFor="domain-select" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FiGlobe className="w-4 h-4 text-blue-600" />
                Select Domain
              </label>
              <select
                id="domain-select"
                className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 transition-colors"
                value={selectedDomain || defaultDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                disabled={submitting}
              >
                <option value={defaultDomain}>{defaultDomain} (Default)</option>
                {verifiedDomains.map((dom) => (
                  <option key={dom._id} value={dom.domain}>
                    {dom.domain} (Custom)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1.5">
                Choose a verified custom domain or use the default.
              </p>
            </div>
          )}

          {isPro && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="collaborative-checkbox"
                    type="checkbox"
                    checked={isCollaborative}
                    onChange={(e) => setIsCollaborative(e.target.checked)}
                    disabled={submitting}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="collaborative-checkbox" className="text-sm font-medium text-gray-700 flex items-center gap-2 cursor-pointer">
                    <FiStar className="w-4 h-4 text-yellow-600" />
                    Make this a collaborative alias
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    Allow team members to send and receive emails from this alias. You can add collaborators after creation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Create Button */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              {!canCreateMore && (
                <p className="text-sm text-red-600 font-medium">
                  Upgrade to Pro to create more aliases
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={!canCreateMore || !newAlias.trim() || submitting}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                canCreateMore && newAlias.trim() && !submitting
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <FiPlus className="w-4 h-4" />
                  {canCreateMore ? 'Create Alias' : 'Upgrade Required'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Pro Features Preview for Free Users */}
        {!isPro && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <FiStar className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Unlock Pro Features</h4>
                <ul className="text-xs text-gray-600 mt-2 space-y-1">
                  <li>• Unlimited email aliases</li>
                  <li>• Collaborative team aliases</li>
                  <li>• Custom domains</li>
                  <li>• Advanced analytics</li>
                  <li>• Priority support</li>
                </ul>
                <p className="text-xs text-blue-600 font-medium mt-2">
                  Starting at ₹499/month
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}