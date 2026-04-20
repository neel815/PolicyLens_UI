'use client';

import { useEffect, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface CounterProps {
  animationData?: any;
  animations_path?: string;
}

export default function Counter({ animationData, animations_path }: CounterProps) {
  const [count, setCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (count >= 60) {
      setIsComplete(true);
      return;
    }

    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev >= 60) {
          setIsComplete(true);
          clearInterval(interval);
          return 60;
        }
        return prev + 1;
      });
    }, 50); // 50ms per increment = 3000ms total (0-60)

    return () => clearInterval(interval);
  }, [count]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Lottie Animation Container */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        {animationData || animations_path ? (
          <div style={{ width: '200px', height: '200px' }}>
            <DotLottieReact
              src={animations_path}
              data={animationData}
              loop
              autoplay
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        ) : null}
      </div>

      {/* Counter Display */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="text-6xl font-bold text-[#1A3FBE] font-[family-name:var(--font-serif)] tracking-tight">
          {count}
        </div>
        <div className="text-sm text-[#6B7280] font-medium">
          {isComplete ? '✓ Ready' : 'Seconds'}
        </div>
      </div>

      {/* Progress Circle Background */}
      <svg
        className="absolute w-48 h-48 transform -rotate-90"
        viewBox="0 0 200 200"
      >
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="#F0EEE8"
          strokeWidth="3"
        />
        {/* Progress circle */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="#1A3FBE"
          strokeWidth="3"
          strokeDasharray={`${(count / 60) * 565.48} 565.48`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 50ms linear' }}
        />
      </svg>
    </div>
  );
}
