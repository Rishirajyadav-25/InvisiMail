// src/app/dashboard/aliases/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AliasesOverview from '@/components/AliasesOverview';
import AssistantChatPhase2 from '@/components/AssistantChatPhase2';

export default function AllAliasesPage() {
  const [user, setUser] = useState(null);
  const [aliases, setAliases] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toggleLoading, setToggleLoading] = useState({});
  const [managingAliasId, setManagingAliasId] = useState(null);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('member');
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
    fetchAliases();
    fetchActivities();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        router.push('/signin');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAliases = async () => {
    try {
      const response = await fetch('/api/aliases');
      if (response.ok) {
        const aliasData = await response.json();
        setAliases(aliasData);
      }
    } catch (error) {
      console.error('Error fetching aliases:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/shared-activities');
      if (response.ok) {
        const activityData = await response.json();
        setActivities(activityData);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleToggleStatus = async (aliasId, currentStatus) => {
    setToggleLoading(prev => ({ ...prev, [aliasId]: true }));
    try {
      const response = await fetch('/api/aliases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aliasId,
          isActive: !currentStatus
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAliases(prev => 
          prev.map(alias => 
            alias._id === aliasId ? data.alias : alias
          )
        );
        setSuccess(`Alias ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update alias');
      }
    } catch (error) {
      setError('Network error while updating alias');
    } finally {
      setToggleLoading(prev => ({ ...prev, [aliasId]: false }));
    }
  };

  const handleDelete = async (aliasId) => {
    if (!confirm('Are you sure you want to delete this alias? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/aliases/${aliasId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAliases(prev => prev.filter(alias => alias._id !== aliasId));
        setSuccess('Alias deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete alias');
      }
    } catch (error) {
      setError('Network error while deleting alias');
    }
  };

  const handleAddCollaborator = async (aliasId, email, role) => {
    if (!email.trim()) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch('/api/aliases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aliasId,
          action: 'addCollaborator',
          userEmail: email.trim(),
          role
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAliases(prev => 
          prev.map(alias => 
            alias._id === aliasId ? data.alias : alias
          )
        );
        setSuccess('Collaborator added successfully');
        setAddEmail('');
        setManagingAliasId(null);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add collaborator');
      }
    } catch (error) {
      setError('Network error while adding collaborator');
    }
  };

  const handleRemoveCollaborator = async (aliasId, collaboratorId) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) {
      return;
    }

    try {
      const response = await fetch('/api/aliases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aliasId,
          action: 'removeCollaborator',
          collaboratorId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAliases(prev => 
          prev.map(alias => 
            alias._id === aliasId ? data.alias : alias
          )
        );
        setSuccess('Collaborator removed successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to remove collaborator');
      }
    } catch (error) {
      setError('Network error while removing collaborator');
    }
  };

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const { order } = await response.json();
        
        if (window.Razorpay) {
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'Email Alias Pro',
            description: 'Upgrade to Pro Plan',
            order_id: order.id,
            handler: function (response) {
              window.location.href = '/dashboard?upgraded=true';
            },
            prefill: {
              email: user?.email,
              name: user?.name
            }
          };
          
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          setError('Payment system not loaded. Please refresh and try again.');
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create payment order');
      }
    } catch (error) {
      setError('Failed to initiate upgrade process');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading aliases...</p>
        </div>
      </div>
    );
  }

  const isPro = user?.plan === 'pro';

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar user={user} onUpgrade={handleUpgrade} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">All Email Aliases</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage all your email aliases - personal and collaborative.
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {success}
            </div>
          )}

          

          <AliasesOverview
            user={user}
            aliases={aliases}
            activities={activities}
            isPro={isPro}
            toggleLoading={toggleLoading}
            managingAliasId={managingAliasId}
            addEmail={addEmail}
            addRole={addRole}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            onAddCollaborator={handleAddCollaborator}
            onRemoveCollaborator={handleRemoveCollaborator}
            setManagingAliasId={setManagingAliasId}
            setAddEmail={setAddEmail}
            setAddRole={setAddRole}

            
          />
          <AssistantChatPhase2 />
        </main>
      </div>
    </div>
  );
}