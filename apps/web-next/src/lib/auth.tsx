"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type User = {
  email: string;
  role: "user" | "admin";
};

type AuthContextType = {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, asAdmin?: boolean) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "auth:user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const signIn = async (email: string, _password: string) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      setUser(JSON.parse(raw));
      return;
    }
    const u: User = { email, role: "user" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  };

  const signUp = async (email: string, _password: string, asAdmin = false) => {
    const u: User = { email, role: asAdmin ? "admin" : "user" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, signIn, signUp, signOut }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
