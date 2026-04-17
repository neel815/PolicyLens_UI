'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { isAuthenticated, logout, getUser } from '@/lib/auth';
import { Shield, Sun, Moon, LogOut, Menu, X } from 'lucide-react';
import { Button } from './Button';

const navLinks = [
  { label: "Analyze", path: "/" },
  { label: "Battle", path: "/battle" },
  { label: "Dashboard", path: "/dashboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, [pathname]);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
    setMounted(true);
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    const isDarkNow = html.classList.contains('dark');
    
    if (isDarkNow) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    
    const newIsDark = !isDarkNow;
    setIsDark(newIsDark);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { isDark: newIsDark } }));
  };

  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center group-hover:shadow-lg transition-shadow">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-base font-semibold text-foreground">PolicyLens</span>
              <span className="text-[10px] font-medium text-primary">AI Analysis</span>
            </div>
          </Link>

          {/* Navigation Links */}
          {authed && (
            <div className="hidden md:flex items-center gap-2">
              {navLinks.map(({ label, path }) => (
                <Link
                  key={path}
                  href={path}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive(path)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
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

            {authed && (
              <>
                <div className="hidden md:block h-6 w-px bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  leftIcon={<LogOut className="w-4 h-4" />}
                >
                  Logout
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            {authed && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {authed && mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-2">
            {navLinks.map(({ label, path }) => (
              <Link
                key={path}
                href={path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(path)
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
