"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "./ui";

export default function NavAuth() {
  const { user, signOut } = useAuth();

  if (!user) {
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
        {user.email} • {user.role}
      </span>
      <Button className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700" onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}