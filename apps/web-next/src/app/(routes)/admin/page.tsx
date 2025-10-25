'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface ModerationItem {
  id: number;
  content: string;
  gender: string;
  age: number;
  status: string;
  language: string;
  created_at: string;
  moderation_notes?: string;
  toxicity_scores?: any;
}

interface SocialMediaJob {
  id: number;
  confession_id: number;
  platforms: string[];
  status: string;
  created_at: string;
  updated_at: string;
  error?: string;
}

interface PlatformStatus {
  configured: boolean;
  poster_available: boolean;
  rate_limit_status: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('moderation');
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([]);
  const [socialJobs, setSocialJobs] = useState<SocialMediaJob[]>([]);
  const [platformStatus, setPlatformStatus] = useState<Record<string, PlatformStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (!user?.is_superuser) {
      router.push('/');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.is_superuser) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load moderation queue
      const moderationResponse = await fetch('/api/admin/moderation-queue');
      if (moderationResponse.ok) {
        const moderationData = await moderationResponse.json();
        setModerationQueue(moderationData);
      }

      // Load social media jobs
      const socialResponse = await fetch('/api/admin/social-jobs');
      if (socialResponse.ok) {
        const socialData = await socialResponse.json();
        setSocialJobs(socialData);
      }

      // Load platform status
      const statusResponse = await fetch('/api/confessions/social-media/platform-status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setPlatformStatus(statusData);
      }

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModerationAction = async (confessionId: number, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/moderate/${confessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        // Refresh moderation queue
        loadDashboardData();
      } else {
        setError('Failed to process moderation action');
      }
    } catch (err) {
      setError('Failed to process moderation action');
      console.error('Moderation action error:', err);
    }
  };

  const retryFailedSocialPost = async (jobId: number) => {
    try {
      const response = await fetch(`/api/admin/retry-social-post/${jobId}`, {
        method: 'POST'
      });

      if (response.ok) {
        loadDashboardData();
      } else {
        setError('Failed to retry social media post');
      }
    } catch (err) {
      setError('Failed to retry social media post');
      console.error('Retry error:', err);
    }
  };

  if (!user?.is_superuser) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🛡️ Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage content moderation and social media integration</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-800 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('moderation')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'moderation'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔍 Moderation Queue ({moderationQueue.length})
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'social'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📱 Social Media Jobs ({socialJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('platforms')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'platforms'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ⚙️ Platform Status
          </button>
        </nav>
      </div>

      {/* Moderation Queue Tab */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Pending Moderation</h2>
            <Button onClick={loadDashboardData} variant="outline" size="sm">
              🔄 Refresh
            </Button>
          </div>

          {moderationQueue.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No items pending moderation</p>
            </div>
          ) : (
            <div className="space-y-4">
              {moderationQueue.map((item) => (
                <div key={item.id} className="bg-white border rounded-lg p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-sm font-medium text-gray-500">
                          ID: {item.id}
                        </span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          {item.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.gender}, {item.age} years • {item.language}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-4">{item.content}</p>
                      
                      {item.moderation_notes && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-4">
                          <p className="text-sm text-red-700">
                            <strong>Moderation Notes:</strong> {item.moderation_notes}
                          </p>
                        </div>
                      )}

                      {item.toxicity_scores && (
                        <div className="bg-gray-50 p-3 rounded-md mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">AI Analysis:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(item.toxicity_scores).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key.replace('_', ' ')}:</span>
                                <span className={`font-medium ${
                                  (value as number) > 0.7 ? 'text-red-600' : 
                                  (value as number) > 0.4 ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                  {((value as number) * 100).toFixed(1)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      onClick={() => handleModerationAction(item.id, 'reject')}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      ❌ Reject
                    </Button>
                    <Button
                      onClick={() => handleModerationAction(item.id, 'approve')}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      ✅ Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Social Media Jobs Tab */}
      {activeTab === 'social' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Social Media Jobs</h2>
            <Button onClick={loadDashboardData} variant="outline" size="sm">
              🔄 Refresh
            </Button>
          </div>

          {socialJobs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No social media jobs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {socialJobs.map((job) => (
                <div key={job.id} className="bg-white border rounded-lg p-6 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-sm font-medium text-gray-500">
                          Job ID: {job.id}
                        </span>
                        <span className="text-sm text-gray-500">
                          Confession: {job.confession_id}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          job.status === 'completed' ? 'bg-green-100 text-green-800' :
                          job.status === 'failed' ? 'bg-red-100 text-red-800' :
                          job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-2">
                        {job.platforms.map((platform) => (
                          <span
                            key={platform}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {platform === 'facebook' ? '📘' : platform === 'instagram' ? '📷' : '🐦'} {platform}
                          </span>
                        ))}
                      </div>

                      <div className="text-sm text-gray-500">
                        <p>Created: {new Date(job.created_at).toLocaleString()}</p>
                        <p>Updated: {new Date(job.updated_at).toLocaleString()}</p>
                      </div>

                      {job.error && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-md mt-3">
                          <p className="text-sm text-red-700">
                            <strong>Error:</strong> {job.error}
                          </p>
                        </div>
                      )}
                    </div>

                    {job.status === 'failed' && (
                      <Button
                        onClick={() => retryFailedSocialPost(job.id)}
                        size="sm"
                        variant="outline"
                      >
                        🔄 Retry
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Platform Status Tab */}
      {activeTab === 'platforms' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Platform Status</h2>
            <Button onClick={loadDashboardData} variant="outline" size="sm">
              🔄 Refresh
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(platformStatus).map(([platform, status]) => (
              <div key={platform} className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">
                    {platform === 'facebook' ? '📘' : platform === 'instagram' ? '📷' : '🐦'}
                  </span>
                  <h3 className="text-lg font-medium capitalize">{platform}</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Configured:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      status.configured 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {status.configured ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Poster Available:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      status.poster_available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {status.poster_available ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rate Limit:</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {status.rate_limit_status}
                    </span>
                  </div>
                </div>

                {!status.configured && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-xs text-yellow-700">
                      Platform not configured. Check environment variables.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}