import "./globals.css";
import type { Metadata } from "next";
import { clsx } from "clsx";
import { Providers } from "./providers";
import NavAuth from "@/components/nav-auth";
import NavLinks from "@/components/nav-links";

export const metadata: Metadata = {
  title: "Confessions",
  description: "Anonymous confessions, safely moderated",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={clsx("min-h-screen bg-zinc-950 text-zinc-100")}>
        <Providers>
          <header className="border-b border-zinc-800">
            <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
              <a href="/" className="text-xl font-semibold text-brand">Confessions</a>
              <nav className="flex items-center gap-4 text-sm">
                <NavLinks />
                <NavAuth />
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}