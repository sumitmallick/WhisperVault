"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function NavLinks() {
  const { user } = useAuth();

  if (!user) {
    return (
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/submit" className="hover:underline">Submit</Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link href="/" className="hover:underline">Home</Link>
      <Link href="/submit" className="hover:underline">Submit</Link>
      <Link href="/jobs" className="hover:underline">Jobs</Link>
    </nav>
  );
}