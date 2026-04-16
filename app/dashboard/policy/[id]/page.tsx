'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch, isAuthenticated } from '@/lib/auth';

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

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchPolicy = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        const response = await apiFetch(`${apiUrl}/api/policies/${policyId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Failed to fetch policy');
        }

        const data = await response.json();
        setPolicy(data);

        // Try to fetch simulations for this policy
        const simResponse = await apiFetch(`${apiUrl}/api/policies/${policyId}/simulations`);

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await apiFetch(`${apiUrl}/api/policies/${policyId}`, {
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
          <div className="font-medium text-[#0F1117] mb-2">{formattedKey}</div>
          <ul className="ml-4 space-y-1">
            {value.map((item: any, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-[13px] text-[#6B7280]">
                <span className="text-[#9CA3AF] flex-shrink-0 mt-0.5">•</span>
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
          <div className="font-medium text-[#0F1117] mb-2">{formattedKey}</div>
          <div className="ml-4 space-y-2">
            {Object.entries(value).map(([k, v]: [string, any]) => (
              <div key={k}>
                <div className="text-[#0F1117] font-medium text-[12px]">{k.replace(/_/g, ' ')}</div>
                <div className="text-[#6B7280] text-[13px] ml-2">{String(v)}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div key={key} className="mb-4">
        <div className="font-medium text-[#0F1117] mb-1">{formattedKey}</div>
        <div className="text-[#6B7280] text-[13px] ml-4">{String(value)}</div>
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
    return (
      <div className="min-h-screen bg-[#F7F6F2] font-[family-name:var(--font-sans)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#E5E3DC] border-t-[#1A3FBE] animate-spin" />
          <p className="text-[14px] text-[#6B7280]">Loading policy...</p>
        </div>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="min-h-screen bg-[#F7F6F2] font-[family-name:var(--font-sans)]">
        <div className="max-w-[960px] mx-auto px-6 py-12">
          <div className="bg-[#FEE2E2] border border-red-200 rounded-2xl p-8 text-center">
            <h2 className="font-[family-name:var(--font-serif)] text-[24px] text-[#DC2626] tracking-[-0.5px] mb-2">
              Policy not found
            </h2>
            <p className="text-[14px] text-[#9CA3AF] mb-6">
              {error || 'The policy you are looking for does not exist.'}
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-[#1A3FBE] text-white text-[14px] font-medium px-5 py-2.5 rounded-xl hover:bg-[#1535A8] transition-colors"
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
    <div className="min-h-screen bg-[#F7F6F2] font-[family-name:var(--font-sans)]">
      {/* Header with Back Button */}
      <div className="max-w-[960px] mx-auto px-6 pt-8 pb-6">
        <Link
          href="/dashboard"
          className="text-[14px] text-[#1A3FBE] font-medium hover:underline flex items-center gap-2 mb-6 w-fit"
        >
          ← Back to Dashboard
        </Link>

        {/* Policy Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#F0EEE8] rounded-2xl flex items-center justify-center text-[#6B7280] flex-shrink-0">
              {getPolicyIcon(policy.policy_type)}
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-serif)] text-[36px] tracking-[-0.8px] text-[#0F1117]">
                {policy.policy_type} Insurance
              </h1>
              <p className="text-[14px] text-[#6B7280] mt-2">
                {policy.file_name} · Analyzed {formatDate(policy.created_at)}
              </p>
            </div>
          </div>

          {/* Score Card - Large */}
          <div
            className="px-6 py-4 rounded-2xl text-center flex-shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]"
            style={{ backgroundColor: scoreColor.bg }}
          >
            <div className="text-[14px] text-[#6B7280] mb-1">Coverage Score</div>
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
            className="inline-flex items-center gap-2 bg-[#1A3FBE] text-white text-[14px] font-medium px-5 py-2.5 rounded-xl hover:bg-[#1535A8] transition-colors"
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
            className="inline-flex items-center gap-2 bg-[#FEE2E2] text-[#DC2626] text-[14px] font-medium px-5 py-2.5 rounded-xl hover:bg-[#FEE2E2]/70 transition-colors"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-[400px] shadow-2xl">
            <h2 className="font-[family-name:var(--font-serif)] text-[24px] tracking-[-0.5px] text-[#0F1117] mb-2">
              Delete policy?
            </h2>
            <p className="text-[14px] text-[#6B7280] mb-6">
              This will permanently remove this policy and all associated simulations. This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="text-[14px] text-[#6B7280] font-medium px-5 py-2.5 rounded-xl hover:bg-[#F0EEE8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="text-[14px] text-white font-medium px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] transition-colors"
              >
                Delete
              </button>
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
            <div className="bg-white border border-[#E5E3DC] rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
              <h2 className="font-[family-name:var(--font-serif)] text-[20px] tracking-[-0.4px] text-[#0F1117] mb-4">
                Score Breakdown
              </h2>
              <p className="text-[14px] text-[#6B7280] leading-relaxed">{policy.score_reason}</p>
            </div>

            {/* Covered Events */}
            {policy.covered_events && policy.covered_events.length > 0 && (
              <div className="bg-white border border-[#E5E3DC] rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
                <h2 className="font-[family-name:var(--font-serif)] text-[20px] tracking-[-0.4px] text-[#0F1117] mb-4">
                  ✓ Covered Events
                </h2>
                <div className="space-y-2">
                  {policy.covered_events.map((event, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-[14px] text-[#6B7280]">
                      <div className="w-5 h-5 rounded-full bg-[#D1FAE5] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-[#047857]" fill="currentColor" viewBox="0 0 24 24">
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
              <div className="bg-white border border-[#E5E3DC] rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
                <h2 className="font-[family-name:var(--font-serif)] text-[20px] tracking-[-0.4px] text-[#0F1117] mb-4">
                  ✗ Exclusions
                </h2>
                <div className="space-y-2">
                  {policy.exclusions.map((exclusion, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-[14px] text-[#6B7280]">
                      <div className="w-5 h-5 rounded-full bg-[#FEE2E2] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-[#DC2626]" fill="currentColor" viewBox="0 0 24 24">
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
              <div className="bg-white border border-[#E5E3DC] rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
                <h2 className="font-[family-name:var(--font-serif)] text-[20px] tracking-[-0.4px] text-[#0F1117] mb-4">
                  ⚠️ Risky Clauses
                </h2>
                <div className="space-y-2">
                  {policy.risky_clauses.map((clause, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-[14px] text-[#6B7280]">
                      <div className="w-5 h-5 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-[#B45309]" fill="currentColor" viewBox="0 0 24 24">
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
              <div className="bg-white border border-[#E5E3DC] rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-6 h-6 bg-[#EEF2FF] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#1A3FBE]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 5h16v2H4V5m0 4h16v2H4V9m0 4h16v2H4v-2m0 4h16v2H4v-2z" />
                    </svg>
                  </div>
                  <h2 className="font-[family-name:var(--font-serif)] text-[20px] tracking-[-0.4px] text-[#0F1117]">
                    Full Analysis Report
                  </h2>
                </div>
                <div className="bg-[#F9FAFB] rounded-xl p-6 space-y-4 max-h-[500px] overflow-y-auto">
                  {Object.entries(policy.analysis).map(([key, value]) => renderAnalysisItem(key, value))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Simulations */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-[#E5E3DC] rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] sticky top-8">
              <h2 className="font-[family-name:var(--font-serif)] text-[20px] tracking-[-0.4px] text-[#0F1117] mb-6">
                Simulations
              </h2>

              {simulations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-[#F0EEE8] rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-[#9CA3AF]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-[13px] text-[#6B7280] mb-4">
                    No simulations yet. Run a scenario to test coverage.
                  </p>
                  <Link
                    href={`/simulate?id=${policy.id}`}
                    className="text-[12px] text-[#1A3FBE] font-medium hover:underline"
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
                          ? 'bg-[#F0FDF4] border-green-400'
                          : 'bg-[#FEF2F2] border-red-400'
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
                          <div className="text-[12px] font-medium text-[#0F1117]">
                            {sim.coverage_result ? 'Covered' : 'Not Covered'}
                          </div>
                          <div className="text-[11px] text-[#6B7280] mt-0.5">
                            {new Date(sim.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-[12px] text-[#6B7280] mb-1 font-medium">Scenario:</div>
                      <div className="text-[11px] text-[#6B7280] mb-2">{sim.scenario}</div>
                      <div className="text-[12px] text-[#6B7280] mb-1 font-medium">Explanation:</div>
                      <div className="text-[11px] text-[#6B7280]">{sim.explanation}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E5E3DC] text-center py-6 text-xs text-[#9CA3AF]">
        PolicyLens v1.0.0 · AI-Powered Insurance Policy Analysis · Built with FastAPI + Next.js
      </footer>
    </div>
  );
}

export default PolicyDetailPage;
