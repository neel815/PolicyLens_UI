'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveToken, saveUser } from '@/lib/auth';

interface RegisterFormData {
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
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
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    // Validate full name
    if (formData.full_name.trim().length < 2) {
      setError('Full name must be at least 2 characters');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      // Generate username from email (part before @)
      const username = formData.email.split('@')[0];
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          email: formData.email,
          full_name: formData.full_name,
          password: formData.password,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.detail || 'Registration failed');
      }

      // Save token and user info
      saveToken(json.access_token);
      saveUser(json.user);

      // Redirect to home
      router.push('/');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
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
          <p className="text-[14px] text-[#6B7280]">Create an account to get started</p>
        </div>

        {/* Register Form Card */}
        <div className="bg-white border border-[#E5E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name Field */}
            <div>
              <label className="text-[13px] font-medium text-[#0F1117] mb-2 block">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Your Full Name"
                required
                className="w-full px-4 py-2.5 bg-[#F7F6F2] border border-[#E5E3DC] rounded-lg text-[14px] text-[#0F1117] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1A3FBE] transition-colors"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="text-[13px] font-medium text-[#0F1117] mb-2 block">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
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
                placeholder="at least 8 characters"
                required
                minLength={8}
                className="w-full px-4 py-2.5 bg-[#F7F6F2] border border-[#E5E3DC] rounded-lg text-[14px] text-[#0F1117] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1A3FBE] transition-colors"
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="text-[13px] font-medium text-[#0F1117] mb-2 block">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="confirm password"
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
              className="w-full bg-[#1A3FBE] text-white rounded-lg py-2.5 text-[14px] font-medium transition-all duration-200 hover:bg-[#1535A8] disabled:bg-[#F0EEE8] disabled:text-[#9CA3AF] disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-[13px] text-[#6B7280]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#1A3FBE] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
