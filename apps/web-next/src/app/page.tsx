'use client';

import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Loading from '@/components/loading';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MyConfessions from '@/components/my-confessions';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, signOut, isLoading } = useAuth();

  useEffect(() => {
    console.log('Home page auth state:', { isAuthenticated, isLoading, user });
  }, [isAuthenticated, isLoading, user]);

  const handleLogout = () => {
    signOut();
    router.push('/');
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {isAuthenticated ? 'Welcome back!' : 'Share your thoughts anonymously'}
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              {isAuthenticated 
                ? 'What would you like to do next?'
                : 'WhisperVault lets you share your confessions without revealing your identity.'}
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link href="/submit">
                    <Button size="lg">Share a Confession</Button>
                  </Link>
                  {user?.is_superuser && (
                    <Link href="/jobs">
                      <Button variant="outline" size="lg">
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <Link href="/auth/sign-in">
                  <Button size="lg">Get Started</Button>
                </Link>
              )}
            </div>
          </div>
          
          {/* User's Confessions Section */}
          {isAuthenticated && (
            <div className="mt-16">
              <MyConfessions />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
