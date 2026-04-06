'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveToken, saveUser } from '@/lib/auth';

interface LoginFormData {
  username: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.detail || 'Login failed');
      }

      // Save token and user info
      saveToken(json.access_token);
      saveUser(json.user);

      // Redirect to home/dashboard
      router.push('/');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-[family-name:var(--font-serif)] text-[42px] tracking-[-1px] text-[#0F1117] mb-2">
            PolicyLens
          </h1>
          <p className="text-[14px] text-[#6B7280]">Sign in to access your analyses</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-[#E5E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Username Field */}
            <div>
              <label className="text-[13px] font-medium text-[#0F1117] mb-2 block">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="your username"
                required
                className="w-full px-4 py-2.5 bg-[#F7F6F2] border border-[#E5E3DC] rounded-lg text-[14px] text-[#0F1117] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1A3FBE] transition-colors"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[13px] font-medium text-[#0F1117] mb-2 block">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="your password"
                required
                className="w-full px-4 py-2.5 bg-[#F7F6F2] border border-[#E5E3DC] rounded-lg text-[14px] text-[#0F1117] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1A3FBE] transition-colors"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 bg-[#FEF2F2] border border-red-200 rounded-lg p-3 text-[13px] text-[#DC2626]">
                <svg
                  className="w-[16px] h-[16px] flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A3FBE] text-white rounded-lg py-2.5 text-[14px] font-medium transition-all duration-200 hover:bg-[#1535A8] disabled:bg-[#F0EEE8] disabled:text-[#9CA3AF] disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-[13px] text-[#6B7280]">
              Don't have an account?{' '}
              <Link href="/register" className="text-[#1A3FBE] font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
