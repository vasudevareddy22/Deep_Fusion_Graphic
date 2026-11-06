import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Crosshair, 
  Network, 
  Bot, 
  History, 
  FileText, 
  Settings, 
  ShieldAlert,
  Sliders
} from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { to: '/', label: 'SOC Dashboard', icon: LayoutDashboard },
    { to: '/detect', label: 'Attack Detection', icon: Crosshair },
    { to: '/graph', label: 'Network Graph', icon: Network },
    { to: '/analysis', label: 'AI Threat Analysis', icon: Bot },
    { to: '/history', label: 'Detection History', icon: History },
    { to: '/reports', label: 'Executive Reports', icon: FileText },
    { to: '/settings', label: 'Engine Settings', icon: Sliders },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/90 bg-[#090E1B]/95 backdrop-blur-xl flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        <div>
          <p className="px-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            Defense Modules
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-transparent text-cyan-300 font-bold border-l-3 border-cyan-400 shadow-sm shadow-cyan-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* System Telemetry Box */}
        <div className="p-4 rounded-2xl bg-[#0D1527]/90 border border-cyan-500/20 shadow-md shadow-black/40">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-100">DeepFusion Multi-Modal</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Neural fusion combines Random Forest feature predictions with NetworkX graph topology & LLM reasoning.
          </p>
          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 pt-2.5 border-t border-slate-800 font-mono">
            <span className="text-slate-400">Model: RF + GNN</span>
            <span className="text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40 shadow-xs shadow-emerald-500/20">
              100% ACC
            </span>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 flex items-center justify-between bg-[#070C16]">
        <span className="text-slate-400">SOC ID: DFG-NODE-01</span>
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400"></span>
          Connected
        </span>
      </div>
    </aside>
  );
};

export default Sidebar;
