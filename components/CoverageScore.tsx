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

  const getScoreColor = (): { text: string; circleColor: string; description: string } => {
    if (score >= 8) return { text: '#059669', circleColor: '#1A3FBE', description: 'Excellent coverage' };
    if (score >= 6) return { text: '#1A3FBE', circleColor: '#1A3FBE', description: 'Good coverage' };
    if (score >= 4) return { text: '#D97706', circleColor: '#D97706', description: 'Fair coverage' };
    return { text: '#DC2626', circleColor: '#DC2626', description: 'Limited coverage' };
  };

  const colors = getScoreColor();

  return (
    <div className="bg-card border border-border rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)] p-6">
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mb-4">
        Overall Coverage Score
      </div>

      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="var(--border)"
              strokeWidth="8"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke={colors.circleColor}
              strokeWidth="8"
              strokeDasharray={`${(percentage / 100) * 351.86} 351.86`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-bold text-foreground">
              {animatedScore}
            </span>
            <span className="text-2xl text-muted-foreground ml-1">/10</span>
          </div>
        </div>
      </div>

      <p className="text-center text-[13px] text-muted-foreground leading-relaxed">
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
