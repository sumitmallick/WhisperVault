"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "./ui/button";

export default function NavAuth() {
  const { user, signOut, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="space-x-2">
        <Link href="/auth/sign-in" className="text-sm hover:underline">Sign in</Link>
        <Link href="/auth/sign-up" className="text-sm hover:underline">Sign up</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-400">
        {user.email}
      </span>
      <Button className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700" onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}