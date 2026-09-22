import React from 'react';

export const ThreatBadge = ({ type, variant = 'attack' }) => {
  if (variant === 'severity') {
    const sev = (type || 'LOW').toUpperCase();
    const configs = {
      CRITICAL: 'bg-red-950/80 text-red-400 border-red-600/60 shadow-red-900/40 animate-pulse',
      HIGH: 'bg-orange-950/80 text-orange-400 border-orange-600/60 shadow-orange-900/30',
      MEDIUM: 'bg-amber-950/80 text-amber-300 border-amber-600/50 shadow-amber-900/20',
      LOW: 'bg-emerald-950/80 text-emerald-400 border-emerald-600/50 shadow-emerald-900/20'
    };
    const style = configs[sev] || configs.LOW;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider border shadow-sm ${style}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        {sev}
      </span>
    );
  }

  // Attack Type Badge
  const atk = type || 'Normal';
  const configs = {
    DoS: 'bg-rose-950/70 text-rose-300 border-rose-500/40',
    Probe: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40',
    R2L: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
    U2R: 'bg-purple-950/70 text-purple-300 border-purple-500/40',
    Normal: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
  };

  const style = configs[atk] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium border ${style}`}>
      {atk}
    </span>
  );
};

export default ThreatBadge;
