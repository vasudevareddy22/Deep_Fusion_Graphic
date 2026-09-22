import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'cyan', badge }) => {
  const colorStyles = {
    cyan: {
      border: 'border-blue-100 hover:border-blue-300',
      iconBg: 'bg-blue-50 text-blue-600',
      glow: 'shadow-xs hover:shadow-md hover:shadow-blue-500/10'
    },
    red: {
      border: 'border-blue-100 hover:border-rose-300',
      iconBg: 'bg-rose-50 text-rose-600',
      glow: 'shadow-xs hover:shadow-md hover:shadow-rose-500/10'
    },
    emerald: {
      border: 'border-blue-100 hover:border-emerald-300',
      iconBg: 'bg-emerald-50 text-emerald-600',
      glow: 'shadow-xs hover:shadow-md hover:shadow-emerald-500/10'
    },
    amber: {
      border: 'border-blue-100 hover:border-amber-300',
      iconBg: 'bg-amber-50 text-amber-600',
      glow: 'shadow-xs hover:shadow-md hover:shadow-amber-500/10'
    },
    purple: {
      border: 'border-blue-100 hover:border-blue-300',
      iconBg: 'bg-blue-50 text-blue-600',
      glow: 'shadow-xs hover:shadow-md hover:shadow-blue-500/10'
    }
  };

  const currentStyle = colorStyles[color] || colorStyles.cyan;

  return (
    <div className={`bg-white p-5 rounded-2xl border transition-all duration-300 ${currentStyle.border} ${currentStyle.glow}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${currentStyle.iconBg}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>
      {badge && (
        <div className="mt-3 pt-3 border-t border-blue-50">
          <span className="text-[11px] font-semibold text-slate-500">{badge}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
