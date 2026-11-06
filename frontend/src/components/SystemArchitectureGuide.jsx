import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Cpu,
  Share2,
  Flame,
  Bot,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Radio,
  Sparkles,
  Layers,
  Terminal,
  AlertTriangle,
  Play,
  ChevronRight,
  ShieldCheck,
  Activity,
  Sliders,
  X,
  AlertOctagon
} from 'lucide-react';
import { api } from '../services/api';

export const SystemArchitectureGuide = ({ onScenarioInjected, isModal = false, onClose }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('input'); // 'input' | 'function' | 'output' | 'live_try'
  const [selectedScenario, setSelectedScenario] = useState('ddos');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simResult, setSimResult] = useState(null);

  // Scenario presets for interactive test
  const scenarios = [
    {
      id: 'ddos',
      name: 'DDoS SYN Flood',
      type: 'DoS',
      src: '192.168.1.105',
      dst: '10.0.0.5',
      proto: 'TCP',
      srv: 'HTTP (80)',
      count: 512,
      bytes: '45,820 / 0',
      fanIn: '0.94 (High Ingress)',
      expectedRisk: '96% CRITICAL',
      mitre: 'T1498 (Network DoS)',
      desc: 'Botnet nodes flooding target server connection pool with spoofed SYN packets.'
    },
    {
      id: 'recon',
      name: 'APT Recon / Portsweep',
      type: 'Probe',
      src: '192.168.1.201',
      dst: 'Subnet 10.0.0.0/24',
      proto: 'TCP/ICMP',
      srv: 'Multi-port (22,80,443,8080)',
      count: 240,
      bytes: '1,200 / 480',
      fanIn: '0.88 (High Fan-Out)',
      expectedRisk: '84% HIGH',
      mitre: 'T1046 (Network Service Discovery)',
      desc: 'Horizontal reconnaissance probing internal daemon versions for exploit openings.'
    },
    {
      id: 'bruteforce',
      name: 'SSH Credential Stuffing',
      type: 'R2L',
      src: '172.16.0.45',
      dst: '10.0.0.12',
      proto: 'TCP',
      srv: 'SSH (22)',
      count: 85,
      bytes: '8,400 / 2,100',
      fanIn: '0.78 (Repetitive Failures)',
      expectedRisk: '88% HIGH',
      mitre: 'T1110 (Brute Force)',
      desc: 'Automated dictionary attack attempting unauthorized remote-to-local administrative access.'
    },
    {
      id: 'u2r',
      name: 'Kernel Privilege Escalation',
      type: 'U2R',
      src: '10.0.0.88',
      dst: '10.0.0.1',
      proto: 'TCP',
      srv: 'Telnet (23)',
      count: 14,
      bytes: '12,500 / 4,300',
      fanIn: '0.92 (Root Shell Invocation)',
      expectedRisk: '98% CRITICAL',
      mitre: 'T1068 (Privilege Escalation)',
      desc: 'Buffer overflow exploit by an unprivileged user attempting unauthorized root acquisition.'
    }
  ];

  // Interactive Live Pipeline Simulation
  const runLiveSimulation = async () => {
    setIsSimulating(true);
    setSimStep(1); // Ingest
    setSimResult(null);

    await new Promise((r) => setTimeout(r, 600));
    setSimStep(2); // Preprocess & ML

    await new Promise((r) => setTimeout(r, 700));
    setSimStep(3); // NetworkX Graph

    await new Promise((r) => setTimeout(r, 600));
    setSimStep(4); // Multi-modal Fusion

    await new Promise((r) => setTimeout(r, 650));
    setSimStep(5); // Completed Output

    try {
      const res = await api.loadDemoData(selectedScenario);
      setSimResult(res);
      if (onScenarioInjected) {
        onScenarioInjected();
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const currentScenarioData = scenarios.find((s) => s.id === selectedScenario) || scenarios[0];

  return (
    <div className={`bg-[#0A0F1D]/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col text-slate-100 ${isModal ? 'max-h-[90vh] w-full max-w-5xl' : 'p-5'}`}>
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-bl from-cyan-500/10 via-blue-500/5 to-transparent pointer-events-none" />

      {/* ── ALERT BANNER ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-950/70 via-slate-900/90 to-cyan-950/70 border-b border-amber-500/30 px-5 py-3.5 relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0">
            <AlertOctagon className="w-6 h-6 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/50 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 font-mono">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                SYSTEM ALERT BRIEFING // PROTOCOL DIRECTIVE
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline font-medium">
                Review System Flow Before Accessing Dashboard
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight mt-0.5">
              MANDATORY INFORMATION: HOW DATA INPUT, DETECTION FUNCTION &amp; OUTPUT OPERATE
            </h2>
          </div>
        </div>

        {/* Close Button if Modal */}
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="self-end sm:self-auto p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700 shadow-xs"
            title="Close Alert and Enter Dashboard"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Header Section */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 ${isModal ? 'px-5 pt-4' : ''}`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold uppercase tracking-wider font-mono">
              SYSTEM ARCHITECTURE GUIDE
            </span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Interactive Walkthrough
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Understand how raw network telemetry is ingested, classified with Random Forest &amp; Graph Topology, fused, and translated into AI explanations.
          </p>
        </div>

        {/* Pillar Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#070B14] p-1.5 rounded-xl border border-slate-800 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('input')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'input'
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>1. Data Input</span>
          </button>

          <button
            onClick={() => setActiveTab('function')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'function'
                ? 'bg-amber-600 text-white shadow-xs shadow-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>2. How It Functions</span>
          </button>

          <button
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'output'
                ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>3. Output Generated</span>
          </button>

          <button
            onClick={() => setActiveTab('live_try')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'live_try'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xs shadow-cyan-500/40'
                : 'text-cyan-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ Interactive Simulator</span>
          </button>
        </div>
      </div>

      {/* Scrollable Tab Content Area */}
      <div className={`overflow-y-auto flex-1 space-y-4 ${isModal ? 'p-5' : 'pt-4'}`}>
        {/* ── TAB 1: HOW DATA INPUT WORKS ────────────────────────────────────── */}
        {activeTab === 'input' && (
          <div className="pt-2 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Method A */}
              <div className="bg-[#0D1527]/90 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-4 transition-all shadow-md group">
                <div className="flex items-center gap-2 mb-2 text-cyan-400">
                  <FileSpreadsheet className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                    Method A: Dataset Ingestion (CSV / TXT)
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Upload network flow files formatted according to the standard <strong className="text-white">NSL-KDD</strong> benchmark (or PCAP network flow logs).
                </p>
                <div className="bg-[#070B14] p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="text-slate-500 font-bold">// Key Ingested Features:</div>
                  <div>• <span className="text-cyan-400 font-semibold">protocol_type</span>: tcp, udp, icmp</div>
                  <div>• <span className="text-cyan-400 font-semibold">service</span>: http, ssh, smtp, ftp</div>
                  <div>• <span className="text-cyan-400 font-semibold">bytes</span>: src_bytes, dst_bytes</div>
                  <div>• <span className="text-cyan-400 font-semibold">rates</span>: count, serror_rate</div>
                </div>
                <button
                  onClick={() => navigate('/detect')}
                  className="mt-3.5 w-full py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-blue-800/60"
                >
                  <span>Go to File Upload Page</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Method B */}
              <div className="bg-[#0D1527]/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 transition-all shadow-md group">
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                  <Radio className="w-4 h-4 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                    Method B: Live 3s Telemetry Stream
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  The SOC dashboard continuously ingests live packets in <strong className="text-white">3-second cadences</strong> directly from perimeter sensor taps.
                </p>
                <div className="bg-[#070B14] p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="text-slate-500 font-bold">// Real-Time Telemetry:</div>
                  <div>• <span className="text-emerald-400 font-semibold">throughput</span>: 14,800+ pkts/s</div>
                  <div>• <span className="text-emerald-400 font-semibold">bandwidth</span>: ~4.2 TB/s monitoring</div>
                  <div>• <span className="text-emerald-400 font-semibold">fan_in</span>: Volumetric alarms</div>
                  <div>• <span className="text-emerald-400 font-semibold">window</span>: Rolling 60s slice</div>
                </div>
                <div className="mt-3.5 p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-[11px] font-bold text-center flex items-center justify-center gap-2 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Currently Active on Dashboard</span>
                </div>
              </div>

              {/* Method C */}
              <div className="bg-[#0D1527]/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 transition-all shadow-md group">
                <div className="flex items-center gap-2 mb-2 text-amber-400">
                  <Sliders className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                    Method C: Pre-loaded Scenarios
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  4 validated attack scenarios ready for academic demonstration and benchmark evaluation without external files.
                </p>
                <div className="bg-[#070B14] p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="text-slate-500 font-bold">// Available Test Scenarios:</div>
                  <div>1. <span className="text-amber-400 font-semibold">DDoS SYN Flood</span> (512 pkts)</div>
                  <div>2. <span className="text-amber-400 font-semibold">APT Recon</span> (240 pkts)</div>
                  <div>3. <span className="text-amber-400 font-semibold">SSH Stuffing</span> (85 pkts)</div>
                  <div>4. <span className="text-amber-400 font-semibold">Privilege Escalation</span> (14 pkts)</div>
                </div>
                <button
                  onClick={() => setActiveTab('live_try')}
                  className="mt-3.5 w-full py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-amber-800/60"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Select &amp; Inject Scenario</span>
                </button>
              </div>
            </div>

            {/* Ingested row preview */}
            <div className="bg-[#0D1527]/90 border border-slate-800 rounded-2xl p-4 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  Example Ingested Payload Passed to DeepFusion Pipeline:
                </span>
                <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800/60 font-mono">
                  JSON / CSV Record
                </span>
              </div>
              <pre className="bg-[#070B14] p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
{`{
  "timestamp": "${new Date().toISOString()}",
  "source_ip": "192.168.1.105",
  "destination_ip": "10.0.0.5",
  "protocol": "tcp",
  "service": "http",
  "src_bytes": 45820,
  "dst_bytes": 0,
  "count": 512,
  "srv_count": 512,
  "serror_rate": 0.98,
  "flag": "S0" // SYN request sent, zero reply received (Half-open connection flood)
}`}
              </pre>
            </div>
          </div>
        )}

        {/* ── TAB 2: HOW THE PIPELINE FUNCTIONS ──────────────────────────────── */}
        {activeTab === 'function' && (
          <div className="pt-2 space-y-4 animate-in fade-in duration-200">
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              DeepFusionGuard processes every network connection through a <strong className="text-white">4-Stage Multi-Modal Architecture</strong>:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Stage 1 */}
              <div className="bg-[#0D1527]/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/60 font-mono">
                      STAGE 01
                    </span>
                    <Cpu className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1">
                    Random Forest ML Model
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-normal mb-3">
                    Statistical packet classifier trained with <strong>120 Trees</strong> on balanced NSL-KDD benchmark records.
                  </p>
                  <div className="bg-[#070B14] p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1">
                    <div className="text-blue-400 font-bold">// Function Output:</div>
                    <div>• Label: DoS, Probe, R2L, Normal</div>
                    <div>• Confidence: <span className="text-emerald-400 font-bold">98.4%</span></div>
                    <div>• Fusion Weight: <strong>60%</strong></div>
                  </div>
                </div>
              </div>

              {/* Stage 2 */}
              <div className="bg-[#0D1527]/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 font-mono">
                      STAGE 02
                    </span>
                    <Share2 className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1">
                    NetworkX Graph Engine
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-normal mb-3">
                    Builds directed graph <em>G = (V, E)</em> mapping host communication topology and structural anomalies.
                  </p>
                  <div className="bg-[#070B14] p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1">
                    <div className="text-indigo-400 font-bold">// Topological Metrics:</div>
                    <div>• Fan-In: High convergence (DoS)</div>
                    <div>• Fan-Out: High divergence (Probe)</div>
                    <div>• Graph Risk: <span className="text-amber-400 font-bold">0.92</span></div>
                  </div>
                </div>
              </div>

              {/* Stage 3 */}
              <div className="bg-[#0D1527]/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60 font-mono">
                      STAGE 03
                    </span>
                    <Flame className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1">
                    Multi-Modal Threat Fusion
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-normal mb-3">
                    Synthesizes packet ML probability with topological graph risk using calibrated mathematical weighting.
                  </p>
                  <div className="bg-[#070B14] p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1">
                    <div className="text-amber-400 font-bold">// Mathematical Fusion:</div>
                    <div className="text-cyan-400 font-bold">Score = 0.60×ML + 0.40×Graph</div>
                    <div>• Final Score: <span className="text-rose-400 font-bold">0.94</span></div>
                    <div>• Severity: <span className="text-rose-400 font-bold">CRITICAL</span></div>
                  </div>
                </div>
              </div>

              {/* Stage 4 */}
              <div className="bg-[#0D1527]/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-mono">
                      STAGE 04
                    </span>
                    <Bot className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1">
                    LLM Threat Explainer
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-normal mb-3">
                    Converts mathematical vectors into plain-English analyst reasoning with MITRE ATT&amp;CK mapping.
                  </p>
                  <div className="bg-[#070B14] p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1">
                    <div className="text-emerald-400 font-bold">// Analyst Intelligence:</div>
                    <div>• MITRE: <span>T1498 (DoS)</span></div>
                    <div>• Action: Drop IP, SYN cookies</div>
                    <div>• Impact: Service starvation</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: HOW OUTPUT IS PRESENTED ─────────────────────────────────── */}
        {activeTab === 'output' && (
          <div className="pt-2 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0D1527]/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-cyan-400">
                    <Activity className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      1. Recharts Timeline
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Visualizes time-series traffic velocity with crimson spikes representing attacks vs. blue benign baseline.
                  </p>
                  <div className="bg-[#070B14] p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <div className="flex items-center justify-between text-blue-400 font-medium">
                      <span>• Benign Flow:</span>
                      <span className="font-bold">Blue Smooth Curve</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-400 font-medium">
                      <span>• Malicious Spikes:</span>
                      <span className="font-bold">Crimson Area Burst</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="mt-3.5 w-full py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-cyan-300 text-xs font-bold border border-blue-800/60"
                >
                  View Live Chart
                </button>
              </div>

              <div className="bg-[#0D1527]/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-indigo-400">
                    <Layers className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      2. Interactive Topology Graph
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Canvas rendering network communications with color-coded nodes for targets, botnet sources, and gateway hubs.
                  </p>
                  <div className="bg-[#070B14] p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <div className="text-rose-400 font-medium">• Red Node: Compromised / Attacker</div>
                    <div className="text-amber-400 font-medium">• Amber Node: Targeted Host</div>
                    <div className="text-cyan-400 font-medium">• Blue Node: Benign Host</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/graph')}
                  className="mt-3.5 w-full py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 text-xs font-bold border border-indigo-800/60"
                >
                  Open Network Graph
                </button>
              </div>

              <div className="bg-[#0D1527]/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-emerald-400">
                    <Bot className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      3. AI Threat Explainer
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Synthesizes multi-stage findings into executive summary reports and concrete firewall mitigation rules.
                  </p>
                  <div className="bg-[#070B14] p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <div className="text-slate-300 font-medium">• Executive summary for CISOs</div>
                    <div className="text-slate-300 font-medium">• MITRE ATT&amp;CK matrix tactics</div>
                    <div className="text-emerald-400 font-semibold">• Direct iptables rules</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/analysis')}
                  className="mt-3.5 w-full py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold border border-emerald-800/60"
                >
                  Open AI Explainer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: INTERACTIVE LIVE SIMULATOR (WITH FIXED RESPONSIVE CONTROLS) ── */}
        {activeTab === 'live_try' && (
          <div className="pt-2 space-y-4 animate-in fade-in duration-200">
            {/* Control Bar: Never overflows the container */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-[#070B14] border border-cyan-500/30 shadow-lg">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Select Attack Scenario to Simulate Through Pipeline:</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  Observe step-by-step how input transforms into machine learning output and AI explanations.
                </p>
              </div>

              {/* Robust responsive wrapper: Wrap gracefully without overflowing */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  disabled={isSimulating}
                  className="flex-1 sm:flex-initial min-w-[200px] px-3.5 py-2 rounded-xl bg-[#0D1527] border border-slate-700 text-cyan-300 text-xs font-bold outline-none cursor-pointer shadow-inner focus:ring-2 focus:ring-cyan-500/30 font-mono"
                >
                  {scenarios.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name} ({sc.type})
                    </option>
                  ))}
                </select>

                <button
                  onClick={runLiveSimulation}
                  disabled={isSimulating}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/25 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 active:scale-95 shrink-0"
                >
                  {isSimulating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Pipeline...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Pipeline Simulation</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Stepper Visualization */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              {[
                { step: 1, label: '1. Ingestion', desc: 'Packet parsed', icon: Database },
                { step: 2, label: '2. Random Forest', desc: 'Statistical ML', icon: Cpu },
                { step: 3, label: '3. NetworkX', desc: 'Graph Topology', icon: Share2 },
                { step: 4, label: '4. Fusion Engine', desc: 'Multi-Modal Risk', icon: Flame },
                { step: 5, label: '5. LLM Explanation', desc: 'SOC Intel Ready', icon: Bot },
              ].map((st) => {
                const isDone = simStep >= st.step;
                const isCurrent = simStep === st.step;

                return (
                  <div
                    key={st.step}
                    className={`p-3 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-blue-950/80 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/30 ring-2 ring-cyan-500/30'
                        : isDone
                        ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300'
                        : 'bg-[#070B14] border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <st.icon className="w-4 h-4" />
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="font-bold text-white text-[11px] truncate">{st.label}</div>
                    <div className="text-[10px] text-slate-400 truncate font-mono">{st.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* Simulation Output Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input Data Card */}
              <div className="bg-[#0D1527]/90 p-4 rounded-2xl border border-slate-800 shadow-md text-xs space-y-2">
                <div className="text-cyan-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Database className="w-3.5 h-3.5" />
                  Raw Input Ingested:
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-slate-800 font-mono">
                  <div><span className="text-slate-500">Source IP:</span> <span className="text-rose-400 font-bold ml-1">{currentScenarioData.src}</span></div>
                  <div><span className="text-slate-500">Target IP:</span> <span className="text-white font-bold ml-1">{currentScenarioData.dst}</span></div>
                  <div><span className="text-slate-500">Protocol:</span> <span className="text-cyan-400 font-bold ml-1">{currentScenarioData.proto}</span></div>
                  <div><span className="text-slate-500">Service:</span> <span className="text-amber-400 font-bold ml-1">{currentScenarioData.srv}</span></div>
                  <div><span className="text-slate-500">Packets:</span> <span className="text-white ml-1">{currentScenarioData.count}</span></div>
                  <div><span className="text-slate-500">Bytes:</span> <span className="text-white ml-1">{currentScenarioData.bytes}</span></div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#070B14] text-[11px] text-slate-300 border border-slate-800">
                  {currentScenarioData.desc}
                </div>
              </div>

              {/* Synthesized Output Card */}
              <div className="bg-[#0D1527]/90 p-4 rounded-2xl border border-slate-800 shadow-md text-xs space-y-2">
                <div className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Synthesized Output Generated:
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-slate-800 font-mono">
                  <div>
                    <span className="text-slate-500">Attack Type:</span>
                    <span className="text-rose-400 font-bold block">{currentScenarioData.type} ({currentScenarioData.name})</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Severity:</span>
                    <span className="text-rose-400 font-bold block">{currentScenarioData.expectedRisk}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Graph Risk:</span>
                    <span className="text-indigo-400 font-bold block">{currentScenarioData.fanIn}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">MITRE Technique:</span>
                    <span className="text-emerald-400 font-bold block">{currentScenarioData.mitre}</span>
                  </div>
                </div>

                {simResult ? (
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-600/60 text-emerald-300 text-[11px] flex items-center justify-between font-medium">
                    <span>✓ Telemetry successfully fused &amp; added to Dashboard!</span>
                    <button
                      onClick={() => navigate('/analysis')}
                      className="underline text-cyan-300 font-bold hover:text-white ml-2 cursor-pointer"
                    >
                      View Explanation →
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#070B14] text-[11px] text-slate-400 border border-slate-800 font-medium">
                    Click "Run Pipeline Simulation" above to execute through the live Python Flask backend.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── ACTION FOOTER: ACKNOWLEDGE & ENTER DASHBOARD ──────────────────────── */}
      <div className={`bg-[#070B14] border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${isModal ? 'px-5 py-4' : 'pt-4 mt-2'}`}>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>SOC Protocol Initialized · All Detection Models Active</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isModal && onClose ? (
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold tracking-wide shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 group"
            >
              <CheckCircle2 className="w-4 h-4 text-cyan-200 group-hover:scale-110 transition-transform" />
              <span>ACKNOWLEDGE ALERT &amp; ENTER SOC DASHBOARD</span>
              <ArrowRight className="w-4 h-4 text-cyan-200 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/detect')}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/30"
            >
              <span>Open Detection Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemArchitectureGuide;
