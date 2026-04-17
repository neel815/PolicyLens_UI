"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import animationData from "@/app/animations/loader.json";

interface AnimatedLoaderProps {
  isLoading: boolean;
  title?: string;
  subtitle?: string;
  steps?: string[];
  currentStep?: number;
}

export function AnimatedLoader({
  isLoading,
  title = "Analyzing your policy...",
  subtitle = "Our AI is carefully reviewing your insurance policy",
  steps = [
    "Extracting PDF content",
    "Reading policy clauses",
    "Identifying coverage areas",
    "Analyzing exclusions",
    "Calculating coverage score",
  ],
  currentStep = 0,
}: AnimatedLoaderProps) {
  const [displayedSteps, setDisplayedSteps] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);

    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Animate step indicators
  useEffect(() => {
    if (isLoading && currentStep < steps.length) {
      const timer = setTimeout(() => {
        setDisplayedSteps(steps.slice(0, currentStep + 1));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentStep, steps, isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 md:p-10 shadow-2xl border border-gray-200 dark:border-slate-800 max-w-md w-full mx-4 animate-fade-in">
        {/* Lottie Animation */}
        <div 
          className="flex justify-center mb-6"
          style={{
            filter: isDarkMode ? "brightness(1.4)" : "brightness(1)",
          }}
        >
          <div className="w-40 h-40">
            <Lottie
              animationData={animationData}
              loop={true}
              autoplay={true}
              rendererSettings={{
                preserveAspectRatio: "xMidYMid slice",
              }}
            />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-xl md:text-2xl font-semibold text-center text-gray-900 dark:text-white mb-2 tracking-tight">
          {title}
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-center text-gray-600 dark:text-gray-300 mb-6">
          {subtitle}
        </p>

        {/* Step Indicators */}
        {steps && steps.length > 0 && (
          <div className="space-y-3">
            {displayedSteps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 animate-slide-up"
              >
                {/* Step Icon */}
                <div className="flex-shrink-0">
                  {idx < currentStep ? (
                    // Completed step
                    <div className="w-6 h-6 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  ) : (
                    // Current or pending step
                    <div className="w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Step Text */}
                <span
                  className={`text-sm transition-colors duration-200 ${
                    idx < currentStep
                      ? "text-gray-500 dark:text-gray-400 line-through"
                      : "text-gray-900 dark:text-white font-medium"
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}

            {/* Remaining steps (not yet started) */}
            {steps.map((step, idx) => {
              if (idx >= displayedSteps.length) {
                return (
                  <div
                    key={`pending-${idx}`}
                    className="flex items-center gap-3 opacity-50"
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{step}</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
