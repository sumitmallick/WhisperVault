'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/client';
import { toast } from 'sonner';

type User = {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
} | null;

type AuthContextType = {
  user: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<{
    user: User;
    isAuthenticated: boolean;
    isLoading: boolean;
  }>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const updateAuthState = (updates: Partial<typeof state>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      console.log('[Auth] State updated:', newState);
      return newState;
    });
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('[Auth] Loading user...');
        const user = await authApi.getCurrentUser();
        updateAuthState({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        });
      } catch (error) {
        console.error('[Auth] Failed to load user:', error);
        updateAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      updateAuthState({ isLoading: true });
      const user = await authApi.signIn({ email, password });
      updateAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      toast.success('Signed in successfully');
      router.push('/');
    } catch (error: any) {
      updateAuthState({ isLoading: false });
      toast.error(error.message || 'Failed to sign in');
      throw error;
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      updateAuthState({ isLoading: true });
      await authApi.signUp({ name, email, password });
      updateAuthState({ isLoading: false });
      toast.success('Account created successfully! Please sign in.');
      router.push('/auth/sign-in');
    } catch (error: any) {
      updateAuthState({ isLoading: false });
      toast.error(error.message || 'Failed to create account');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      updateAuthState({ isLoading: true });
      await authApi.signOut();
      updateAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      toast.success('Signed out successfully');
      router.push('/auth/sign-in');
    } catch (error: any) {
      console.error('Sign out error:', error);
      updateAuthState({ isLoading: false });
      toast.error(error.message || 'Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
