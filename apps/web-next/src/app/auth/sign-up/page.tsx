"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, Input, Checkbox } from "@/components/ui";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [asAdmin, setAsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signUp(email, password, asAdmin);
    setLoading(false);
    router.push("/");
  }

  return (
    <div className="space-y-4 max-w-sm">
      <h1 className="text-2xl font-semibold">Sign up</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm text-zinc-400">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm text-zinc-400">Password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <Checkbox checked={asAdmin} onChange={(e) => setAsAdmin(e.currentTarget.checked)} />
          Register as admin (demo)
        </label>
        <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
      </form>
    </div>
  );
}