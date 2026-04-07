'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { isAuthenticated, logout, getUser } from '@/lib/auth';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    setAuthed(isAuthenticated());
    const user = getUser();
    if (user) setUserName(user.full_name || user.username);
  }, [pathname]);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-[#F7F6F2]/85 backdrop-blur-md border-b border-[#E5E3DC] h-[60px] px-8 flex items-center justify-between">
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#1A3FBE] rounded-lg flex items-center justify-center">
          <svg
            className="w-[18px] h-[18px] text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <span className="font-[family-name:var(--font-serif)] text-xl text-[#0F1117]">
          PolicyLens
        </span>
        <span className="text-[#1A3FBE] bg-[#EEF2FF] text-[11px] font-medium px-2 py-0.5 rounded-full">
          AI
        </span>
      </div>

      {/* Right: Nav Links */}
      <div className="flex items-center gap-6">
        {authed && (
          <>
            <Link
              href="/"
              className={`text-[13px] font-medium transition-colors ${
                isActive('/') 
                  ? 'text-[#0F1117]' 
                  : 'text-[#6B7280] hover:text-[#0F1117]'
              }`}
            >
              Analyze
            </Link>
            <Link
              href="/battle"
              className={`text-[13px] font-medium transition-colors ${
                isActive('/battle') 
                  ? 'text-[#0F1117]' 
                  : 'text-[#6B7280] hover:text-[#0F1117]'
              }`}
            >
              Battle
            </Link>
            <Link
              href="/dashboard"
              className={`text-[13px] font-medium transition-colors ${
                isActive('/dashboard') 
                  ? 'text-[#0F1117]' 
                  : 'text-[#6B7280] hover:text-[#0F1117]'
              }`}
            >
              Dashboard
            </Link>
          </>
        )}
        {authed ? (
          <div className="flex items-center gap-4 pl-4 border-l border-[#E5E3DC]">
            <span className="text-[13px] text-[#6B7280]">
              Hi, {userName}
            </span>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="text-[13px] text-[#DC2626] hover:text-[#B91C1C] font-medium cursor-pointer transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-[13px] text-[#1A3FBE] font-medium"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
