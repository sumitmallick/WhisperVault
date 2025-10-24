import * as React from "react";
import { clsx } from "clsx";

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-md bg-brand px-3 py-2 text-sm font-medium text-black",
        "hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/50 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100",
        "placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand/40",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100",
        "placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand/40",
        className
      )}
      {...props}
    />
  );
}

export function Checkbox({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input type="checkbox" className={clsx("h-4 w-4 accent-brand", className)} {...props} />
  );
}
