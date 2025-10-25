"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export default function NavLinks() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/about" className="hover:underline">About</Link>
        <Link href="/submit" className="hover:underline">Submit</Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link href="/" className="hover:underline">Home</Link>
      <Link href="/about" className="hover:underline">About</Link>
      <Link href="/submit" className="hover:underline">Submit</Link>
      {user?.is_superuser && (
        <>
          <Link href="/jobs" className="hover:underline">Jobs</Link>
          <Link href="/admin" className="hover:underline text-orange-600 font-medium">🛡️ Admin</Link>
        </>
      )}
    </nav>
  );
}