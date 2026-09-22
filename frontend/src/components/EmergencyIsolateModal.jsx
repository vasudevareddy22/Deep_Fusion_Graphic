import React, { useState, useEffect } from 'react';
import { AlertOctagon, ShieldAlert, X, Radio, CheckCircle, Lock } from 'lucide-react';

export const EmergencyIsolateModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [armed, setArmed] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isolated, setIsolated] = useState(false);

  useEffect(() => {
    let timer;
    if (armed && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    } else if (armed && countdown === 0) {
      setIsolated(true);
    }
    return () => clearInterval(timer);
  }, [armed, countdown]);

  const handleArm = () => {
    setArmed(true);
  };

  const handleReset = () => {
    setArmed(false);
    setCountdown(5);
    setIsolated(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#111827] border-2 border-[#FF2A5F] rounded-2xl shadow-[0_0_50px_rgba(255,42,95,0.4)] p-6 overflow-hidden">
        {/* Flashing perimeter strobe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#FF2A5F] animate-pulse" />

        <div className="flex items-start justify-between pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500/20 text-[#FF2A5F] border border-red-500/40 animate-pulse">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-base font-black font-mono tracking-wider text-white">
                EMERGENCY NETWORK ISOLATION
              </h2>
              <p className="text-xs font-mono text-[#FF2A5F]">DEFCON 1 PROTOCOL ARMED</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isolated ? (
          <div className="space-y-4 my-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/80 text-red-200 leading-relaxed">
              <p className="font-bold mb-1 flex items-center gap-1.5 text-[#FF2A5F]">
                <Radio className="w-4 h-4 animate-spin" /> WARNING: CRITICAL DEFENSIVE ACTION
              </p>
              Executing this instruction instantly drops all external BGP edge peering, severs ingress gateway tunnels, and blackholes all external routed traffic to prevent data exfiltration.
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Perimeter Subnet:</span>
                <span className="text-[#00F0FF] font-bold">10.0.0.0/24 (DMZ)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Internal Core LAN:</span>
                <span className="text-[#00F0FF] font-bold">192.168.1.0/24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Action:</span>
                <span className="text-[#FF2A5F] font-bold">SEVER ALL INGRESS / EGRESS</span>
              </div>
            </div>

            {armed ? (
              <div className="text-center p-4 rounded-xl bg-red-950/80 border border-[#FF2A5F] animate-pulse">
                <p className="text-sm font-bold text-white mb-1">ISOLATING PERIMETER IN</p>
                <span className="text-4xl font-black text-[#FF2A5F]">{countdown}s</span>
                <p className="text-[10px] text-slate-400 mt-2">Click abort below to cancel sequence</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="my-6 text-center space-y-3 font-mono">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-[#00E676] border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_20px_#00E676]">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">NETWORK ZERO-TRUST AIRGAP ACTIVE</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Perimeter firewall drop rules committed across all interfaces. Ingress is blocked. Internal telemetry logging is preserved.
            </p>
          </div>
        )}

        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 font-mono">
          {!isolated ? (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Abort Protocol
              </button>
              {!armed ? (
                <button
                  onClick={handleArm}
                  className="px-4 py-2 rounded-lg bg-[#FF2A5F] hover:bg-red-500 text-white font-bold text-xs shadow-[0_0_15px_#FF2A5F] transition-all cursor-pointer"
                >
                  CONFIRM NETWORK ISOLATION
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs cursor-pointer"
                >
                  Cancel Override
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-[#00E676] hover:bg-emerald-400 text-black font-bold text-xs shadow-[0_0_12px_#00E676] transition-all cursor-pointer"
            >
              Return to Monitoring
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyIsolateModal;
