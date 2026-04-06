'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, isAuthenticated } from '@/lib/auth';

// Interfaces
interface BattlePolicy {
  id: number
  file_name: string
  policy_type: string
  coverage_score: number
}

interface BattleRound {
  category: string
  winner: 'A' | 'B' | 'Draw'
  score_a: number
  score_b: number
  reasoning: string
}

interface BattleResult {
  policy_a_name: string
  policy_b_name: string
  rounds: BattleRound[]
  overall_winner: 'A' | 'B' | 'Draw'
  final_score_a: number
  final_score_b: number
  verdict: string
  policy_a_best_for: string
  policy_b_best_for: string
}

type PolicySource = 'upload' | 'saved'

export default function BattlePage() {
  // State
  const router = useRouter();
  const [savedPolicies, setSavedPolicies] = useState<BattlePolicy[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  // Policy 1
  const [source1, setSource1] = useState<PolicySource>('upload');
  const [file1, setFile1] = useState<File | null>(null);
  const [savedId1, setSavedId1] = useState<number | null>(null);

  // Policy 2
  const [source2, setSource2] = useState<PolicySource>('upload');
  const [file2, setFile2] = useState<File | null>(null);
  const [savedId2, setSavedId2] = useState<number | null>(null);

  const [battling, setBattling] = useState(false);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);

  // Animation state
  const [revealedRounds, setRevealedRounds] = useState(0);
  const [showFinal, setShowFinal] = useState(false);

  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);

  // Check auth on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadSavedPolicies();
  }, [router]);

  // Loading animation
  useEffect(() => {
    if (!battling) return;
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % 4);
    }, 800);
    return () => clearInterval(interval);
  }, [battling]);

  // Animation for revealing rounds
  useEffect(() => {
    if (!result) return;
    setRevealedRounds(0);
    setShowFinal(false);

    result.rounds.forEach((_, i) => {
      setTimeout(() => {
        setRevealedRounds(i + 1);
      }, i * 700 + 300);
    });

    setTimeout(() => {
      setShowFinal(true);
    }, result.rounds.length * 700 + 800);
  }, [result]);

  async function loadSavedPolicies() {
    setLoadingSaved(true);
    try {
      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/policies`
      );
      if (res.ok) {
        const data = await res.json();
        setSavedPolicies(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSaved(false);
    }
  }

  function handleFileSelect1(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB.');
      return;
    }
    setFile1(f);
    setError('');
  }

  function handleFileSelect2(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB.');
      return;
    }
    setFile2(f);
    setError('');
  }

  async function handleBattle() {
    // Validate
    const hasPolicy1 = source1 === 'upload' ? !!file1 : !!savedId1;
    const hasPolicy2 = source2 === 'upload' ? !!file2 : !!savedId2;

    if (!hasPolicy1 || !hasPolicy2) {
      setError('Please select both policies to battle.');
      return;
    }

    if (
      source1 === 'saved' &&
      source2 === 'saved' &&
      savedId1 === savedId2
    ) {
      setError('Please select two different policies.');
      return;
    }

    setBattling(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();

      if (source1 === 'upload' && file1) {
        formData.append('file1', file1);
      } else if (source1 === 'saved' && savedId1) {
        formData.append('policy1_id', String(savedId1));
      }

      if (source2 === 'upload' && file2) {
        formData.append('file2', file2);
      } else if (source2 === 'saved' && savedId2) {
        formData.append('policy2_id', String(savedId2));
      }

      const res = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/battle`,
        { method: 'POST', body: formData }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.detail || 'Battle failed');
      }

      setResult(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBattling(false);
    }
  }

  const hasPolicy1 = source1 === 'upload' ? !!file1 : !!savedId1;
  const hasPolicy2 = source2 === 'upload' ? !!file2 : !!savedId2;

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      <main className="max-w-[860px] mx-auto px-6 py-14 pb-20">
        {/* HEADER */}
        <Link
          href="/dashboard"
          className="text-[13px] text-[#6B7280] hover:text-[#0F1117] mb-8 inline-flex items-center gap-1 transition-colors"
        >
          ← Back
        </Link>

        <h1 className="font-[family-name:var(--font-serif)] text-[36px] tracking-[-0.8px] text-[#0F1117] mb-1">
          Policy Battle
        </h1>
        <p className="text-[15px] text-[#6B7280] mb-8">
          Upload two policies and let AI judge which one wins.
        </p>

        {/* POLICY SELECTOR — Grid with VS divider */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start mb-6 max-sm:grid-cols-1">
          {/* Policy A Slot */}
          <div className="bg-white border border-[#E5E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Header */}
            <div className="bg-[#F7F6F2] border-b border-[#E5E3DC] px-5 py-3 flex items-center justify-between">
              <span className="bg-[#EEF2FF] text-[#1A3FBE] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                Policy A
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSource1('upload');
                    setSavedId1(null);
                  }}
                  className={`text-[11px] font-medium px-3 py-1 rounded-full transition-colors cursor-pointer ${
                    source1 === 'upload'
                      ? 'bg-[#1A3FBE] text-white'
                      : 'bg-transparent text-[#6B7280] hover:text-[#0F1117]'
                  }`}
                >
                  Upload
                </button>
                <button
                  onClick={() => {
                    setSource1('saved');
                    setFile1(null);
                  }}
                  className={`text-[11px] font-medium px-3 py-1 rounded-full transition-colors cursor-pointer ${
                    source1 === 'saved'
                      ? 'bg-[#1A3FBE] text-white'
                      : 'bg-transparent text-[#6B7280] hover:text-[#0F1117]'
                  }`}
                >
                  Saved
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              {source1 === 'upload' ? (
                <>
                  <input
                    ref={fileInput1Ref}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect1}
                    className="hidden"
                  />
                  {!file1 ? (
                    <div
                      onClick={() => fileInput1Ref.current?.click()}
                      className="border-2 border-dashed border-[#E5E3DC] rounded-xl p-8 text-center cursor-pointer hover:border-[#1A3FBE] hover:bg-[#EEF2FF]/30 transition-all"
                    >
                      <svg
                        className="w-6 h-6 text-[#9CA3AF] mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6"
                        />
                      </svg>
                      <p className="text-[13px] text-[#6B7280] mt-2">Drop PDF here</p>
                      <p className="text-[12px] text-[#9CA3AF]">or click to browse</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-[#F0EEE8] border border-[#E5E3DC] rounded-xl p-3">
                      <div className="w-8 h-8 bg-[#DC2626] rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-[#0F1117] font-medium truncate">
                          {file1.name}
                        </p>
                        <p className="text-[11px] text-[#9CA3AF]">
                          {(file1.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setFile1(null);
                          if (fileInput1Ref.current) fileInput1Ref.current.value = '';
                        }}
                        className="text-[#6B7280] hover:text-[#DC2626] transition-colors flex-shrink-0"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {loadingSaved ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-5 h-5 rounded-full border-2 border-[#E5E3DC] border-t-[#1A3FBE] animate-spin" />
                    </div>
                  ) : savedPolicies.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-[13px] text-[#9CA3AF] mb-3">No saved policies.</p>
                      <Link
                        href="/"
                        className="text-[12px] text-[#1A3FBE] font-medium hover:underline"
                      >
                        Analyze one first
                      </Link>
                    </div>
                  ) : (
                    <>
                      <select
                        value={savedId1 || ''}
                        onChange={(e) => setSavedId1(Number(e.target.value) || null)}
                        className="w-full bg-[#F7F6F2] border border-[#E5E3DC] rounded-xl px-4 py-3 text-[14px] text-[#0F1117] focus:outline-none focus:border-[#1A3FBE] cursor-pointer appearance-none"
                      >
                        <option value="">Select a policy...</option>
                        {savedPolicies.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.policy_type} — {p.file_name} ({p.coverage_score}/10)
                          </option>
                        ))}
                      </select>
                      {savedId1 && (
                        <div className="mt-3 flex items-center gap-2 bg-[#EEF2FF] rounded-lg p-2.5">
                          <span className="text-[11px] font-medium text-[#1A3FBE] px-2 py-1 bg-white rounded">
                            {savedPolicies.find(p => p.id === savedId1)?.coverage_score || 0}/10
                          </span>
                          <span className="text-[12px] text-[#6B7280]">Coverage</span>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* VS Divider */}
          <div className="hidden sm:flex flex-col items-center justify-center pt-12 gap-2">
            <div className="font-[family-name:var(--font-serif)] text-[28px] text-[#E5E3DC] font-400">
              VS
            </div>
            <svg className="w-4 h-4 text-[#9CA3AF]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          {/* Policy B Slot */}
          <div className="bg-white border border-[#E5E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Header */}
            <div className="bg-[#F7F6F2] border-b border-[#E5E3DC] px-5 py-3 flex items-center justify-between">
              <span className="bg-[#FEF2F2] text-[#DC2626] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                Policy B
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSource2('upload');
                    setSavedId2(null);
                  }}
                  className={`text-[11px] font-medium px-3 py-1 rounded-full transition-colors cursor-pointer ${
                    source2 === 'upload'
                      ? 'bg-[#1A3FBE] text-white'
                      : 'bg-transparent text-[#6B7280] hover:text-[#0F1117]'
                  }`}
                >
                  Upload
                </button>
                <button
                  onClick={() => {
                    setSource2('saved');
                    setFile2(null);
                  }}
                  className={`text-[11px] font-medium px-3 py-1 rounded-full transition-colors cursor-pointer ${
                    source2 === 'saved'
                      ? 'bg-[#1A3FBE] text-white'
                      : 'bg-transparent text-[#6B7280] hover:text-[#0F1117]'
                  }`}
                >
                  Saved
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              {source2 === 'upload' ? (
                <>
                  <input
                    ref={fileInput2Ref}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect2}
                    className="hidden"
                  />
                  {!file2 ? (
                    <div
                      onClick={() => fileInput2Ref.current?.click()}
                      className="border-2 border-dashed border-[#E5E3DC] rounded-xl p-8 text-center cursor-pointer hover:border-[#1A3FBE] hover:bg-[#EEF2FF]/30 transition-all"
                    >
                      <svg
                        className="w-6 h-6 text-[#9CA3AF] mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6"
                        />
                      </svg>
                      <p className="text-[13px] text-[#6B7280] mt-2">Drop PDF here</p>
                      <p className="text-[12px] text-[#9CA3AF]">or click to browse</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-[#F0EEE8] border border-[#E5E3DC] rounded-xl p-3">
                      <div className="w-8 h-8 bg-[#DC2626] rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-[#0F1117] font-medium truncate">
                          {file2.name}
                        </p>
                        <p className="text-[11px] text-[#9CA3AF]">
                          {(file2.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setFile2(null);
                          if (fileInput2Ref.current) fileInput2Ref.current.value = '';
                        }}
                        className="text-[#6B7280] hover:text-[#DC2626] transition-colors flex-shrink-0"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {loadingSaved ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-5 h-5 rounded-full border-2 border-[#E5E3DC] border-t-[#1A3FBE] animate-spin" />
                    </div>
                  ) : savedPolicies.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-[13px] text-[#9CA3AF] mb-3">No saved policies.</p>
                      <Link
                        href="/"
                        className="text-[12px] text-[#1A3FBE] font-medium hover:underline"
                      >
                        Analyze one first
                      </Link>
                    </div>
                  ) : (
                    <>
                      <select
                        value={savedId2 || ''}
                        onChange={(e) => setSavedId2(Number(e.target.value) || null)}
                        className="w-full bg-[#F7F6F2] border border-[#E5E3DC] rounded-xl px-4 py-3 text-[14px] text-[#0F1117] focus:outline-none focus:border-[#1A3FBE] cursor-pointer appearance-none"
                      >
                        <option value="">Select a policy...</option>
                        {savedPolicies.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.policy_type} — {p.file_name} ({p.coverage_score}/10)
                          </option>
                        ))}
                      </select>
                      {savedId2 && (
                        <div className="mt-3 flex items-center gap-2 bg-[#FEF2F2] rounded-lg p-2.5">
                          <span className="text-[11px] font-medium text-[#DC2626] px-2 py-1 bg-white rounded">
                            {savedPolicies.find(p => p.id === savedId2)?.coverage_score || 0}/10
                          </span>
                          <span className="text-[12px] text-[#6B7280]">Coverage</span>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div className="flex items-center gap-3 bg-[#FEF2F2] border border-red-200 rounded-2xl p-4 px-5 mb-6 text-[13px] text-[#DC2626]">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {error}
          </div>
        )}

        {/* BATTLE BUTTON */}
        <button
          onClick={handleBattle}
          disabled={battling || !hasPolicy1 || !hasPolicy2}
          className="w-full bg-[#1A3FBE] text-white rounded-2xl py-4 text-[15px] font-medium flex items-center justify-center gap-2 hover:bg-[#1535A8] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(26,63,190,0.25)] disabled:bg-[#F0EEE8] disabled:text-[#9CA3AF] disabled:cursor-not-allowed disabled:translate-y-0 transition-all duration-200"
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
              d="M15 3h6v6m-11-1L8.5 3.5M19.5 19.5l-6-6M11 11l-4 4"
            />
          </svg>
          Start Battle
        </button>

        {/* LOADING STATE */}
        {battling && (
          <div className="bg-white border border-[#E5E3DC] rounded-2xl p-14 text-center mt-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
            <div className="w-12 h-12 rounded-full border-[3px] border-[#E5E3DC] border-t-[#1A3FBE] animate-spin mx-auto mb-6" />
            <h2 className="font-[family-name:var(--font-serif)] text-[24px] tracking-[-0.5px] text-[#0F1117] mb-1.5">
              Analyzing both policies…
            </h2>
            <p className="text-[14px] text-[#6B7280] mb-6">
              AI is reading every clause to pick a winner.
            </p>

            {/* Loading steps */}
            <div className="space-y-2 max-w-[200px] mx-auto">
              {[
                'Reading Policy A…',
                'Reading Policy B…',
                'Comparing across 6 categories…',
                'Calculating final verdict…',
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`text-[12px] transition-opacity ${
                    idx <= loadingStep ? 'text-[#6B7280]' : 'text-[#9CA3AF]'
                  }`}
                >
                  {idx < loadingStep && '✓ '}{step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESULTS STATE */}
        {result && !battling && (
          <>
            {/* SCOREBOARD */}
            <div className="bg-white border border-[#E5E3DC] rounded-2xl overflow-hidden mt-6 mb-4 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
              {/* Top bar */}
              <div
                className="h-1.5 w-full"
                style={{
                  backgroundColor:
                    result.overall_winner === 'A'
                      ? '#1A3FBE'
                      : result.overall_winner === 'B'
                      ? '#DC2626'
                      : '#D97706',
                }}
              />

              {/* Content */}
              <div className="p-6 flex items-center justify-between gap-4 flex-wrap">
                {/* Policy A */}
                <div className="flex-1 min-w-[120px] text-center">
                  <p className="text-[12px] text-[#9CA3AF] mb-1 truncate max-w-[200px] mx-auto">
                    {result.policy_a_name}
                  </p>
                  <div
                    className="font-[family-name:var(--font-serif)] text-[48px] leading-none tracking-[-2px]"
                    style={{
                      color:
                        result.overall_winner === 'A' ? '#1A3FBE' : '#9CA3AF',
                    }}
                  >
                    {result.final_score_a}
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] mt-1">rounds won</p>
                </div>

                {/* Center */}
                <div className="flex flex-col items-center gap-2">
                  <div className="font-[family-name:var(--font-serif)] text-[20px] text-[#E5E3DC]">
                    VS
                  </div>
                  {showFinal && (
                    <div
                      style={{
                        backgroundColor:
                          result.overall_winner === 'A'
                            ? '#EEF2FF'
                            : result.overall_winner === 'B'
                            ? '#FEF2F2'
                            : '#FFFBEB',
                        color:
                          result.overall_winner === 'A'
                            ? '#1A3FBE'
                            : result.overall_winner === 'B'
                            ? '#DC2626'
                            : '#D97706',
                      }}
                      className="font-medium text-[13px] px-4 py-2 rounded-full"
                      style={{
                        animation: 'fadein 0.5s ease',
                      }}
                    >
                      {result.overall_winner === 'A'
                        ? 'Policy A Wins!'
                        : result.overall_winner === 'B'
                        ? 'Policy B Wins!'
                        : 'Draw!'}
                    </div>
                  )}
                </div>

                {/* Policy B */}
                <div className="flex-1 min-w-[120px] text-center">
                  <p className="text-[12px] text-[#9CA3AF] mb-1 truncate max-w-[200px] mx-auto">
                    {result.policy_b_name}
                  </p>
                  <div
                    className="font-[family-name:var(--font-serif)] text-[48px] leading-none tracking-[-2px]"
                    style={{
                      color:
                        result.overall_winner === 'B' ? '#DC2626' : '#9CA3AF',
                    }}
                  >
                    {result.final_score_b}
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] mt-1">rounds won</p>
                </div>
              </div>
            </div>

            {/* 6 BATTLE ROUNDS */}
            <div className="mt-6">
              <h3 className="text-[13px] font-medium text-[#0F1117] mb-3">
                Round by Round
              </h3>

              <div className="flex flex-col gap-3">
                {result.rounds.map((round, idx) => {
                  if (idx >= revealedRounds) return null;

                  const aWins = round.winner === 'A';
                  const bWins = round.winner === 'B';
                  const isDraw = round.winner === 'Draw';

                  return (
                    <div
                      key={idx}
                      className="bg-white border border-[#E5E3DC] rounded-2xl overflow-hidden"
                      style={{
                        animation: 'slideIn 0.4s ease both',
                        animationDelay: `${idx * 0.05}s`,
                      }}
                    >
                      {/* Round header */}
                      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E3DC]">
                        <p className="text-[13px] font-medium text-[#0F1117]">
                          {round.category}
                        </p>
                        <span
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            backgroundColor: aWins
                              ? '#EEF2FF'
                              : bWins
                              ? '#FEF2F2'
                              : '#FFFBEB',
                            color: aWins
                              ? '#1A3FBE'
                              : bWins
                              ? '#DC2626'
                              : '#D97706',
                          }}
                        >
                          {aWins
                            ? 'Policy A'
                            : bWins
                            ? 'Policy B'
                            : 'Draw'}
                        </span>
                      </div>

                      {/* Scores */}
                      <div className="flex items-center gap-4 px-5 py-3">
                        {/* A score */}
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[11px] text-[#9CA3AF] w-4">
                            A
                          </span>
                          <div className="flex-1 bg-[#F0EEE8] h-2 rounded-full overflow-hidden">
                            <div
                              style={{
                                width: `${(round.score_a / 10) * 100}%`,
                                backgroundColor: aWins ? '#1A3FBE' : '#E5E3DC',
                                transition: 'width 0.7s ease',
                              }}
                              className="h-full"
                            />
                          </div>
                          <span className="text-[12px] font-medium w-6 text-right">
                            {round.score_a}
                          </span>
                        </div>

                        {/* VS */}
                        <span className="text-[11px] text-[#9CA3AF]">vs</span>

                        {/* B score */}
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[12px] font-medium w-6 text-left">
                            {round.score_b}
                          </span>
                          <div className="flex-1 bg-[#F0EEE8] h-2 rounded-full overflow-hidden">
                            <div
                              style={{
                                width: `${(round.score_b / 10) * 100}%`,
                                backgroundColor: bWins ? '#DC2626' : '#E5E3DC',
                                transition: 'width 0.7s ease',
                              }}
                              className="h-full"
                            />
                          </div>
                          <span className="text-[11px] text-[#9CA3AF] w-4 text-right">
                            B
                          </span>
                        </div>
                      </div>

                      {/* Reasoning */}
                      <div className="px-5 pb-3">
                        <p className="text-[12px] text-[#6B7280] leading-relaxed italic">
                          {round.reasoning}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FINAL VERDICT */}
            {showFinal && (
              <div
                className="bg-white border border-[#E5E3DC] rounded-2xl p-6 mt-4 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]"
                style={{
                  animation: 'fadein 0.6s ease',
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-[#FFFBEB] rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-[#D97706]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-[14px] font-medium text-[#0F1117]">
                    Final Verdict
                  </p>
                </div>

                {/* Verdict */}
                <p className="text-[14px] text-[#6B7280] leading-relaxed mb-5">
                  {result.verdict}
                </p>

                {/* Best for cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#EEF2FF] rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-[#1A3FBE] uppercase tracking-wide mb-1">
                      Policy A
                    </p>
                    <p className="text-[11px] text-[#6B7280] mb-1">Best for:</p>
                    <p className="text-[13px] text-[#0F1117]">
                      {result.policy_a_best_for}
                    </p>
                  </div>
                  <div className="bg-[#FEF2F2] rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-[#DC2626] uppercase tracking-wide mb-1">
                      Policy B
                    </p>
                    <p className="text-[11px] text-[#6B7280] mb-1">Best for:</p>
                    <p className="text-[13px] text-[#0F1117]">
                      {result.policy_b_best_for}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* BATTLE AGAIN */}
            <div className="bg-white border border-[#E5E3DC] rounded-2xl p-6 mt-4 flex items-center justify-between flex-wrap gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
              <p className="text-[14px] text-[#6B7280]">
                Want to battle different policies?
              </p>
              <button
                onClick={() => {
                  setResult(null);
                  setFile1(null);
                  setFile2(null);
                  setSavedId1(null);
                  setSavedId2(null);
                  setRevealedRounds(0);
                  setShowFinal(false);
                  if (fileInput1Ref.current) fileInput1Ref.current.value = '';
                  if (fileInput2Ref.current) fileInput2Ref.current.value = '';
                }}
                className="bg-[#1A3FBE] text-white rounded-xl px-6 py-3 text-[13px] font-medium inline-flex items-center gap-2 hover:bg-[#1535A8] hover:-translate-y-px transition-all duration-200"
              >
                <svg
                  className="w-4 h-4"
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
                Battle again
              </button>
            </div>
          </>
        )}

        <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadein {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}</style>
      </main>
    </div>
  );
}
