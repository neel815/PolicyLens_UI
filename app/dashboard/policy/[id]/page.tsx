'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch, isAuthenticated } from '@/lib/auth';
import { Button } from '@/components/Button';

interface PolicyDetail {
  id: number;
  user_id: number;
  file_name: string;
  policy_type: string;
  covered_events: string[];
  exclusions: string[];
  risky_clauses: string[];
  coverage_score: number;
  score_reason: string;
  analysis?: Record<string, any>;
  created_at: string;
}

interface SimulationRecord {
  id: number;
  policy_id: number;
  scenario: string;
  coverage_result: boolean;
  explanation: string;
  created_at: string;
}

function PolicyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const policyId = params.id as string;

  const [policy, setPolicy] = useState<PolicyDetail | null>(null);
  const [simulations, setSimulations] = useState<SimulationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);

    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchPolicy = async () => {
      try {
        const response = await apiFetch(`/api/policies/${policyId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Failed to fetch policy');
        }

        const data = await response.json();
        setPolicy(data);

        // Try to fetch simulations for this policy
        const simResponse = await apiFetch(`/api/policies/${policyId}/simulations`);

        if (simResponse.ok) {
          const simData = await simResponse.json();
          setSimulations(Array.isArray(simData) ? simData : simData.simulations || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load policy');
      } finally {
        setLoading(false);
      }
    };

    if (policyId) {
      fetchPolicy();
    }
  }, [policyId, router]);

  const handleDelete = async () => {
    try {
      const response = await apiFetch(`/api/policies/${policyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to delete policy');
      }
    } catch (err) {
      alert('Error deleting policy');
    }
  };

  const formatAnalysisValue = (value: any, depth = 0): string => {
    if (Array.isArray(value)) {
      return value.map((item, idx) => `${'\u00A0'.repeat(depth * 2)}• ${item}`).join('\n');
    }
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value).map(([key, val]) => {
        const formattedKey = key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1);
        return `${'\u00A0'.repeat(depth * 2)}${formattedKey}: ${formatAnalysisValue(val, depth + 1)}`;
      }).join('\n');
    }
    return String(value);
  };

  const renderAnalysisItem = (key: string, value: any) => {
    const formattedKey = key.replace(/_/g, ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    if (Array.isArray(value)) {
      return (
        <div key={key} className="mb-4">
          <div className="font-medium text-foreground mb-2">{formattedKey}</div>
          <ul className="ml-4 space-y-1">
            {value.map((item: any, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                <span className="text-muted-foreground flex-shrink-0 mt-0.5">•</span>
                <span>{String(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    
    if (typeof value === 'object' && value !== null) {
      return (
        <div key={key} className="mb-4">
          <div className="font-medium text-foreground mb-2">{formattedKey}</div>
          <div className="ml-4 space-y-2">
            {Object.entries(value).map(([k, v]: [string, any]) => (
              <div key={k}>
                <div className="text-foreground font-medium text-[12px]">{k.replace(/_/g, ' ')}</div>
                <div className="text-muted-foreground text-[13px] ml-2">{String(v)}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div key={key} className="mb-4">
        <div className="font-medium text-foreground mb-1">{formattedKey}</div>
        <div className="text-muted-foreground text-[13px] ml-4">{String(value)}</div>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getPolicyIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'auto':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm11 0c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm2.5-7h-11v-2h11v2z" />
          </svg>
        );
      case 'home':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        );
      case 'life':
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

  if (loading) {
  if (loading) {
    return null; // PageLoader handles global loading state
  }
    return (
      <div className="min-h-screen bg-background font-[family-name:var(--font-sans)]">
        <div className="max-w-[960px] mx-auto px-6 py-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
            <h2 className="font-[family-name:var(--font-serif)] text-[24px] text-red-600 dark:text-red-400 tracking-[-0.5px] mb-2">
              Policy not found
            </h2>
            <p className="text-[14px] text-muted-foreground mb-6">
              {error || 'The policy you are looking for does not exist.'}
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-primary text-white text-[14px] font-medium px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number): { text: string; bg: string; label: string } => {
    if (score >= 8) return { text: '#ffffff', bg: '#059669', label: 'Excellent' };
    if (score >= 6) return { text: '#ffffff', bg: '#1A3FBE', label: 'Good' };
    if (score >= 4) return { text: '#ffffff', bg: '#D97706', label: 'Fair' };
    return { text: '#ffffff', bg: '#DC2626', label: 'Poor' };
  };

  const scoreColor = getScoreColor(policy.coverage_score);

  return (
    <div className="min-h-screen bg-background font-[family-name:var(--font-sans)]">
      {/* Header with Back Button */}
      <div className="max-w-[960px] mx-auto px-6 pt-8 pb-6">
        <Link
          href="/dashboard"
          style={{ color: isDarkMode ? '#ffffff' : '#000000' }}
          className="text-[14px] font-medium hover:underline flex items-center gap-2 mb-6 w-fit"
        >
          ← Back to Dashboard
        </Link>

        {/* Policy Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-muted-foreground flex-shrink-0">
              {getPolicyIcon(policy.policy_type)}
            </div>
            <div>
              <h1 
                className="font-[family-name:var(--font-serif)] text-[36px] tracking-[-0.8px]"
                style={{ color: isDarkMode ? '#ffffff' : '#000000' }}
              >
                {policy.policy_type} Insurance
              </h1>
              <p 
                className="text-[14px] mt-2"
                style={{ color: isDarkMode ? '#e5e7eb' : '#666666' }}
              >
                {policy.file_name} · Analyzed {formatDate(policy.created_at)}
              </p>
            </div>
          </div>

          {/* Score Card - Large */}
          <div
            className="px-6 py-4 rounded-2xl text-center flex-shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]"
            style={{ backgroundColor: scoreColor.bg }}
          >
            <div className="text-[14px] text-[#ffffff] mb-1">Coverage Score</div>
            <div className="text-[40px] font-bold" style={{ color: scoreColor.text }}>
              {policy.coverage_score}/10
            </div>
            <div className="text-[12px] mt-1" style={{ color: scoreColor.text }}>
              {scoreColor.label}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/simulate?id=${policy.id}`}
            style={{
              backgroundColor: isDarkMode ? '#ffffff' : '#000000',
              color: isDarkMode ? '#000000' : '#ffffff',
            }}
            className="inline-flex items-center gap-2 text-[14px] font-medium px-5 py-2.5 rounded-xl hover:shadow-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Run Simulation
          </Link>
          <button
            onClick={() => setDeleteConfirm(true)}
            style={{
              backgroundColor: isDarkMode ? '#ffffff' : '#000000',
              color: isDarkMode ? '#000000' : '#ffffff',
            }}
            className="inline-flex items-center gap-2 text-[14px] font-medium px-5 py-2.5 rounded-xl hover:shadow-lg transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="modal-card-enhanced w-full max-w-sm p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Delete policy?</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  This action cannot be undone. All associated simulations will be deleted.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" fullWidth onClick={() => setDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" fullWidth onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[960px] mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Analysis Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Score Reason Card */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              <h2 
                className="font-[family-name:var(--font-serif)] text-[20px] tracking-[-0.4px] mb-4"
                style={{ color: isDarkMode ? '#ffffff' : '#000000' }}
              >
                Score Breakdown
              </h2>
              <p 
                className="text-[14px] leading-relaxed"
                style={{ color: isDarkMode ? '#d1d5db' : '#333333' }}
              >
                {policy.score_reason}
              </p>
            </div>

            {/* Covered Events */}
            {policy.covered_events && policy.covered_events.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                <h2 className="font-[family-name:var(--font-serif)] text-[20px] tracking-[-0.4px] text-foreground mb-4">
                  ✓ Covered Events
                </h2>
                <div className="space-y-2">
                  {policy.covered_events.map((event, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-[14px] text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </div>
                      <span>{event}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exclusions */}
            {policy.exclusions && policy.exclusions.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                <h2 className="font-[family-name:var(--font-serif)] text-[20px] tracking-[-0.4px] text-foreground mb-4">
                  ✗ Exclusions
                </h2>
                <div className="space-y-2">
                  {policy.exclusions.map((exclusion, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-[14px] text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </div>
                      <span>{exclusion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risky Clauses */}
            {policy.risky_clauses && policy.risky_clauses.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                <h2 className="font-[family-name:var(--font-serif)] text-[20px] tracking-[-0.4px] text-foreground mb-4">
                  ⚠️ Risky Clauses
                </h2>
                <div className="space-y-2">
                  {policy.risky_clauses.map((clause, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-[14px] text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                        </svg>
                      </div>
                      <span>{clause}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full AI Analysis (if available in JSONB) */}
            {policy.analysis && Object.keys(policy.analysis).length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-6 h-6 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 5h16v2H4V5m0 4h16v2H4V9m0 4h16v2H4v-2m0 4h16v2H4v-2z" />
                    </svg>
                  </div>
                  <h2 className="font-[family-name:var(--font-serif)] text-[20px] tracking-[-0.4px] text-foreground">
                    Full Analysis Report
                  </h2>
                </div>
                <div className="bg-secondary rounded-xl p-6 space-y-4 max-h-[500px] overflow-y-auto">
                  {Object.entries(policy.analysis).map(([key, value]) => renderAnalysisItem(key, value))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Simulations */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm sticky top-8">
              <h2 className="font-[family-name:var(--font-serif)] text-[20px] tracking-[-0.4px] text-foreground mb-6">
                Simulations
              </h2>

              {simulations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-[13px] text-muted-foreground mb-4">
                    No simulations yet. Run a scenario to test coverage.
                  </p>
                  <Link
                    href={`/simulate?id=${policy.id}`}
                    className="text-[12px] text-primary font-medium hover:underline"
                  >
                    Run Simulation →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {simulations.map((sim) => (
                    <div
                      key={sim.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        sim.coverage_result
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-400'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-400'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {sim.coverage_result ? (
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg
                              className="w-3 h-3 text-green-600"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg
                              className="w-3 h-3 text-red-600"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-[12px] font-medium text-foreground">
                            {sim.coverage_result ? 'Covered' : 'Not Covered'}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {new Date(sim.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-[12px] text-muted-foreground mb-1 font-medium">Scenario:</div>
                      <div className="text-[11px] text-muted-foreground mb-2">{sim.scenario}</div>
                      <div className="text-[12px] text-muted-foreground mb-1 font-medium">Explanation:</div>
                      <div className="text-[11px] text-muted-foreground">{sim.explanation}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border text-center py-6 text-xs text-muted-foreground">
        PolicyLens v1.0.0 · AI-Powered Insurance Policy Analysis · Built with FastAPI + Next.js
      </footer>
    </div>
  );
}

export default PolicyDetailPage;
