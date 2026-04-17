'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, isAuthenticated } from '@/lib/auth';

interface DashboardPolicy {
  id: number              // integer from DB (not UUID string)
  file_name: string
  file_size: string
  policy_type: string
  coverage_score: number
  created_at: string
}

export default function Dashboard() {
  const router = useRouter();
  const [policies, setPolicies] = useState<DashboardPolicy[]>([]);
  const [loading, setLoading] = useState(true)  // NEW
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    // Check auth on mount
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchPolicies();
  }, [router]);

  async function fetchPolicies() {
    setLoading(true);
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/policies`;
    console.log('📍 Fetching from:', apiUrl);
    
    try {
      const res = await apiFetch(apiUrl);
      
      // Log response status for debugging
      console.log('✅ Response status:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorData = await res.text();
        console.error('❌ API Error:', {
          status: res.status,
          statusText: res.statusText,
          body: errorData
        });
        throw new Error(`API error: ${res.status} ${res.statusText} - ${errorData}`);
      }
      
      const data = await res.json();
      console.log('✅ Data received:', data);
      setPolicies(data || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Request failed:', errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/policies/${id}`,
        { method: 'DELETE' }
      );
      setPolicies(prev => prev.filter(p => p.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  }

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number): { text: string; bg: string } => {
    if (score >= 8) return { text: '#ffffff', bg: '#059669' };
    if (score >= 6) return { text: '#ffffff', bg: '#1A3FBE' };
    if (score >= 4) return { text: '#ffffff', bg: '#D97706' };
    return { text: '#ffffff', bg: '#DC2626' };
  };

  const getScoreBarColor = (score: number): string => {
    if (score >= 8) return '#059669';
    if (score >= 6) return '#1A3FBE';
    if (score >= 4) return '#D97706';
    return '#DC2626';
  };

  const getPolicyIcon = (type: string) => {
    switch (type) {
      case 'Health':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9h-2.5V9.5h-2v3.5H8v2h3.5v3.5h2v-3.5h3.5v-2z" />
          </svg>
        );
      case 'Car':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm11 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM5 11l1.5-4.5h11L19 11H5z" />
          </svg>
        );
      case 'Home':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        );
      case 'Life':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background font-[family-name:var(--font-sans)]">
      {/* Header */}
      <div className="max-w-[960px] mx-auto px-6 pt-12 pb-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-[family-name:var(--font-serif)] text-[36px] tracking-[-0.8px] text-foreground">
              Your policies
            </h1>
            <p className="text-[15px] text-muted-foreground mt-1">
              {policies.length > 0
                ? `${policies.length} saved · click any card to view`
                : 'No analyses saved yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Clear All Confirmation Banner - REMOVED */}
      {showClearConfirm && (
        <div className="max-w-[960px] mx-auto px-6 mb-4">
          <div className="bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 rounded-xl p-4 flex items-center justify-between gap-4">
            <span className="text-[13px] text-red-700 dark:text-red-300">
              Remove all {policies.length} saved analyses? This cannot be undone.
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="text-[13px] text-muted-foreground px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      {!loading && policies.length > 0 && (
        <div className="max-w-[960px] mx-auto px-6 mb-8">
          <div className="grid grid-cols-3 gap-4">
            {/* Total Analyzed */}
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)]">
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-[18px] h-[18px] text-blue-700 dark:text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
                </svg>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Total analyzed</div>
                <div className="text-[18px] font-medium text-foreground">{policies.length}</div>
              </div>
            </div>

            {/* Avg Coverage Score */}
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)]">
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-[18px] h-[18px] text-blue-700 dark:text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
                </svg>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Avg coverage score</div>
                <div className="text-[18px] font-medium text-foreground">
                  {(policies.reduce((sum, p) => sum + p.coverage_score, 0) / policies.length).toFixed(1)}/10
                </div>
              </div>
            </div>

            {/* Latest Analysis */}
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)]">
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-[18px] h-[18px] text-blue-700 dark:text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Latest analysis</div>
                <div className="text-[18px] font-medium text-foreground truncate">{formatDate(policies[0]?.created_at || '')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Policy Cards Grid or Empty State */}
      {loading && (
        <div className="flex items-center justify-center py-24 max-w-[960px] mx-auto px-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-border border-t-blue-700 dark:border-t-blue-300 animate-spin"/>
            <p className="text-[14px] text-muted-foreground">Loading policies...</p>
          </div>
        </div>
      )}

      {!loading && policies.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-24 text-center max-w-[960px] mx-auto px-6">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-[28px] h-[28px] text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
            </svg>
          </div>
          <h2 className="font-[family-name:var(--font-serif)] text-[24px] text-foreground tracking-[-0.5px] mb-2">
            No policies analyzed yet
          </h2>
          <p className="text-[14px] text-muted-foreground mb-6 max-w-[280px]">
            Upload an insurance PDF on the home page to see your analysis here.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-[14px] font-medium px-5 py-2.5 rounded-xl hover:opacity-90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
            </svg>
            Analyze your first policy
          </Link>
        </div>
      ) : !loading && (
        // Policy Cards Grid
        <div className="max-w-[960px] mx-auto px-6 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {policies.map((policy) => {
              const scoreColor = getScoreColor(policy.coverage_score);
              const scoreBarColor = getScoreBarColor(policy.coverage_score);

              return (
                <Link
                  key={policy.id}
                  href={deleteConfirm === policy.id ? '#' : `/dashboard/policy/${policy.id}`}
                  onClick={(e) => deleteConfirm === policy.id && e.preventDefault()}
                  className="relative bg-card border border-border rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)] overflow-hidden group transition-all duration-200 hover:shadow-[0_4px_6px_rgba(0,0,0,0.05),0_12px_32px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_6px_rgba(0,0,0,0.3),0_12px_32px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 cursor-pointer block"
                >
                  {/* Score Bar */}
                  <div
                    className="h-1 w-full"
                    style={{ backgroundColor: scoreBarColor }}
                  />

                  {deleteConfirm === policy.id ? (
                    // Delete Confirmation
                    <div className="bg-red-100 dark:bg-red-950 border-t border-red-300 dark:border-red-800 p-3 flex items-center gap-2">
                      <span className="text-[12px] text-red-700 dark:text-red-300 flex-1">Delete this analysis?</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(policy.id);
                        }}
                        className="text-[12px] font-medium text-white bg-red-700 dark:bg-red-600 px-3 py-1 rounded-lg hover:bg-red-800 dark:hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(null);
                        }}
                        className="text-[12px] text-muted-foreground px-3 py-1 rounded-lg hover:bg-secondary transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    // Card Content
                    <div className="p-5">
                      {/* Row 1: Icon + Type + Score */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground">
                            {getPolicyIcon(policy.policy_type)}
                          </div>
                          <div>
                            <div className="text-[13px] font-medium text-foreground">{policy.policy_type} Insurance</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{formatDate(policy.created_at)}</div>
                          </div>
                        </div>
                        <div
                          className="text-[13px] font-semibold px-2.5 py-1 rounded-lg"
                          style={{ color: scoreColor.text, backgroundColor: scoreColor.bg }}
                        >
                          {policy.coverage_score}/10
                        </div>
                      </div>

                      {/* Row 2: File name */}
                      <div className="text-[12px] text-muted-foreground mb-4 truncate flex items-center gap-1.5">
                        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 16H5V4h14v14z" />
                        </svg>
                        {policy.file_name}
                      </div>

                      {/* Row 3: Mini Footer */}
                      <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteConfirm(policy.id);
                          }}
                          className="text-[12px] text-muted-foreground hover:text-red-700 dark:hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/simulate?id=${policy.id}`;
                          }}
                          className="text-[12px] text-primary font-medium hover:underline flex items-center gap-1"
                        >
                          Simulate →
                        </button>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border text-center py-6 text-xs text-muted-foreground">
        PolicyLens v1.0.0 · AI-Powered Insurance Policy Analysis · Built with FastAPI + Next.js
      </footer>
    </div>
  );
}
