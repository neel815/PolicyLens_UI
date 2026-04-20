'use client';

export default function HeroAnimation() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes checkmark {
          0% {
            stroke-dashoffset: 50;
            opacity: 0;
          }
          60% {
            stroke-dashoffset: 0;
          }
          100% {
            opacity: 1;
          }
        }
        .floating-animation {
          animation: float 3s ease-in-out infinite;
        }
        .checkmark-stroke {
          stroke-dasharray: 50;
          animation: checkmark 1s ease-in-out 1.5s forwards;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
      `}</style>
      
      <svg
        viewBox="0 0 200 250"
        className="floating-animation w-full h-full max-w-[300px] max-h-[300px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Document Background */}
        <rect
          x="40"
          y="20"
          width="120"
          height="160"
          rx="8"
          fill="#EEF2FF"
          stroke="#1A3FBE"
          strokeWidth="2"
        />

        {/* Document Lines */}
        <line x1="55" y1="50" x2="145" y2="50" stroke="#D0D5E4" strokeWidth="2" />
        <line x1="55" y1="70" x2="145" y2="70" stroke="#D0D5E4" strokeWidth="2" />
        <line x1="55" y1="90" x2="135" y2="90" stroke="#D0D5E4" strokeWidth="2" />
        <line x1="55" y1="110" x2="140" y2="110" stroke="#D0D5E4" strokeWidth="2" />
        <line x1="55" y1="130" x2="130" y2="130" stroke="#D0D5E4" strokeWidth="2" />
        <line x1="55" y1="150" x2="135" y2="150" stroke="#D0D5E4" strokeWidth="2" />

        {/* Checkmark Circle Background */}
        <circle
          cx="150"
          cy="195"
          r="28"
          fill="#047857"
          opacity="0.95"
        />

        {/* Checkmark */}
        <g>
          <polyline
            points="140,190 145,200 165,180"
            stroke="white"
            strokeWidth="3"
            fill="none"
            className="checkmark-stroke"
          />
        </g>
      </svg>
    </div>
  );
}

