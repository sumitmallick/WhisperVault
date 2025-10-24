"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, Input } from "@/components/ui";

export default function SignInPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signIn(email, password);
    setLoading(false);
    router.push("/");
  }

  return (
    <div className="space-y-4 max-w-sm">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm text-zinc-400">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm text-zinc-400">Password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
      </form>
    </div>
  );
}