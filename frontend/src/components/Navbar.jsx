import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Radio, PlayCircle, LogOut, User, Database, Download, Users, Lock, Film } from 'lucide-react';
import { authService } from '../services/auth';
import { api } from '../services/api';
import CustomerDirectoryModal from './CustomerDirectoryModal';
import VideoWalkthroughModal from './VideoWalkthroughModal';

// Auth method badge colours in cyber obsidian theme
const AUTH_BADGE = {
  GOOGLE:     { label: 'GOOGLE',      cls: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60' },
  EMAIL_OTP:  { label: 'EMAIL OTP',   cls: 'bg-blue-950/60 text-blue-300 border-blue-800/60' },
  MOBILE_OTP: { label: 'MOBILE OTP',  cls: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60' },
  PASSWORD:   { label: 'PASSWORD',    cls: 'bg-amber-950/60 text-amber-300 border-amber-800/60' },
};

export const Navbar = ({ onTriggerDemo, isDemoLoading }) => {
  const [showCustomersModal, setShowCustomersModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const user = authService.getUser() || { name: 'Customer User', role: 'Customer', auth_provider: 'EMAIL_OTP', email: '' };

  // Strict check: Only Vasudevareddyeevuri@gmail.com is authorized as Super Admin
  const isMasterAdmin = (user?.email || '').toLowerCase() === 'vasudevareddyeevuri@gmail.com' || user?.role === 'Administrator';
  const badge = isMasterAdmin
    ? { label: 'SUPER ADMIN', cls: 'bg-amber-950/80 text-amber-300 border-amber-500/50 font-extrabold shadow-xs shadow-amber-500/20' }
    : (AUTH_BADGE[user.auth_provider] || { label: 'CUSTOMER', cls: 'bg-blue-950/60 text-blue-300 border-blue-800/60' });

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  return (
    <>
      <header className="h-16 border-b border-slate-800/90 bg-[#0A0F1D]/90 backdrop-blur-xl sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between gap-3 shadow-lg shadow-black/40">

        {/* ── Brand ── */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 shadow-md shadow-cyan-500/25 border border-cyan-400/30">
            <Shield className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0A0F1D] rounded-full animate-ping opacity-75" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0A0F1D] rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white font-sans flex items-center gap-1">
                DeepFusion<span className="text-cyan-400">Guard</span>
              </h1>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold tracking-wider ${
                isMasterAdmin ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' : 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60'
              }`}>
                {isMasterAdmin ? 'ADMIN CONSOLE' : 'CUSTOMER PORTAL'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-2 font-medium mt-0.5">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                Active
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-400 font-semibold px-1.5 py-0.2 rounded bg-cyan-950/50 border border-cyan-900/60 text-[10px]">
                DEFCON 4 SECURE
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400/90 font-medium text-[10px] hidden md:inline-flex items-center gap-1">
                <Database className="w-2.5 h-2.5 text-amber-400" />
                365d Retention
              </span>
            </p>
          </div>
        </div>

        {/* ── Right Controls ── */}
        <div className="flex items-center gap-2.5 ml-auto">

          {/* Live Sniffer Quick Link */}
          <Link
            to="/live"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 transition-all cursor-pointer shadow-xs shadow-cyan-500/20"
            title="Real-time live host network sniffer & attack detection"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">Live Sniffer</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">LIVE</span>
          </Link>

          {/* 4-Minute Interactive Video Demonstration & Voiceover Tour */}
          <button
            onClick={() => setShowVideoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-blue-950/80 hover:from-purple-900/90 hover:to-blue-900/90 text-purple-200 hover:text-white border border-purple-500/40 hover:border-purple-300 transition-all cursor-pointer shadow-xs shadow-purple-500/20"
            title="Open 4-minute interactive video demonstration & voiceover player"
          >
            <Film className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="hidden sm:inline">4-Min Video Demo</span>
          </button>

          {/* Demo data trigger */}
          {onTriggerDemo && (
            <button
              onClick={onTriggerDemo}
              disabled={isDemoLoading}
              className="btn-cyber cursor-pointer disabled:opacity-50 active:scale-95 text-xs font-bold"
              title="Inject simulated NSL-KDD attack telemetry"
            >
              <PlayCircle className={`w-4 h-4 ${isDemoLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isDemoLoading ? 'Injecting Telemetry...' : 'Simulate Attack'}</span>
            </button>
          )}

          {/* ── MASTER ADMIN EXCLUSIVE CONTROLS (Vasudevareddyeevuri@gmail.com) ── */}
          {isMasterAdmin && (
            <>
              {/* View Customers Directory Modal */}
              <button
                onClick={() => setShowCustomersModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/90 hover:bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer shadow-xs"
                title="View all registered customer logins"
              >
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Customers</span>
              </button>

              {/* Export Customers Excel button */}
              <button
                onClick={() => api.downloadUsersExcel()}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/90 hover:bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 transition-all cursor-pointer shadow-xs"
                title="Download registered_users.xlsx customer records"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Excel</span>
              </button>
            </>
          )}

          {/* User info badge */}
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
              isMasterAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            }`}>
              <User className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs font-bold text-slate-100 leading-none truncate max-w-[130px]">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <p className="text-[10px] text-slate-400 leading-none font-medium">
                  {isMasterAdmin ? 'Super Admin' : 'Customer'}
                </p>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/60 transition-colors cursor-pointer"
            title="Disconnect from Console"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Master Admin Customer Directory Modal */}
      {isMasterAdmin && (
        <CustomerDirectoryModal
          isOpen={showCustomersModal}
          onClose={() => setShowCustomersModal(false)}
        />
      )}

      {/* 4-Minute Interactive Video Demonstration & Voiceover Player */}
      <VideoWalkthroughModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
      />
    </>
  );
};

export default Navbar;
