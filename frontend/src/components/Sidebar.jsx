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
    <aside className="w-64 border-r border-blue-100 bg-white flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
            Navigation Console
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
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-bold border-r-2 border-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
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
        <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800">DeepFusion Multi-Modal</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Neural fusion engine combines Random Forest feature predictions with NetworkX graph topology & LLM reasoning.
          </p>
          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 pt-2.5 border-t border-blue-100 font-medium">
            <span>Model: RF + GNN</span>
            <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">100% ACC</span>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-blue-100/70 text-[11px] font-medium text-slate-400 flex items-center justify-between bg-blue-50/20">
        <span>SOC ID: DFG-NODE-01</span>
        <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Online
        </span>
      </div>
    </aside>
  );
};

export default Sidebar;
