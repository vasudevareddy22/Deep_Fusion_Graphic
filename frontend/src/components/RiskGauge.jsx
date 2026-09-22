import React from 'react';

export const RiskGauge = ({ score = 0, label = 'Threat Risk', size = 'md' }) => {
  const normalized = Math.max(0, Math.min(1, score));
  const percentage = Math.round(normalized * 100);

  // Color selection based on risk
  let strokeColor = '#10b981'; // Green
  let textColor = 'text-emerald-400';
  let badgeText = 'LOW';

  if (normalized >= 0.90) {
    strokeColor = '#ef4444'; // Red
    textColor = 'text-red-400';
    badgeText = 'CRITICAL';
  } else if (normalized >= 0.70) {
    strokeColor = '#f97316'; // Orange
    textColor = 'text-orange-400';
    badgeText = 'HIGH';
  } else if (normalized >= 0.40) {
    strokeColor = '#f59e0b'; // Amber
    textColor = 'text-amber-400';
    badgeText = 'MEDIUM';
  }

  const radius = size === 'lg' ? 48 : 36;
  const strokeWidth = size === 'lg' ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalized * circumference);

  const dim = size === 'lg' ? 'w-32 h-32' : 'w-24 h-24';

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`relative ${dim} flex items-center justify-center`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-xl font-bold font-mono ${textColor}`}>
            {percentage}%
          </span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            {badgeText}
          </span>
        </div>
      </div>
      {label && (
        <span className="mt-2 text-xs font-medium text-slate-400 tracking-wide text-center">
          {label}
        </span>
      )}
    </div>
  );
};

export default RiskGauge;
