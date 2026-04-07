'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, isAuthenticated } from '@/lib/auth';
import { SimulateResult } from '@/types/analysis';

interface SimulatePolicy {
  id: number
  file_name: string
  file_size: string
  policy_type: string
  coverage_score: number
  covered_events: string[]
  exclusions: string[]
  risky_clauses: string[]
  score_reason?: string
  created_at: string
}

export default function SimulatePage() {
  const [scenario, setScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setSimulateResult] = useState<SimulateResult | null>(null);
  const [error, setError] = useState('');
  const [policies, setPolicies] = useState<SimulatePolicy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<SimulatePolicy | null>(null);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Check auth on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadPolicies();
  }, [router]);

  async function loadPolicies() {
    setLoadingPolicies(true);
    try {
      // First get list of policies
      const listRes = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/policies`
      );
      if (!listRes.ok) throw new Error('Failed to load policies');
      const list = await listRes.json();
      setPolicies(list);

      // Get id from URL
      const urlId = searchParams.get('id');
      if (urlId) {
        // Fetch full policy details (includes covered_events etc)
        const detailRes = await apiFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/policies/${urlId}`
        );
        if (detailRes.ok) {
          const detail = await detailRes.json();
          setSelectedPolicy(detail);
        } else if (list.length > 0) {
          // Fallback: fetch first policy details
          const fallbackRes = await apiFetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/policies/${list[0].id}`
          );
          if (fallbackRes.ok) setSelectedPolicy(await fallbackRes.json());
        }
      } else if (list.length > 0) {
        const fallbackRes = await apiFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/policies/${list[0].id}`
        );
        if (fallbackRes.ok) setSelectedPolicy(await fallbackRes.json());
      }
    } catch (err) {
      console.error('Failed to load policies:', err);
    } finally {
      setLoadingPolicies(false);
    }
  }

  const handleSimulate = async () => {
    if (!scenario || scenario.trim().length < 10) {
      setError('Please describe your scenario in at least 10 characters.');
      return;
    }

    if (!selectedPolicy) {
      setError('No policy selected.');
      return;
    }

    setLoading(true);
    setError('');
    setSimulateResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await apiFetch(`${apiUrl}/api/simulate-claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario: scenario.trim(),
          policy_id: selectedPolicy.id,
          analysis: {
            covered_events: selectedPolicy.covered_events,
            exclusions: selectedPolicy.exclusions,
            risky_clauses: selectedPolicy.risky_clauses,
            coverage_score: selectedPolicy.coverage_score,
            policy_type: selectedPolicy.policy_type,
            score_reason: selectedPolicy.score_reason || ''
          },
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.detail || 'Something went wrong');
      }

      setSimulateResult(json.data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const suggestedScenarios = [
    'Hospitalization Bill',
    'Accident Recovery for Vehicle',
    'Home Appliance Damage',
  ];

  const getVerdictColor = (
    verdict: string
  ): { text: string; bg: string } => {
    switch (verdict) {
      case 'Likely Approved':
        return { text: '#059669', bg: '#ECFDF5' };
      case 'Likely Rejected':
        return { text: '#DC2626', bg: '#FEF2F2' };
      case 'Partial Coverage':
        return { text: '#D97706', bg: '#FFFBEB' };
      case 'Unclear':
        return { text: '#6B7280', bg: '#F3F4F6' };
      default:
        return { text: '#6B7280', bg: '#F3F4F6' };
    }
  };

  const getChanceColor = (
    chance: number
  ): { text: string; border: string } => {
    if (chance >= 70) return { text: '#059669', border: '#059669' };
    if (chance >= 40) return { text: '#D97706', border: '#D97706' };
    return { text: '#DC2626', border: '#DC2626' };
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      <main className="max-w-[760px] mx-auto px-6 py-14 pb-20">
        {/* HEADER */}
        <Link
          href="/dashboard"
          className="text-[13px] text-[#6B7280] hover:text-[#0F1117] mb-8 inline-flex items-center gap-1 transition-colors"
        >
          ← Back
        </Link>

        <h1 className="font-[family-name:var(--font-serif)] text-[36px] tracking-[-0.8px] text-[#0F1117] mb-1">
          Claim Simulator
        </h1>
        <p className="text-[15px] text-[#6B7280] mb-8">
          Describe a real situation and find out if your policy covers it.
        </p>

        {/* POLICY SELECTOR CARD */}
        <div className="bg-white border border-[#E5E3DC] rounded-2xl p-6 mb-4 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="text-[12px] text-[#9CA3AF] uppercase tracking-wide mb-3 font-medium">
            Simulating against:
          </div>

          {loadingPolicies ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-[#E5E3DC] border-t-[#1A3FBE] animate-spin"/>
                <p className="text-[13px] text-[#6B7280]">Loading policies...</p>
              </div>
            </div>
          ) : selectedPolicy ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F0EEE8] rounded-xl flex items-center justify-center text-[#6B7280] flex-shrink-0">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[13px] font-medium text-[#0F1117]">
                    {selectedPolicy.policy_type} Insurance
                  </div>
                  <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                    {selectedPolicy.file_name}
                  </div>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="text-[12px] text-[#1A3FBE] font-medium hover:underline"
              >
                change
              </Link>
            </div>
          ) : (
            <div className="text-[14px] text-[#DC2626] mb-3">
              No policy found. Analyze a policy first.
            </div>
          )}
        </div>

        {/* SCENARIO INPUT CARD */}
        <div className="bg-white border border-[#E5E3DC] rounded-2xl p-6 mb-4 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
          <label className="text-[14px] font-medium text-[#0F1117] mb-3 block">
            Describe your claim scenario
          </label>

          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="e.g. I was in a road accident and hospitalized for 3 days at a non-network hospital. Surgery was required."
            className="w-full min-h-[120px] bg-[#F7F6F2] border border-[#E5E3DC] rounded-xl p-4 text-[14px] text-[#0F1117] placeholder-[#9CA3AF] resize-none focus:outline-none focus:border-[#1A3FBE] transition-colors"
          />

          <div className="text-[12px] text-[#9CA3AF] text-right mt-2">
            {scenario.length} characters
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {suggestedScenarios.map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className="bg-[#F0EEE8] border border-[#E5E3DC] text-[12px] text-[#6B7280] px-3 py-1.5 rounded-full cursor-pointer hover:border-[#1A3FBE] hover:text-[#1A3FBE] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-[#FEF2F2] border border-red-200 rounded-xl p-3.5 px-4 mt-4 text-[13px] text-[#DC2626]">
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

          <button
            onClick={handleSimulate}
            disabled={loading || !scenario || !selectedPolicy}
            className="w-full mt-6 bg-[#1A3FBE] text-white rounded-xl py-[15px] px-6 text-[15px] font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:bg-[#1535A8] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(26,63,190,0.25)] disabled:bg-[#F0EEE8] disabled:text-[#9CA3AF] disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
          >
            <svg
              className="w-[18px] h-[18px]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Simulate Claim
          </button>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="bg-white border border-[#E5E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-14 text-center">
            <div className="w-12 h-12 rounded-full border-[3px] border-[#E5E3DC] border-t-[#1A3FBE] animate-spin mx-auto mb-6" />
            <h2 className="font-[family-name:var(--font-serif)] text-2xl text-[#0F1117] tracking-[-0.5px] mb-1.5">
              Evaluating your claim scenario…
            </h2>
            <p className="text-sm text-[#6B7280]">
              Checking against policy terms…
            </p>
          </div>
        )}

        {/* RESULTS STATE */}
        {!loading && result && (
          <>
            {/* Verdict Card */}
            <div className="bg-white border border-[#E5E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-8 mb-4 flex items-center justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="text-[11px] font-medium uppercase tracking-[0.8px] text-[#9CA3AF] mb-1.5">
                  Claim Verdict
                </div>
                <h2
                  className="font-[family-name:var(--font-serif)] text-[32px] leading-none tracking-[-1px] mb-3"
                  style={{ color: getVerdictColor(result.verdict).text }}
                >
                  {result.verdict}
                </h2>
                <p className="text-[14px] text-[#6B7280] leading-relaxed">
                  {result.reasoning}
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className="w-[96px] h-[96px] rounded-full border-[4px] flex items-center justify-center"
                  style={{
                    borderColor: getChanceColor(result.approval_chance).border,
                  }}
                >
                  <div className="text-center">
                    <div
                      className="font-[family-name:var(--font-serif)] text-[28px] font-medium"
                      style={{
                        color: getChanceColor(result.approval_chance).text,
                      }}
                    >
                      {result.approval_chance}%
                    </div>
                    <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                      approval chance
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4 max-sm:grid-cols-1">
              {/* Covered Aspects */}
              <div className="bg-white border border-[#E5E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="p-4 px-5 border-b border-[#E5E3DC] flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#ECFDF5] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-[16px] h-[16px] text-[#059669]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-[#0F1117]">
                    What's covered
                  </span>
                  <span className="ml-auto bg-[#ECFDF5] text-[#059669] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    {result.covered_aspects.length}
                  </span>
                </div>
                <div className="p-3 flex flex-col gap-1.5">
                  {result.covered_aspects.length > 0 ? (
                    result.covered_aspects.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 px-3 rounded-lg bg-[#F0FDF9] text-[13px] text-[#0F1117] leading-relaxed"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-[7px] flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))
                  ) : (
                    <p className="p-6 text-center text-[13px] text-[#9CA3AF]">
                      None identified
                    </p>
                  )}
                </div>
              </div>

              {/* Not Covered Aspects */}
              <div className="bg-white border border-[#E5E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="p-4 px-5 border-b border-[#E5E3DC] flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#FEF2F2] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-[16px] h-[16px] text-[#DC2626]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-[#0F1117]">
                    What's not covered
                  </span>
                  <span className="ml-auto bg-[#FEF2F2] text-[#DC2626] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    {result.not_covered_aspects.length}
                  </span>
                </div>
                <div className="p-3 flex flex-col gap-1.5">
                  {result.not_covered_aspects.length > 0 ? (
                    result.not_covered_aspects.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 px-3 rounded-lg bg-[#FFF5F5] text-[13px] text-[#0F1117] leading-relaxed"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626] mt-[7px] flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))
                  ) : (
                    <p className="p-6 text-center text-[13px] text-[#059669] font-medium">
                      None — scenario appears fully covered
                    </p>
                  )}
                </div>
              </div>

              {/* Risks - Full Width */}
              <div className="col-span-2 max-sm:col-span-1 bg-white border border-[#E5E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="p-4 px-5 border-b border-[#E5E3DC] flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#FFFBEB] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-[16px] h-[16px] text-[#D97706]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-[#0F1117]">
                    Risks that could affect your claim
                  </span>
                  <span className="ml-auto bg-[#FFFBEB] text-[#D97706] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    {result.risks.length}
                  </span>
                </div>
                <div className="p-3">
                  {result.risks.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1.5 max-sm:grid-cols-1">
                      {result.risks.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 px-3 rounded-lg bg-[#FFFDF0] text-[13px] text-[#0F1117] leading-relaxed"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-[#D97706] mt-[7px] flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="p-6 text-center text-[13px] text-[#9CA3AF]">
                      None identified
                    </p>
                  )}
                </div>
              </div>

              {/* Documents Needed - Full Width */}
              <div className="col-span-2 max-sm:col-span-1 bg-white border border-[#E5E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="p-4 px-5 border-b border-[#E5E3DC] flex items-center gap-2.5 bg-[#EEF2FF]">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-[16px] h-[16px] text-[#1A3FBE]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-[#0F1117]">
                    Documents you'll need to submit
                  </span>
                </div>
                <div className="p-3">
                  {result.documents_needed.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {result.documents_needed.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg bg-[#F7F8FF]"
                        >
                          <div className="w-6 h-6 bg-[#1A3FBE] text-white text-[11px] rounded-full flex items-center justify-center font-medium flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <span className="text-[13px] text-[#0F1117] leading-relaxed pt-0.5">
                            {doc}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="p-6 text-center text-[13px] text-[#9CA3AF]">
                      None identified
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Try Another Scenario Button */}
            <div className="bg-white border border-[#E5E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-6 px-8 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p>
                  <strong className="font-medium text-[#0F1117]">
                    Want to simulate another scenario?
                  </strong>
                </p>
                <p className="text-sm text-[#6B7280] mt-0.5">
                  Test a different situation against this policy.
                </p>
              </div>
              <button
                onClick={() => {
                  setSimulateResult(null);
                  setScenario('');
                  setError('');
                }}
                className="bg-[#F0EEE8] border border-[#E5E3DC] rounded-xl px-5 py-2.5 text-sm font-medium text-[#0F1117] flex items-center gap-1.5 hover:bg-[#E5E3DC] transition-colors whitespace-nowrap"
              >
                <svg
                  className="w-[16px] h-[16px]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try another scenario
              </button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E3DC] text-center py-6 text-xs text-[#9CA3AF]">
        PolicyLens v1.0.0 · AI-Powered Insurance Policy Analysis · Built with
        FastAPI + Next.js
      </footer>
    </div>
  );
}
