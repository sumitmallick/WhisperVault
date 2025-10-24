"use client";

import SubmitForm from "@/components/submit-form";

export default function SubmitPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Submit a confession</h1>
      <div className="mt-6">
        <SubmitForm />
      </div>
    </main>
  );
}