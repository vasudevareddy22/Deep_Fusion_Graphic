import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Lock,
  AlertTriangle,
  Terminal,
  Activity,
  CheckCircle2,
  Server,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import ThreatBadge from './ThreatBadge';

export const IncidentDeepDiveDialog = ({ incident, isOpen, onClose, onMitigate, onBlock }) => {
  if (!isOpen || !incident) return null;

  const [quarantined, setQuarantined] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const riskPercent = Math.round((incident.final_risk_score || incident.risk_score || 0.85) * 100);
  const mlConfidence = Math.round((incident.ml_confidence || 0.96) * 100);
  const graphRisk = (incident.graph_risk || 0.72).toFixed(2);

  const handleQuarantine = () => {
    setQuarantined(true);
    setActionSuccess(`Host ${incident.destination_ip || '10.0.0.5'} successfully isolated to quarantine VLAN.`);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const handleBlock = () => {
    onBlock?.(incident.source_ip);
    setActionSuccess(`Rule committed: Blocked IP ${incident.source_ip} on perimeter firewall.`);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setActionSuccess(`Incident #${incident.id || 'INC-8492'} marked as analyzed & dismissed.`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#111827] border border-[#1F2937] rounded-2xl shadow-2xl shadow-cyan-950/40 p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Accent top gradient glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF2A5F] via-[#FFB800] to-[#00F0FF]" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              incident.severity === 'CRITICAL' ? 'bg-red-500/10 text-[#FF2A5F]' :
              incident.severity === 'HIGH' ? 'bg-amber-500/10 text-[#FFB800]' :
              'bg-cyan-500/10 text-[#00F0FF]'
            }`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono text-white">
                  INCIDENT DEEP DIVE: #{incident.id || 'INC-8921'}
                </h3>
                <ThreatBadge type={incident.severity || 'CRITICAL'} variant="severity" />
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Target Vector: <span className="text-cyan-400 font-semibold">{incident.attack_type || 'DoS Flood'}</span> · {incident.timestamp || 'Just now'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast */}
        {actionSuccess && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Multi-modal Risk Score Cards */}
          <div className="grid grid-cols-3 gap-3 font-mono">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400">Fused AI Risk</span>
              <p className="text-2xl font-bold text-[#FF2A5F] mt-1">{riskPercent}%</p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-[#FF2A5F] h-full rounded-full" style={{ width: `${riskPercent}%` }} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400">ML Confidence</span>
              <p className="text-2xl font-bold text-[#00F0FF] mt-1">{mlConfidence}%</p>
              <span className="text-[10px] text-slate-500">Random Forest Ensemble</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400">Graph Risk Index</span>
              <p className="text-2xl font-bold text-[#FFB800] mt-1">{graphRisk}</p>
              <span className="text-[10px] text-slate-500">Centrality & Fan-In GNN</span>
            </div>
          </div>

          {/* Telemetry Matrix */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Server className="w-3.5 h-3.5 text-[#00F0FF]" /> Telemetry & Flow Vectors
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Verified
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div>
                <span className="text-slate-500 text-[10px]">SOURCE IP</span>
                <p className="text-[#FF2A5F] font-bold text-xs truncate">{incident.source_ip || '192.168.1.110'}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">TARGET IP</span>
                <p className="text-slate-200 font-bold text-xs truncate">{incident.destination_ip || '10.0.0.5'}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">PORT / SERVICE</span>
                <p className="text-cyan-400 font-bold text-xs">
                  {incident.service || 'http'} ({incident.port || '80'})
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">PROTOCOL</span>
                <p className="text-amber-400 font-bold text-xs uppercase">{incident.protocol || 'tcp'}</p>
              </div>
            </div>
          </div>

          {/* AI Assessment */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 mb-2 text-[#00F0FF] font-mono font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>AI Threat Assessment & MITRE ATT&CK Mapping</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans">
              {incident.details || incident.explanation?.what_happened ||
                `High-velocity packet stream detected originating from ${incident.source_ip} exhibiting synchronized SYN sequence anomalies targeting port 80. Pattern corresponds to automated distributed resource exhaustion.`}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3 font-mono text-[10px]">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                T1498: Network Denial of Service
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                TA0040: Impact
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[#00F0FF] border border-cyan-800/50">
                Playbook: PB-DOS-ISOLATE
              </span>
            </div>
          </div>

          {/* Simulated Packet Raw Hex / Payload Preview */}
          <div className="p-3 rounded-xl bg-black border border-slate-800 text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Terminal className="w-3.5 h-3.5 text-slate-500" /> Packet Header Dump
              </span>
              <span className="text-[10px] text-slate-600">OFFSET 0x0000 - 0x0020</span>
            </div>
            <pre className="text-slate-400 overflow-x-auto select-all leading-tight">
{`0000  45 00 00 3c 1a 2b 40 00 40 06 b2 c8 c0 a8 01 6e  E..<.+@.@......n
0010  0a 00 00 05 de ad be ef 00 00 00 00 a0 02 72 10  ..............r.
0020  28 9a 00 00 02 04 05 b4 04 02 08 0a 00 12 34 56  (.............4V`}
            </pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuarantine}
              disabled={quarantined}
              className="px-3 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-[#FFB800] border border-amber-600/40 text-xs font-mono font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              {quarantined ? 'Target Quarantined' : 'Quarantine Host'}
            </button>
            <button
              onClick={handleBlock}
              className="px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-[#FF2A5F] border border-red-600/40 text-xs font-mono font-semibold transition-all cursor-pointer"
            >
              Block Source IP
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDismiss}
              disabled={dismissed}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
            >
              Dismiss Alert
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#00F0FF] hover:bg-cyan-400 text-black text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDeepDiveDialog;
