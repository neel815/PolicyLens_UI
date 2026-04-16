'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { isAuthenticated, logout, getUser } from '@/lib/auth';
import { Shield, Sun, Moon } from 'lucide-react';

const navLinks = ["Analyze", "Battle", "Dashboard"];
const navPaths = ["/", "/battle", "/dashboard"];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, [pathname]);

  useEffect(() => {
    // Check initial dark mode preference after mount
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
    setMounted(true);
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    const isDarkNow = html.classList.contains('dark');
    
    if (isDarkNow) {
      // Switch to light
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      // Switch to dark
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    
    // Update local state to reflect the change
    const newIsDark = !isDarkNow;
    setIsDark(newIsDark);
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight font-sans">
            PolicyLens
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider">
            AI
          </span>
        </div>

        <div className="flex items-center gap-4">
          {authed && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link, idx) => (
                <Link
                  key={link}
                  href={navPaths[idx]}
                  className={`px-3 py-1.5 text-sm transition-colors rounded-md ${
                    isActive(navPaths[idx])
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {link}
                </Link>
              ))}
            </div>
          )}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Toggle dark mode"
          >
            {mounted ? (
              isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          {authed && <div className="h-5 w-px bg-border hidden md:block" />}
          {authed && (
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
