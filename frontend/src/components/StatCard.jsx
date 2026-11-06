import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'cyan', badge }) => {
  const colorStyles = {
    cyan: {
      border: 'border-slate-800 hover:border-cyan-500/50',
      iconBg: 'bg-cyan-950/50 text-cyan-400 border border-cyan-800/50',
      glow: 'shadow-lg hover:shadow-cyan-500/20'
    },
    red: {
      border: 'border-slate-800 hover:border-rose-500/50',
      iconBg: 'bg-rose-950/50 text-rose-400 border border-rose-800/50',
      glow: 'shadow-lg hover:shadow-rose-500/20'
    },
    emerald: {
      border: 'border-slate-800 hover:border-emerald-500/50',
      iconBg: 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50',
      glow: 'shadow-lg hover:shadow-emerald-500/20'
    },
    amber: {
      border: 'border-slate-800 hover:border-amber-500/50',
      iconBg: 'bg-amber-950/50 text-amber-400 border border-amber-800/50',
      glow: 'shadow-lg hover:shadow-amber-500/20'
    },
    purple: {
      border: 'border-slate-800 hover:border-purple-500/50',
      iconBg: 'bg-purple-950/50 text-purple-400 border border-purple-800/50',
      glow: 'shadow-lg hover:shadow-purple-500/20'
    }
  };

  const currentStyle = colorStyles[color] || colorStyles.cyan;

  return (
    <div className={`bg-[#0B132B]/90 backdrop-blur-md p-5 rounded-2xl border transition-all duration-300 text-slate-100 ${currentStyle.border} ${currentStyle.glow}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-white mt-2 tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${currentStyle.iconBg}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>
      {badge && (
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400">{badge}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
