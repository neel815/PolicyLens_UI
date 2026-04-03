"use client";

import {
  useState,
  useRef,
  useEffect,
} from "react";
import Link from "next/link";
import { savePolicy } from "@/lib/storage";
import { SavedPolicy } from "@/types/analysis";

// TypeScript Interfaces
interface AnalysisData {
  covered_events: string[];
  exclusions: string[];
  risky_clauses: string[];
  coverage_score: number;
}

type AppState = "idle" | "loading" | "results";

export default function Home() {
  // State
  const [appState, setAppState] = useState<AppState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [scoreBarWidth, setScoreBarWidth] = useState(0);


  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to detect policy type from filename
  function detectPolicyType(filename: string): string {
    const name = filename.toLowerCase();
    if (name.includes('health') || name.includes('medical')) return 'Health';
    if (name.includes('car') || name.includes('motor') || name.includes('auto')) return 'Car';
    if (name.includes('home') || name.includes('house') || name.includes('property')) return 'Home';
    if (name.includes('life') || name.includes('term')) return 'Life';
    return 'Insurance';
  }

  // Functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB.");
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSize((selectedFile.size / (1024 * 1024)).toFixed(1) + " MB");
    setError("");
  };

  const clearFile = () => {
    setFile(null);
    setFileName("");
    setFileSize("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    if (droppedFile.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB.");
      return;
    }

    setFile(droppedFile);
    setFileName(droppedFile.name);
    setFileSize((droppedFile.size / (1024 * 1024)).toFixed(1) + " MB");
    setError("");
  };

  const startAnalysis = async () => {
    if (!file) return;
    setAppState("loading");
    setError("");
  };

  const performAnalysis = async () => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Analysis failed");
      }

      if (!data.success || !data.data) {
        throw new Error(data.error || "Invalid response from server");
      }

      setResult(data.data);
      setAppState("results");
      setTimeout(() => setScoreBarWidth(data.data.coverage_score * 10), 100);

      // Save to localStorage
      const newPolicy: SavedPolicy = {
        id: crypto.randomUUID(),
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        policyType: detectPolicyType(file.name),
        analyzedAt: new Date().toISOString(),
        data: data.data,
      };
      savePolicy(newPolicy);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMsg);
      setAppState("idle");
      setFile(null);
      setFileName("");
      setFileSize("");
    }
  };

  const resetToIdle = () => {
    setAppState("idle");
    setFile(null);
    setFileName("");
    setFileSize("");
    setResult(null);
    setError("");
    setScoreBarWidth(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getScoreVerdict = (
    score: number
  ): { label: string; textColor: string; bgColor: string } => {
    if (score >= 8) {
      return {
        label: "Excellent coverage",
        textColor: "#059669",
        bgColor: "#ECFDF5",
      };
    } else if (score >= 6) {
      return {
        label: "Good coverage",
        textColor: "#1A3FBE",
        bgColor: "#EEF2FF",
      };
    } else if (score >= 4) {
      return {
        label: "Average coverage",
        textColor: "#D97706",
        bgColor: "#FFFBEB",
      };
    } else {
      return {
        label: "Limited coverage",
        textColor: "#DC2626",
        bgColor: "#FEF2F2",
      };
    }
  };

  // Loading Animation and API Call
  useEffect(() => {
    if (appState !== "loading") return;

    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= 3) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 900);

    // Make API call after showing loading animation for UX
    const timer = setTimeout(() => {
      clearInterval(interval);
      performAnalysis();
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [appState, file]);

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col">
      {/* Main Content */}
      <main className="max-w-[760px] mx-auto px-6 py-14 pb-20 flex-1 w-full">
        {/* IDLE STATE */}
        {appState === "idle" && (
          <>
            {/* Hero */}
            <div className="text-center mb-12">
              <h1 className="font-[family-name:var(--font-serif)] text-[clamp(36px,5vw,52px)] leading-[1.15] tracking-[-1px] text-[#0F1117] mb-3">
                Understand your policy{" "}
                <em className="italic text-[#1A3FBE]">in 60 seconds</em>
              </h1>

              <p className="text-base text-[#6B7280] max-w-[460px] mx-auto leading-relaxed">
                Upload your insurance policy PDF and get instant AI-powered
                analysis of coverage, exclusions, and risky clauses.
              </p>
            </div>

            {/* Upload Card */}
            <div className="bg-white border border-[#E5E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-10">
              {/* Drop Zone */}
              <div
                className="border-2 border-dashed border-[#E5E3DC] rounded-xl p-12 text-center cursor-pointer relative transition-all duration-200 hover:border-[#1A3FBE] hover:bg-[#EEF2FF]"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <div className="w-[52px] h-[52px] bg-white border border-[#E5E3DC] rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-[24px] h-[24px] text-[#9CA3AF]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6"
                    />
                  </svg>
                </div>

                <div className="text-[15px] font-medium text-[#0F1117] mb-1.5">
                  Drop your policy PDF here
                </div>
                <div className="text-[13px] text-[#9CA3AF]">
                  or click to browse ·{" "}
                  <span className="bg-[#F0EEE8] border border-[#E5E3DC] rounded px-1.5 text-[11px] font-medium text-[#6B7280] mx-0.5">
                    PDF
                  </span>
                  only ·{" "}
                  <span className="bg-[#F0EEE8] border border-[#E5E3DC] rounded px-1.5 text-[11px] font-medium text-[#6B7280] mx-0.5">
                    max 10MB
                  </span>
                </div>
              </div>

              {/* File Selected Row */}
              {fileName && (
                <div className="flex items-center gap-3 bg-[#F0EEE8] border border-[#E5E3DC] rounded-xl p-3 px-4 mt-4">
                  <div className="w-9 h-9 bg-[#FEF2F2] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-[18px] h-[18px] text-[#DC2626]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[#0F1117] truncate">
                      {fileName}
                    </div>
                    <div className="text-xs text-[#9CA3AF]">{fileSize}</div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="w-7 h-7 rounded-md hover:bg-[#E5E3DC] flex items-center justify-center text-[#9CA3AF] hover:text-[#0F1117] transition-colors"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Error Banner */}
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

              {/* Divider */}
              <div className="flex items-center gap-3 my-6 text-[#9CA3AF] text-xs">
                <div className="flex-1 h-px bg-[#E5E3DC]" />
              </div>

              {/* Analyze Button */}
              <button
                onClick={startAnalysis}
                disabled={!file}
                className="w-full bg-[#1A3FBE] text-white rounded-xl py-[15px] px-6 text-[15px] font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:bg-[#1535A8] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(26,63,190,0.25)] disabled:bg-[#F0EEE8] disabled:text-[#9CA3AF] disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Analyze Policy
              </button>

              {/* Feature Chips */}
              <div className="flex flex-wrap gap-2 justify-center mt-5">
                <div className="bg-[#F0EEE8] border border-[#E5E3DC] rounded-full px-2.5 py-1.5 flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <svg
                    className="w-[13px] h-[13px]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                  </svg>
                  Private & secure
                </div>
                <div className="bg-[#F0EEE8] border border-[#E5E3DC] rounded-full px-2.5 py-1.5 flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <svg
                    className="w-[13px] h-[13px]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                  Results in ~15s
                </div>
                <div className="bg-[#F0EEE8] border border-[#E5E3DC] rounded-full px-2.5 py-1.5 flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <svg
                    className="w-[13px] h-[13px]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  Health · Car · Home · Life
                </div>
              </div>
            </div>
          </>
        )}

        {/* LOADING STATE */}
        {appState === "loading" && (
          <div className="bg-white border border-[#E5E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-14 text-center">
            <div className="w-12 h-12 rounded-full border-[3px] border-[#E5E3DC] border-t-[#1A3FBE] animate-spin mx-auto mb-6" />
            <h2 className="font-[family-name:var(--font-serif)] text-2xl text-[#0F1117] tracking-[-0.5px] mb-1.5">
              Analyzing your policy…
            </h2>
            <p className="text-sm text-[#6B7280]">
              This usually takes 10–20 seconds
            </p>

            <div className="max-w-[280px] mx-auto mt-7 flex flex-col gap-2.5 text-left">
              {[
                "PDF extracted successfully",
                "Reading policy clauses…",
                "Identifying coverage & exclusions",
                "Calculating coverage score",
              ].map((label, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2.5 text-[13px]"
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      index < loadingStep
                        ? "bg-[#059669]"
                        : index === loadingStep
                          ? "bg-[#1A3FBE] animate-pulse"
                          : "bg-[#E5E3DC]"
                    }`}
                  />
                  <span
                    className={
                      index < loadingStep
                        ? "text-[#059669]"
                        : index === loadingStep
                          ? "text-[#0F1117]"
                          : "text-[#9CA3AF]"
                    }
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESULTS STATE */}
        {appState === "results" && result && (
          <>
            {/* Score Card */}
            <div className="bg-white border border-[#E5E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-8 px-10 mb-4 flex items-center justify-between gap-6 flex-wrap">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.8px] text-[#9CA3AF] mb-1.5">
                  Overall Coverage Score
                </div>
                <div className="font-[family-name:var(--font-serif)] text-[56px] leading-none tracking-[-2px] text-[#0F1117] mb-3">
                  {result.coverage_score}
                  <span className="text-[28px] text-[#9CA3AF]">/10</span>
                </div>
                <div className="bg-[#F0EEE8] rounded-lg h-2 max-w-[280px] overflow-hidden">
                  <div
                    className="h-full bg-[#1A3FBE] rounded-lg transition-all duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{ width: `${scoreBarWidth}%` }}
                  />
                </div>
              </div>

              <div>
                <div
                  className="text-[13px] font-medium px-3.5 py-1.5 rounded-full text-center"
                  style={{
                    color: getScoreVerdict(result.coverage_score).textColor,
                    background: getScoreVerdict(result.coverage_score).bgColor,
                  }}
                >
                  {getScoreVerdict(result.coverage_score).label}
                </div>
                <div className="text-xs text-[#6B7280] text-right max-w-[180px] mt-2">
                  Your policy offers{" "}
                  {result.coverage_score >= 8
                    ? "comprehensive"
                    : result.coverage_score >= 6
                      ? "good"
                      : result.coverage_score >= 4
                        ? "moderate"
                        : "limited"}{" "}
                  protection
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4 max-sm:grid-cols-1">
              {/* Covered Events */}
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
                    Covered Events
                  </span>
                  <span className="ml-auto bg-[#ECFDF5] text-[#059669] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    {result.covered_events.length}
                  </span>
                </div>
                <div className="p-3 flex flex-col gap-1.5">
                  {result.covered_events.length > 0 ? (
                    result.covered_events.map((item, idx) => (
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

              {/* Exclusions */}
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
                    Exclusions
                  </span>
                  <span className="ml-auto bg-[#FEF2F2] text-[#DC2626] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    {result.exclusions.length}
                  </span>
                </div>
                <div className="p-3 flex flex-col gap-1.5">
                  {result.exclusions.length > 0 ? (
                    result.exclusions.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 px-3 rounded-lg bg-[#FFF5F5] text-[13px] text-[#0F1117] leading-relaxed"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626] mt-[7px] flex-shrink-0" />
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

              {/* Risky Clauses - Full Width */}
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
                    Risky Clauses
                  </span>
                  <span className="ml-auto bg-[#FFFBEB] text-[#D97706] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    {result.risky_clauses.length}
                  </span>
                </div>
                <div className="p-3">
                  {result.risky_clauses.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1.5 max-sm:grid-cols-1">
                      {result.risky_clauses.map((item, idx) => (
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
            </div>

            {/* Analyze Again Card */}
            <div className="bg-white border border-[#E5E3DC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-6 px-8 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p>
                  <strong className="font-medium text-[#0F1117]">
                    Want to check another policy?
                  </strong>
                </p>
                <p className="text-sm text-[#6B7280] mt-0.5">
                  Upload a second PDF to compare coverage.
                </p>
              </div>
              <button
                onClick={resetToIdle}
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
                Analyze another
              </button>
            </div>

            {/* View Dashboard Link */}
            <div className="mt-4 text-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-[13px] text-[#1A3FBE] hover:underline font-medium"
              >
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                >
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                </svg>
                View all saved policies
              </Link>
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
