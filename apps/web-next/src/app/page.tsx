"use client";

import SubmitForm from "@/components/submit-form";
import { useAuth } from "@/lib/auth";

export default function Page() {
  const { user } = useAuth();

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Submit a confession</h1>
        <p className="mt-1 text-sm text-zinc-400">You are not signed in.</p>
        <div className="mt-6">
          <SubmitForm />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <p className="mt-1 text-sm text-zinc-400">You are signed in.</p>
      <div className="mt-6">
        <SubmitForm />
      </div>
    </main>
  );
}