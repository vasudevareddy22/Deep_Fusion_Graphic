import React, { useState } from 'react';
import { Shield, Radio, PlayCircle, LogOut, User, Database, Download, Users, Lock } from 'lucide-react';
import { authService } from '../services/auth';
import { api } from '../services/api';
import CustomerDirectoryModal from './CustomerDirectoryModal';

// Auth method badge colours in light blue theme
const AUTH_BADGE = {
  GOOGLE:     { label: 'GOOGLE',      cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  EMAIL_OTP:  { label: 'EMAIL OTP',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  MOBILE_OTP: { label: 'MOBILE OTP',  cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  PASSWORD:   { label: 'PASSWORD',    cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export const Navbar = ({ onTriggerDemo, isDemoLoading }) => {
  const [showCustomersModal, setShowCustomersModal] = useState(false);
  const user = authService.getUser() || { name: 'Customer User', role: 'Customer', auth_provider: 'EMAIL_OTP', email: '' };

  // Strict check: Only Vasudevareddyeevuri@gmail.com is authorized as Super Admin
  const isMasterAdmin = (user?.email || '').toLowerCase() === 'vasudevareddyeevuri@gmail.com' || user?.role === 'Administrator';
  const badge = isMasterAdmin
    ? { label: 'SUPER ADMIN', cls: 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold' }
    : (AUTH_BADGE[user.auth_provider] || { label: 'CUSTOMER', cls: 'bg-blue-50 text-blue-700 border-blue-200' });

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  return (
    <>
      <header className="h-16 border-b border-blue-100 bg-white/95 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between gap-3 shadow-xs">

        {/* ── Brand ── */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] shadow-md shadow-blue-500/25">
            <Shield className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full animate-ping opacity-75" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 font-sans">
                DeepFusion<span className="text-blue-600">Guard</span>
              </h1>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                isMasterAdmin ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {isMasterAdmin ? 'ADMIN CONSOLE' : 'CUSTOMER PORTAL'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium mt-0.5">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span className="text-emerald-600 font-semibold">Active</span>
              <span className="text-slate-300">·</span>
              <span className="text-blue-600 font-semibold">DEFCON 4</span>
              <span className="text-slate-300">·</span>
              <Database className="w-2.5 h-2.5 text-amber-500" />
              <span className="text-amber-600 font-semibold text-[10px]">365d Retention</span>
            </p>
          </div>
        </div>

        {/* ── Right Controls ── */}
        <div className="flex items-center gap-2.5 ml-auto">

          {/* Demo data trigger */}
          {onTriggerDemo && (
            <button
              onClick={onTriggerDemo}
              disabled={isDemoLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              title="Inject simulated NSL-KDD attack telemetry"
            >
              <PlayCircle className={`w-4 h-4 ${isDemoLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isDemoLoading ? 'Injecting...' : 'Load Demo Data'}</span>
            </button>
          )}

          {/* ── MASTER ADMIN EXCLUSIVE CONTROLS (Vasudevareddyeevuri@gmail.com) ── */}
          {isMasterAdmin && (
            <>
              {/* View Customers Directory Modal */}
              <button
                onClick={() => setShowCustomersModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all cursor-pointer"
                title="View all registered customer logins"
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Customer Directory</span>
              </button>

              {/* Export Customers Excel button */}
              <button
                onClick={() => api.downloadUsersExcel()}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all cursor-pointer"
                title="Download registered_users.xlsx customer records"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>
            </>
          )}

          {/* User info badge */}
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-blue-50/40 border border-blue-100">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
              isMasterAdmin ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
            }`}>
              <User className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[140px]">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <p className="text-[10px] text-slate-500 leading-none font-medium">
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
            className="p-2 rounded-xl bg-blue-50/40 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-blue-100 hover:border-rose-200 transition-colors cursor-pointer"
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
    </>
  );
};

export default Navbar;
