"use client";

import { useEffect, useState } from "react";

interface CoverageScoreProps {
  score: number;
}

export default function CoverageScore({ score }: CoverageScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedScore((prev) => {
        if (prev < score) {
          return Math.min(prev + 1, score);
        }
        return prev;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [score]);

  const percentage = (animatedScore / 10) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Overall Coverage Score
      </h2>

      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#2563eb"
              strokeWidth="8"
              strokeDasharray={`${(percentage / 100) * 351.86} 351.86`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-900">
              {animatedScore}
            </span>
            <span className="text-2xl text-gray-500 ml-1">/10</span>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-gray-600">
        {animatedScore <= 3
          ? "Low coverage - review carefully"
          : animatedScore <= 6
            ? "Moderate coverage - compare options"
            : animatedScore <= 8
              ? "Good coverage - solid protection"
              : "Excellent coverage - comprehensive protection"}
      </p>
    </div>
  );
}
