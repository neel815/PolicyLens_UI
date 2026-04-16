"use client";

import {
  useState,
  useEffect,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { savePolicy } from "@/lib/storage";
import { getAuthHeader, isAuthenticated } from "@/lib/auth";
import { SavedPolicy } from "@/types/analysis";
import { HeroSection } from "@/components/HeroSection";
import { UploadCard } from "@/components/UploadCard";

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
  const router = useRouter();
  const [appState, setAppState] = useState<AppState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [scoreBarWidth, setScoreBarWidth] = useState(0);
  const [dbPolicyId, setDbPolicyId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check auth on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      // Redirect to login
      router.push("/login");
    }
  }, [router]);

  // Detect dark mode changes
  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Helper function to detect policy type from filename
  function detectPolicyType(filename: string): string {
    const name = filename.toLowerCase();
    if (name.includes('health') || name.includes('medical')) return 'Health';
    if (name.includes('car') || name.includes('motor') || name.includes('auto')) return 'Car';
    if (name.includes('home') || name.includes('house') || name.includes('property')) return 'Home';
    if (name.includes('life') || name.includes('term')) return 'Life';
    return 'Insurance';
  }

  // Helper function to format file size in MB (always showing MB as primary unit)
  function formatFileSize(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    
    if (mb < 0.01) {
      // For very small files, show more decimal places (e.g., 0.003 MB)
      return mb.toFixed(3) + " MB";
    } else {
      // For larger files, show 2 decimal places (e.g., 0.30 MB, 1.50 MB)
      return mb.toFixed(2) + " MB";
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB.");
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSize(formatFileSize(selectedFile.size));
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
        headers: getAuthHeader(),
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(data.detail || "Analysis failed");
      }

      if (!data.success || !data.data) {
        throw new Error(data.error || "Invalid response from server");
      }

      setResult(data.data);
      setAppState("results");
      setDbPolicyId(data.data.policy_id || null);  // store DB id
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
    setDbPolicyId(null);
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
    <div className="h-screen flex flex-col bg-background overflow-y-auto">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-4">
        {/* IDLE STATE */}
        {appState === "idle" && (
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column: Hero & Feature List */}
            <HeroSection />

            {/* Right Column: Upload Card */}
            <UploadCard
              onFileSelect={handleFileSelect}
              onAnalyze={() => {
                if (!file) return;
                setAppState("loading");
                setError("");
              }}
              fileName={fileName}
              fileSize={fileSize}
              file={file}
              isLoading={false}
              error={error}
            />
          </div>
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
          <div className="max-w-[960px] mx-auto w-full space-y-6">
            <div>
              <h2 className="text-3xl font-[family-name:var(--font-serif)] tracking-[-0.8px] text-foreground mb-1">Analysis Complete</h2>
              <p className="text-[13px] text-muted-foreground">Review your policy coverage details below</p>
            </div>

            {/* Coverage Score Card */}
            <div className="bg-card border border-border rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)] p-8">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mb-4">
                Overall Coverage Score
              </div>
              <div className="font-[family-name:var(--font-serif)] text-[56px] leading-none tracking-[-2px] text-foreground mb-4">
                {result.coverage_score}
                <span className="text-[28px] text-muted-foreground">/10</span>
              </div>
              <div className="bg-secondary rounded-lg h-2.5 overflow-hidden mb-5">
                <div
                  className="h-full bg-primary rounded-lg transition-all duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{ width: `${scoreBarWidth}%` }}
                />
              </div>
              <div className="text-[13px] text-muted-foreground leading-relaxed">
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

            {/* Results Grid */}
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              {/* Covered Events */}
              <div className="bg-card border border-border rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)] overflow-hidden">
                <div className="p-4 px-5 border-b border-border flex items-center gap-2.5 bg-green-700 dark:bg-green-900">
                  <span className="text-lg font-bold text-white">+</span>
                  <span className="text-sm font-semibold text-white">
                    Covered Events
                  </span>
                  <span className="ml-auto text-[11px] font-medium bg-white/20 px-2 py-1 rounded-full text-white">
                    {result.covered_events.length}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  {result.covered_events.length > 0 ? (
                    result.covered_events.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 border-l-4 border-green-500 pl-3 py-2 text-[13px] text-foreground"
                      >
                        <span className="flex-shrink-0">•</span>
                        <span>{item}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-[13px] text-muted-foreground py-4">
                      None identified
                    </p>
                  )}
                </div>
              </div>

              {/* Exclusions */}
              <div className="bg-card border border-border rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)] overflow-hidden">
                <div className="p-4 px-5 border-b border-border flex items-center gap-2.5 bg-red-700 dark:bg-red-900">
                  <span className="text-lg font-bold text-white">−</span>
                  <span className="text-sm font-semibold text-white">
                    Exclusions
                  </span>
                  <span className="ml-auto text-[11px] font-medium bg-white/20 px-2 py-1 rounded-full text-white">
                    {result.exclusions.length}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  {result.exclusions.length > 0 ? (
                    result.exclusions.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 border-l-4 border-red-500 pl-3 py-2 text-[13px] text-foreground"
                      >
                        <span className="flex-shrink-0">•</span>
                        <span>{item}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-[13px] text-muted-foreground py-4">
                      None found
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Risky Clauses - Full Width */}
            <div className="bg-card border border-border rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)] overflow-hidden">
              <div className="p-4 px-5 border-b border-border flex items-center gap-2.5 bg-amber-800 dark:bg-amber-900">
                <span className="text-lg font-bold text-white">!</span>
                <span className="text-sm font-semibold text-white">
                  Risky Clauses
                </span>
                <span className="ml-auto text-[11px] font-medium bg-white/20 px-2 py-1 rounded-full text-white">
                  {result.risky_clauses.length}
                </span>
              </div>
              <div className="p-4 space-y-2">
                {result.risky_clauses.length > 0 ? (
                  result.risky_clauses.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 border-l-4 border-amber-500 pl-3 py-2 text-[13px] text-foreground"
                    >
                      <span className="flex-shrink-0">•</span>
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-[13px] text-muted-foreground py-4">
                    No risky clauses detected
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={resetToIdle}
                className="px-5 py-2.5 text-[13px] font-medium text-primary border border-border rounded-lg hover:bg-secondary transition-colors"
              >
                Analyze Another
              </button>
              <button
                onClick={() => router.push("/simulate?id=" + dbPolicyId)}
                disabled={!dbPolicyId}
                style={{
                  backgroundColor: isDarkMode ? '#ffffff' : '#000000',
                  color: isDarkMode ? '#000000' : '#ffffff'
                }}
                className="px-5 py-2.5 text-[13px] font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Simulate Claim
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border text-center py-6 text-xs text-muted-foreground">
        PolicyLens v1.0.0 · AI-Powered Insurance Policy Analysis · Built with
        FastAPI + Next.js
      </footer>
    </div>
  );
}
