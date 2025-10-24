"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

type PublishJob = {
  id: number;
  confession_id: number;
  platforms_csv: string;
  asset_path?: string | null;
  status: string;
  error?: string | null;
  created_at: string;
  updated_at: string;
};

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<PublishJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string>("");
  const [selectedJob, setSelectedJob] = useState<PublishJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = !!user && user.role === "admin";

  async function loadRecent() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/publish/jobs?limit=20`, { cache: "no-store" });
      if (!res.ok) throw new Error(`List failed: ${res.status}`);
      const data = await res.json();
      setJobs(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) loadRecent();
  }, [isAdmin]);

  async function fetchJob() {
    if (!jobId.trim()) return;
    setLoading(true);
    setError(null);
    setSelectedJob(null);
    try {
      const res = await fetch(`${API}/publish/jobs/${jobId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      setSelectedJob(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to fetch job");
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Publish jobs</h1>
        <p className="text-sm text-zinc-400">You don't have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Publish jobs</h1>

      <div className="rounded-lg border border-zinc-800 p-4 space-y-3">
        <div className="text-sm text-zinc-400">Lookup a job by ID</div>
        <div className="flex gap-2">
          <Input placeholder="Job ID" value={jobId} onChange={(e) => setJobId(e.target.value)} />
          <Button onClick={fetchJob} disabled={loading || !jobId.trim()}>
            {loading ? "Loading..." : "Fetch"}
          </Button>
        </div>
        {error && <div className="text-sm text-red-400">{error}</div>}
        {selectedJob && (
          <div className="rounded-md border border-zinc-800 p-3">
            <div className="text-sm text-zinc-400">Job #{selectedJob.id}</div>
            <div className="text-sm">Confession: {selectedJob.confession_id}</div>
            <div className="text-sm">Platforms: {selectedJob.platforms_csv}</div>
            <div className="text-sm">
              Status:{" "}
              <span
                className={
                  selectedJob.status === "completed"
                    ? "text-green-400"
                    : selectedJob.status === "failed"
                    ? "text-red-400"
                    : "text-yellow-400"
                }
              >
                {selectedJob.status}
              </span>
            </div>
            {selectedJob.asset_path && (
              <div className="text-sm truncate">Image: {selectedJob.asset_path}</div>
            )}
            {selectedJob.error && <div className="text-sm text-red-400">Error: {selectedJob.error}</div>}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-zinc-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-400">Recent jobs</div>
          <Button className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700" onClick={loadRecent} disabled={loading}>
            Refresh
          </Button>
        </div>
        <div className="space-y-3">
          {jobs.length === 0 && <div className="text-sm text-zinc-400">No jobs yet.</div>}
          {jobs.map((j) => (
            <div key={j.id} className="rounded-md border border-zinc-800 p-3">
              <div className="text-sm text-zinc-400">Job #{j.id}</div>
              <div className="text-sm">Confession: {j.confession_id}</div>
              <div className="text-sm">Platforms: {j.platforms_csv}</div>
              <div className="text-sm">
                Status:{" "}
                <span
                  className={
                    j.status === "completed"
                      ? "text-green-400"
                      : j.status === "failed"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }
                >
                  {j.status}
                </span>
              </div>
              {j.asset_path && <div className="text-sm truncate">Image: {j.asset_path}</div>}
              {j.error && <div className="text-sm text-red-400">Error: {j.error}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
