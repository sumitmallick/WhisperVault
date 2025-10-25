'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { confessionsApi } from '@/lib/api/client';
import { Button } from '@/components/ui/button';

interface Confession {
  id: number;
  user_id?: number;
  gender: string;
  age: number;
  content: string;
  language?: string;
  anonymous: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  items: Confession[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface MyConfessionsProps {
  className?: string;
}

export default function MyConfessions({ className = '' }: MyConfessionsProps) {
  const { user, isAuthenticated } = useAuth();
  const [confessions, setConfessions] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSocialOptions, setShowSocialOptions] = useState<number | null>(null);

  const loadConfessions = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const data = await confessionsApi.getMyConfessions(page, 5); // 5 per page
      setConfessions(data);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || 'Failed to load confessions');
      console.error('Error loading confessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadConfessions(1);
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const handleSocialShare = async (confessionId: number, platforms: string[]) => {
    try {
      await confessionsApi.postToSocial(confessionId, platforms, true, 'dark', 0);
      alert('Social media post scheduled successfully!');
      setShowSocialOptions(null);
    } catch (err: any) {
      alert(`Failed to schedule social media post: ${err.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      approved: 'bg-green-100 text-green-800',
      pending_moderation: 'bg-yellow-100 text-yellow-800',
      blocked: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated || !user) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 text-center ${className}`}>
        <h2 className="text-xl font-semibold text-blue-900 mb-2">📝 Your Confessions</h2>
        <p className="text-blue-700 mb-4">Sign in to view and manage your confessions</p>
        <Button asChild>
          <a href="/auth/sign-in">Sign In</a>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading your confessions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <h2 className="text-xl font-semibold text-red-900 mb-2">❌ Error</h2>
        <p className="text-red-700 mb-4">{error}</p>
        <Button onClick={() => loadConfessions(currentPage)} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!confessions || confessions.items.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 text-center ${className}`}>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">📝 Your Confessions</h2>
        <p className="text-gray-600 mb-4">You haven't shared any confessions yet</p>
        <Button asChild>
          <a href="/submit">Share Your First Confession</a>
        </Button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          📝 Your Confessions ({confessions.total})
        </h2>
        <Button asChild size="sm">
          <a href="/submit">+ New Confession</a>
        </Button>
      </div>

      <div className="space-y-4">
        {confessions.items.map((confession) => (
          <div key={confession.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">#{confession.id}</span>
                {getStatusBadge(confession.status)}
                {confession.anonymous ? (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Anonymous</span>
                ) : (
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded">Public</span>
                )}
              </div>
              <span className="text-sm text-gray-500">{formatDate(confession.created_at)}</span>
            </div>

            <p className="text-gray-900 mb-3 line-clamp-3">{confession.content}</p>

            <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
              <span>{confession.gender}, {confession.age} years</span>
              {confession.language && (
                <span className="capitalize">{confession.language}</span>
              )}
            </div>

            {confession.status === 'approved' && (
              <div className="border-t pt-3">
                {showSocialOptions === confession.id ? (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Share to social media:</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Button 
                        size="sm" 
                        onClick={() => handleSocialShare(confession.id, ['facebook'])}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        📘 Facebook
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleSocialShare(confession.id, ['instagram'])}
                        className="bg-pink-600 hover:bg-pink-700"
                      >
                        📷 Instagram
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleSocialShare(confession.id, ['twitter'])}
                        className="bg-sky-600 hover:bg-sky-700"
                      >
                        🐦 Twitter
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleSocialShare(confession.id, ['facebook', 'instagram', 'twitter'])}
                        variant="outline"
                      >
                        📱 All Platforms
                      </Button>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setShowSocialOptions(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowSocialOptions(confession.id)}
                    >
                      📱 Share to Social Media
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => confessionsApi.generateImage(confession.id, ['instagram'], 'dark')}
                    >
                      🎨 Generate Image
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {confessions.pages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {((confessions.page - 1) * confessions.per_page) + 1} to{' '}
            {Math.min(confessions.page * confessions.per_page, confessions.total)} of{' '}
            {confessions.total} confessions
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!confessions.has_prev}
              onClick={() => loadConfessions(currentPage - 1)}
            >
              ← Previous
            </Button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, confessions.pages) }, (_, i) => {
                const pageNum = Math.max(1, confessions.page - 2) + i;
                if (pageNum > confessions.pages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === confessions.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => loadConfessions(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              disabled={!confessions.has_next}
              onClick={() => loadConfessions(currentPage + 1)}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}