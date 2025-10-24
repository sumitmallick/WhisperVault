"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

type Confession = {
  id: number;
  gender: string;
  age: number;
  content: string;
  status: "approved" | "blocked" | "pending_moderation" | string;
};

export default function SubmitForm() {
  const { user } = useAuth();
  const [gender, setGender] = useState("female");
  const [age, setAge] = useState<number>(21);
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Confession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishJob, setPublishJob] = useState<any>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch(`${API}/confessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender, age: Number(age), content, anonymous, language: "en" }),
      });
      if (!resp.ok) throw new Error(`Failed: ${resp.status}`);
      const data = (await resp.json()) as Confession;
      setResult(data);
    } catch (e: any) {
      setError(e?.message ?? "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  async function publish(platforms: string[]) {
    if (!result) return;
    setPublishLoading(true);
    setError(null);
    setPublishJob(null);
    try {
      const resp = await fetch(`${API}/publish/${result.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms }),
      });
      if (!resp.ok) throw new Error(`Publish failed: ${resp.status}`);
      const job = await resp.json();
      setPublishJob(job);
    } catch (e: any) {
      setError(e?.message ?? "Publish failed");
    } finally {
      setPublishLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg border border-zinc-800 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-zinc-400">Gender</label>
            <select
              className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/40"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="trans-woman">Transgender woman</option>
              <option value="trans-man">Transgender man</option>
              <option value="genderqueer">Genderqueer</option>
              <option value="genderfluid">Genderfluid</option>
              <option value="agender">Agender</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-zinc-400">Age</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/40"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              min={13}
              max={120}
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-zinc-400">Content</label>
          <textarea
            rows={10}
            className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/40"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your confession..."
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.currentTarget.checked)}
          />
          Post anonymously
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={submit}
            disabled={loading || !content.trim()}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>
      </div>

      {result && (
        <div className="rounded-lg border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400">
            Created #{result.id} • status{" "}
            <span
              className={
                result.status === "approved"
                  ? "text-green-400"
                  : result.status === "blocked"
                  ? "text-red-400"
                  : "text-yellow-400"
              }
            >
              {result.status}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap">{result.content}</p>

          {user && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => publish(["fb", "ig"])}
                disabled={publishLoading || result.status !== "approved"}
                className="rounded-md bg-brand px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                {publishLoading ? "Queuing..." : "Publish to FB/IG"}
              </button>
              <button
                onClick={() => publish(["x"])}
                disabled={publishLoading || result.status !== "approved"}
                className="rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
              >
                {publishLoading ? "Queuing..." : "Publish to X"}
              </button>
            </div>
          )}

          {publishJob && user && (
            <p className="mt-2 text-sm text-zinc-400">
              Publish job queued: id {publishJob.id}. Check Jobs page.
            </p>
          )}
        </div>
      )}
    </div>
  );
}