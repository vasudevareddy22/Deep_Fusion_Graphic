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
    <div className={`bg-white border border-blue-100 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col text-slate-800 ${isModal ? 'max-h-[90vh] w-full max-w-5xl' : 'p-5'}`}>
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-bl from-blue-500/5 via-indigo-500/5 to-transparent pointer-events-none" />

      {/* ── ALERT BANNER ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-50 via-blue-50 to-indigo-50 border-b border-amber-200 px-5 py-3.5 relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0">
            <AlertOctagon className="w-6 h-6 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                SYSTEM ALERT BRIEFING // PROTOCOL DIRECTIVE
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline font-medium">
                Review System Flow Before Accessing Dashboard
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight mt-0.5">
              MANDATORY INFORMATION: HOW DATA INPUT, DETECTION FUNCTION &amp; OUTPUT OPERATE
            </h2>
          </div>
        </div>

        {/* Close Button if Modal */}
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="self-end sm:self-auto p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border border-slate-200 shadow-xs"
            title="Close Alert and Enter Dashboard"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Header Section */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-blue-50 ${isModal ? 'px-5 pt-4' : ''}`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
              SYSTEM ARCHITECTURE GUIDE
            </span>
            <span className="text-xs text-slate-300">·</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Interactive Walkthrough
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Understand how raw network telemetry is ingested, classified with Random Forest &amp; Graph Topology, fused, and translated into AI explanations.
          </p>
        </div>

        {/* Pillar Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-blue-50/70 p-1.5 rounded-xl border border-blue-100 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('input')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'input'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-blue-600'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>1. Data Input</span>
          </button>

          <button
            onClick={() => setActiveTab('function')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'function'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>2. How It Functions</span>
          </button>

          <button
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'output'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>3. Output Generated</span>
          </button>

          <button
            onClick={() => setActiveTab('live_try')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'live_try'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-600 hover:bg-blue-100/60'
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
              <div className="bg-white border border-blue-100 hover:border-blue-300 rounded-2xl p-4 transition-all shadow-xs group">
                <div className="flex items-center gap-2 mb-2 text-blue-600">
                  <FileSpreadsheet className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Method A: Dataset Ingestion (CSV / TXT)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  Upload network flow files formatted according to the standard <strong>NSL-KDD</strong> benchmark (or PCAP network flow logs).
                </p>
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-[11px] font-mono text-slate-600 space-y-1">
                  <div className="text-slate-400 font-bold">// Key Ingested Features:</div>
                  <div>• <span className="text-blue-600 font-semibold">protocol_type</span>: tcp, udp, icmp</div>
                  <div>• <span className="text-blue-600 font-semibold">service</span>: http, ssh, smtp, ftp</div>
                  <div>• <span className="text-blue-600 font-semibold">bytes</span>: src_bytes, dst_bytes</div>
                  <div>• <span className="text-blue-600 font-semibold">rates</span>: count, serror_rate</div>
                </div>
                <button
                  onClick={() => navigate('/detect')}
                  className="mt-3.5 w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
                >
                  <span>Go to File Upload Page</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Method B */}
              <div className="bg-white border border-blue-100 hover:border-emerald-300 rounded-2xl p-4 transition-all shadow-xs group">
                <div className="flex items-center gap-2 mb-2 text-emerald-600">
                  <Radio className="w-4 h-4 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Method B: Live 3s Telemetry Stream
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  The SOC dashboard continuously ingests live packets in <strong>3-second cadences</strong> directly from perimeter sensor taps.
                </p>
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-[11px] font-mono text-slate-600 space-y-1">
                  <div className="text-slate-400 font-bold">// Real-Time Telemetry:</div>
                  <div>• <span className="text-emerald-700 font-semibold">throughput</span>: 14,800+ pkts/s</div>
                  <div>• <span className="text-emerald-700 font-semibold">bandwidth</span>: ~4.2 TB/s monitoring</div>
                  <div>• <span className="text-emerald-700 font-semibold">fan_in</span>: Volumetric alarms</div>
                  <div>• <span className="text-emerald-700 font-semibold">window</span>: Rolling 60s slice</div>
                </div>
                <div className="mt-3.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold text-center flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Currently Active on Dashboard</span>
                </div>
              </div>

              {/* Method C */}
              <div className="bg-white border border-blue-100 hover:border-amber-300 rounded-2xl p-4 transition-all shadow-xs group">
                <div className="flex items-center gap-2 mb-2 text-amber-600">
                  <Sliders className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Method C: Pre-loaded Scenarios
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  4 validated attack scenarios ready for academic demonstration and benchmark evaluation without external files.
                </p>
                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 text-[11px] font-mono text-slate-600 space-y-1">
                  <div className="text-slate-400 font-bold">// Available Test Scenarios:</div>
                  <div>1. <span className="text-amber-700 font-semibold">DDoS SYN Flood</span> (512 pkts)</div>
                  <div>2. <span className="text-amber-700 font-semibold">APT Recon</span> (240 pkts)</div>
                  <div>3. <span className="text-amber-700 font-semibold">SSH Stuffing</span> (85 pkts)</div>
                  <div>4. <span className="text-amber-700 font-semibold">Privilege Escalation</span> (14 pkts)</div>
                </div>
                <button
                  onClick={() => setActiveTab('live_try')}
                  className="mt-3.5 w-full py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-amber-200"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Select &amp; Inject Scenario</span>
                </button>
              </div>
            </div>

            {/* Ingested row preview */}
            <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-blue-600" />
                  Example Ingested Payload Passed to DeepFusion Pipeline:
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  JSON / CSV Record
                </span>
              </div>
              <pre className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700 overflow-x-auto">
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
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              DeepFusionGuard processes every network connection through a <strong>4-Stage Multi-Modal Architecture</strong>:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Stage 1 */}
              <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      STAGE 01
                    </span>
                    <Cpu className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 mb-1">
                    Random Forest ML Model
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-normal mb-3">
                    Statistical packet classifier trained with <strong>120 Trees</strong> on balanced NSL-KDD benchmark records.
                  </p>
                  <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 text-[10px] font-mono text-slate-700 space-y-1">
                    <div className="text-blue-700 font-bold">// Function Output:</div>
                    <div>• Label: DoS, Probe, R2L, Normal</div>
                    <div>• Confidence: <span className="text-emerald-600 font-bold">98.4%</span></div>
                    <div>• Fusion Weight: <strong>60%</strong></div>
                  </div>
                </div>
              </div>

              {/* Stage 2 */}
              <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      STAGE 02
                    </span>
                    <Share2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 mb-1">
                    NetworkX Graph Engine
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-normal mb-3">
                    Builds directed graph <em>G = (V, E)</em> mapping host communication topology and structural anomalies.
                  </p>
                  <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 text-[10px] font-mono text-slate-700 space-y-1">
                    <div className="text-indigo-700 font-bold">// Topological Metrics:</div>
                    <div>• Fan-In: High convergence (DoS)</div>
                    <div>• Fan-Out: High divergence (Probe)</div>
                    <div>• Graph Risk: <span className="text-amber-600 font-bold">0.92</span></div>
                  </div>
                </div>
              </div>

              {/* Stage 3 */}
              <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      STAGE 03
                    </span>
                    <Flame className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 mb-1">
                    Multi-Modal Threat Fusion
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-normal mb-3">
                    Synthesizes packet ML probability with topological graph risk using calibrated mathematical weighting.
                  </p>
                  <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 text-[10px] font-mono text-slate-700 space-y-1">
                    <div className="text-amber-700 font-bold">// Mathematical Fusion:</div>
                    <div className="text-blue-700 font-bold">Score = 0.60×ML + 0.40×Graph</div>
                    <div>• Final Score: <span className="text-rose-600 font-bold">0.94</span></div>
                    <div>• Severity: <span className="text-rose-600 font-bold">CRITICAL</span></div>
                  </div>
                </div>
              </div>

              {/* Stage 4 */}
              <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      STAGE 04
                    </span>
                    <Bot className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 mb-1">
                    LLM Threat Explainer
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-normal mb-3">
                    Converts mathematical vectors into plain-English analyst reasoning with MITRE ATT&amp;CK mapping.
                  </p>
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 text-[10px] font-mono text-slate-700 space-y-1">
                    <div className="text-emerald-700 font-bold">// Analyst Intelligence:</div>
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
              <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-blue-600">
                    <Activity className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      1. Recharts Timeline
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    Visualizes time-series traffic velocity with crimson spikes representing attacks vs. blue benign baseline.
                  </p>
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center justify-between text-blue-700 font-medium">
                      <span>• Benign Flow:</span>
                      <span className="font-bold">Blue Smooth Curve</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-600 font-medium">
                      <span>• Malicious Spikes:</span>
                      <span className="font-bold">Crimson Area Burst</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="mt-3.5 w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200"
                >
                  View Live Chart
                </button>
              </div>

              <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-indigo-600">
                    <Layers className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      2. Interactive Topology Graph
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    Canvas rendering network communications with color-coded nodes for targets, botnet sources, and gateway hubs.
                  </p>
                  <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-[11px] text-slate-600 space-y-1">
                    <div className="text-rose-600 font-medium">• Red Node: Compromised / Attacker</div>
                    <div className="text-amber-600 font-medium">• Amber Node: Targeted Host</div>
                    <div className="text-blue-600 font-medium">• Blue Node: Benign Host</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/graph')}
                  className="mt-3.5 w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200"
                >
                  Open Network Graph
                </button>
              </div>

              <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-emerald-600">
                    <Bot className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      3. AI Threat Explainer
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    Synthesizes multi-stage findings into executive summary reports and concrete firewall mitigation rules.
                  </p>
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-[11px] text-slate-600 space-y-1">
                    <div className="text-slate-700 font-medium">• Executive summary for CISOs</div>
                    <div className="text-slate-700 font-medium">• MITRE ATT&amp;CK matrix tactics</div>
                    <div className="text-emerald-700 font-semibold">• Direct iptables rules</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/analysis')}
                  className="mt-3.5 w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200"
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-xs">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Select Attack Scenario to Simulate Through Pipeline:</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  Observe step-by-step how input transforms into machine learning output and AI explanations.
                </p>
              </div>

              {/* Robust responsive wrapper: Wrap gracefully without overflowing */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  disabled={isSimulating}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-white border border-blue-200 text-slate-800 text-xs font-bold outline-none cursor-pointer shadow-xs focus:ring-2 focus:ring-blue-500/20"
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
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/25 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 active:scale-95 shrink-0"
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
                        ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-xs ring-2 ring-blue-500/20'
                        : isDone
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <st.icon className="w-4 h-4" />
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="font-bold text-slate-800 text-[11px] truncate">{st.label}</div>
                    <div className="text-[10px] text-slate-500 truncate font-medium">{st.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* Simulation Output Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input Data Card */}
              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs text-xs space-y-2">
                <div className="text-blue-700 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  Raw Input Ingested:
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-slate-100 font-medium">
                  <div><span className="text-slate-400">Source IP:</span> <span className="text-rose-600 font-bold ml-1">{currentScenarioData.src}</span></div>
                  <div><span className="text-slate-400">Target IP:</span> <span className="text-slate-900 font-bold ml-1">{currentScenarioData.dst}</span></div>
                  <div><span className="text-slate-400">Protocol:</span> <span className="text-blue-600 font-bold ml-1">{currentScenarioData.proto}</span></div>
                  <div><span className="text-slate-400">Service:</span> <span className="text-amber-600 font-bold ml-1">{currentScenarioData.srv}</span></div>
                  <div><span className="text-slate-400">Packets:</span> <span className="text-slate-900 ml-1">{currentScenarioData.count}</span></div>
                  <div><span className="text-slate-400">Bytes:</span> <span className="text-slate-900 ml-1">{currentScenarioData.bytes}</span></div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-600 border border-slate-200/80">
                  {currentScenarioData.desc}
                </div>
              </div>

              {/* Synthesized Output Card */}
              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs text-xs space-y-2">
                <div className="text-emerald-700 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Synthesized Output Generated:
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-slate-100 font-medium">
                  <div>
                    <span className="text-slate-400">Attack Type:</span>
                    <span className="text-rose-600 font-bold block">{currentScenarioData.type} ({currentScenarioData.name})</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Severity:</span>
                    <span className="text-rose-600 font-bold block">{currentScenarioData.expectedRisk}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Graph Risk:</span>
                    <span className="text-indigo-600 font-bold block">{currentScenarioData.fanIn}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">MITRE Technique:</span>
                    <span className="text-emerald-700 font-bold block">{currentScenarioData.mitre}</span>
                  </div>
                </div>

                {simResult ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center justify-between font-medium">
                    <span>✓ Telemetry successfully fused &amp; added to Dashboard!</span>
                    <button
                      onClick={() => navigate('/analysis')}
                      className="underline text-blue-700 font-bold hover:text-blue-900 ml-2 cursor-pointer"
                    >
                      View Explanation →
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-500 border border-slate-200/80 font-medium">
                    Click "Run Pipeline Simulation" above to execute through the live Python Flask backend.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── ACTION FOOTER: ACKNOWLEDGE & ENTER DASHBOARD ──────────────────────── */}
      <div className={`bg-blue-50/50 border-t border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${isModal ? 'px-5 py-4' : 'pt-4 mt-2'}`}>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>SOC Protocol Initialized · All Detection Models Active</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isModal && onClose ? (
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold tracking-wide shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 group"
            >
              <CheckCircle2 className="w-4 h-4 text-blue-200 group-hover:scale-110 transition-transform" />
              <span>ACKNOWLEDGE ALERT &amp; ENTER SOC DASHBOARD</span>
              <ArrowRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/detect')}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
