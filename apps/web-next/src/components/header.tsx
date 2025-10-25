"use client";

import Link from "next/link";
import NavLinks from "./nav-links";
import NavAuth from "./nav-auth";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
              WhisperVault
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
            <NavLinks />
            <NavAuth />
          </div>
        </div>
      </div>
    </header>
  );
}