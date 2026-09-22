import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Bot, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Activity, 
  Sparkles, 
  FileCheck, 
  Wrench,
  Terminal,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import ThreatBadge from '../components/ThreatBadge';
import RiskGauge from '../components/RiskGauge';

export const AIThreatAnalysis = () => {
  const location = useLocation();
  const initialThreat = location.state?.threat || null;

  const [threatData, setThreatData] = useState(initialThreat);
  const [explanation, setExplanation] = useState(initialThreat?.explanation || null);
  const [loading, setLoading] = useState(false);
  const [activeAttackType, setActiveAttackType] = useState(initialThreat?.attack_type || 'DoS');

  const attackPresets = [
    { type: 'DoS', src: '192.168.1.105', dst: '10.0.0.5', proto: 'tcp', srv: 'http', ml: 0.95, graph: 0.88, score: 0.92, sev: 'CRITICAL' },
    { type: 'Probe', src: '192.168.1.201', dst: '10.0.0.2', proto: 'tcp', srv: 'private', ml: 0.86, graph: 0.74, score: 0.81, sev: 'HIGH' },
    { type: 'R2L', src: '172.16.0.45', dst: '10.0.0.12', proto: 'tcp', srv: 'ssh', ml: 0.89, graph: 0.78, score: 0.85, sev: 'HIGH' },
    { type: 'U2R', src: '10.0.0.88', dst: '10.0.0.1', proto: 'tcp', srv: 'telnet', ml: 0.94, graph: 0.92, score: 0.93, sev: 'CRITICAL' },
    { type: 'Normal', src: '192.168.1.15', dst: '10.0.0.5', proto: 'tcp', srv: 'http', ml: 0.05, graph: 0.12, score: 0.08, sev: 'LOW' }
  ];

  const fetchExplanation = async (payload) => {
    setLoading(true);
    try {
      const res = await api.explainThreat(payload);
      setExplanation(res.explanation);
      setThreatData(payload);
    } catch (err) {
      console.error("AI Explanation error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!explanation) {
      const preset = attackPresets.find(p => p.type === activeAttackType) || attackPresets[0];
      const payload = {
        attack_type: preset.type,
        source_ip: preset.src,
        destination_ip: preset.dst,
        protocol: preset.proto,
        service: preset.srv,
        ml_confidence: preset.ml,
        graph_risk: preset.graph,
        final_risk_score: preset.score,
        severity: preset.sev
      };
      fetchExplanation(payload);
    }
  }, []);

  const handleSelectPreset = (preset) => {
    setActiveAttackType(preset.type);
    const payload = {
      attack_type: preset.type,
      source_ip: preset.src,
      destination_ip: preset.dst,
      protocol: preset.proto,
      service: preset.srv,
      ml_confidence: preset.ml,
      graph_risk: preset.graph,
      final_risk_score: preset.score,
      severity: preset.sev
    };
    fetchExplanation(payload);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="glass-card p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            AI Threat Reasoning & Explanation Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Synthesizes multi-modal telemetry into plain-language SOC triage reports, root-cause analysis, and incident mitigation directives.
          </p>
        </div>

        {/* Engine Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono self-start md:self-center">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-slate-300">Engine:</span>
          <span className="text-cyan-400 font-bold truncate max-w-xs">
            {explanation?.engine || 'SOC Rule Engine Fallback'}
          </span>
        </div>
      </div>

      {/* Attack Scenario Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider mr-2 shrink-0">
          Inspect Threat Vector:
        </span>
        {attackPresets.map((preset) => (
          <button
            key={preset.type}
            onClick={() => handleSelectPreset(preset)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer shrink-0 border ${
              activeAttackType === preset.type
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-900/40'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {preset.type} {preset.type !== 'Normal' ? 'Attack' : 'Traffic'}
          </button>
        ))}
      </div>

      {/* Main Analysis Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Telemetry & Fused Risk Gauges */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-5">
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Incident Telemetry
          </h3>

          <div className="flex justify-center py-2">
            <RiskGauge 
              score={threatData?.final_risk_score || 0.85} 
              label="Unified Multi-Modal Risk" 
              size="lg" 
            />
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">Classified Threat:</span>
              <ThreatBadge type={threatData?.attack_type || 'DoS'} />
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">Severity Tier:</span>
              <ThreatBadge type={threatData?.severity || 'HIGH'} variant="severity" />
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">ML Confidence (RF):</span>
              <span className="font-bold text-cyan-400">
                {((threatData?.ml_confidence || 0.94) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">Graph Risk (Topology):</span>
              <span className="font-bold text-amber-400">
                {threatData?.graph_risk?.toFixed(2) || '0.82'}
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">Source Attacker:</span>
              <span className="font-bold text-rose-400">{threatData?.source_ip || '192.168.1.105'}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">Target Server:</span>
              <span className="font-bold text-slate-200">{threatData?.destination_ip || '10.0.0.5'}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">Protocol / Service:</span>
              <span className="uppercase text-slate-300">
                {threatData?.protocol || 'tcp'} / {threatData?.service || 'http'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => fetchExplanation(threatData)}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Regenerate AI Analysis</span>
            </button>
          </div>
        </div>

        {/* Right Column: Detailed LLM Reasoning Breakdown */}
        <div className="lg:col-span-2 glass-card p-6 rounded-xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Executive AI Threat Synthesis
            </h3>
            {explanation?.mitre_technique && (
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-rose-950/80 text-rose-300 border border-rose-800 font-semibold">
                MITRE: {explanation.mitre_technique}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
              <p className="text-xs font-mono text-cyan-400 animate-pulse">Consulting Large Language Model Knowledge Base...</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs font-sans">
              {/* 1. What Happened? */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/90 space-y-1.5">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  1. What Happened?
                </h4>
                <p className="text-slate-200 leading-relaxed text-sm">
                  {explanation?.what_happened || 'Incident detection logged and analyzed by DeepFusionGuard.'}
                </p>
              </div>

              {/* 2. Why is it Suspicious? */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/90 space-y-1.5">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  2. Why is this Suspicious?
                </h4>
                <p className="text-slate-300 leading-relaxed text-sm">
                  {explanation?.why_suspicious || 'Network heuristics and topological graph structure deviate significantly from benign baselines.'}
                </p>
              </div>

              {/* 3. Potential Impact */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/90 space-y-1.5">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  3. Potential Infrastructure Impact
                </h4>
                <p className="text-slate-300 leading-relaxed text-sm">
                  {explanation?.potential_impact || 'Risk of service interruption, credential compromise, or lateral movement.'}
                </p>
              </div>

              {/* 4. Recommended Actions */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/90 space-y-2">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4" />
                  4. Recommended SOC Remediation
                </h4>
                <div className="text-slate-200 leading-relaxed text-sm whitespace-pre-line font-mono bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                  {explanation?.recommended_action || '1. Quarantine originating host.\n2. Apply border firewall filters.'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIThreatAnalysis;
