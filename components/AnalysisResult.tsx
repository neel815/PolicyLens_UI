"use client";

import { AlertCircle, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analysis Complete</h2>
        <button
          onClick={onReset}
          className="px-4 py-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
        >
          Analyze Another Policy
        </button>
      </div>

      {/* Coverage Score */}
      <CoverageScore score={data.coverage_score} />

      {/* Covered Events */}
      <ResultSection
        title="Covered Events"
        icon="✓"
        items={data.covered_events}
        emptyMessage="No covered events identified"
        borderColor="border-green-500"
        headerBgColor="bg-green-50"
      />

      {/* Exclusions */}
      <ResultSection
        title="Exclusions"
        icon="✕"
        items={data.exclusions}
        emptyMessage="No exclusions found"
        borderColor="border-red-500"
        headerBgColor="bg-red-50"
      />

      {/* Risky Clauses */}
      <ResultSection
        title="Risky Clauses"
        icon="⚠"
        items={data.risky_clauses}
        emptyMessage="No risky clauses detected"
        borderColor="border-amber-500"
        headerBgColor="bg-amber-50"
      />
    </div>
  );
}
