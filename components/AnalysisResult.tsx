"use client";

import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import CoverageScore from "./CoverageScore";
import ResultSection from "./ResultSection";
import { AnalysisData } from "@/types/analysis";

interface AnalysisResultProps {
  data: AnalysisData;
  onReset: () => void;
}

export default function AnalysisResult({ data, onReset }: AnalysisResultProps) {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-[family-name:var(--font-serif)] tracking-[-0.8px] text-foreground">Analysis Complete</h2>
          <p className="text-[13px] text-muted-foreground mt-1">Review your policy coverage details below</p>
        </div>
        <button
          onClick={onReset}
          className="px-5 py-2.5 text-[13px] font-medium text-primary border border-border rounded-lg hover:bg-secondary transition-colors"
        >
          Analyze Another
        </button>
      </div>

      {/* Coverage Score */}
      <CoverageScore score={data.coverage_score} />

      {/* Covered Events */}
      <ResultSection
        title="✓ Covered Events"
        icon=""
        items={data.covered_events}
        emptyMessage="No covered events identified"
        borderColor="border-green-500"
        headerBgColor="bg-green-100/50 dark:bg-green-950"
      />

      {/* Exclusions */}
      <ResultSection
        title="✕ Exclusions"
        icon=""
        items={data.exclusions}
        emptyMessage="No exclusions found"
        borderColor="border-red-500"
        headerBgColor="bg-red-100/50 dark:bg-red-950"
      />

      {/* Risky Clauses */}
      <ResultSection
        title="⚠️ Risky Clauses"
        icon=""
        items={data.risky_clauses}
        emptyMessage="No risky clauses detected"
        borderColor="border-amber-500"
        headerBgColor="bg-amber-100/50 dark:bg-amber-950"
      />
    </div>
  );
}
