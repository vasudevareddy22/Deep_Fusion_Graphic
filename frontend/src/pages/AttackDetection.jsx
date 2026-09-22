import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  FileText, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Cpu, 
  Share2, 
  Flame, 
  Bot, 
  ArrowRight,
  Database,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import PipelineStatus from '../components/PipelineStatus';
import ThreatBadge from '../components/ThreatBadge';
import RiskGauge from '../components/RiskGauge';

export const AttackDetection = () => {
  const [file, setFile] = useState(null);
  const [uploadInfo, setUploadInfo] = useState(null);
  const [pipelineStep, setPipelineStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Handle Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = async (selectedFile) => {
    setFile(selectedFile);
    setError('');
    setDetectionResult(null);
    setPipelineStep(1);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.uploadDataset(formData);
      setUploadInfo(res);
      setPipelineStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload dataset. Ensure it is a valid CSV or TXT file.');
    }
  };

  const [selectedScenario, setSelectedScenario] = useState('default');

  // Run full detection pipeline
  const executePipeline = async (useSample = false, scenarioOverride = null) => {
    setIsProcessing(true);
    setError('');
    setDetectionResult(null);
    const scenarioToRun = scenarioOverride || selectedScenario;

    try {
      // Step 2 -> 3
      setPipelineStep(2);
      await new Promise((r) => setTimeout(r, 400));
      
      // Step 3: ML
      setPipelineStep(3);
      await new Promise((r) => setTimeout(r, 500));

      // Call API
      let res;
      if (useSample) {
        res = await api.loadDemoData(scenarioToRun);
      } else {
        res = await api.runDetection({ filename: uploadInfo?.filename });
      }

      // Step 4: Graph
      setPipelineStep(4);
      await new Promise((r) => setTimeout(r, 450));

      // Step 5: Fusion
      setPipelineStep(5);
      await new Promise((r) => setTimeout(r, 400));

      // Step 6: LLM & Final
      setPipelineStep(6);
      setDetectionResult(res);
    } catch (err) {
      setError(err.response?.data?.error || 'Detection pipeline execution failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const scenarios = [
    { id: 'default', label: 'Balanced Enterprise', desc: 'Mixed NSL-KDD Traffic' },
    { id: 'ddos', label: 'DDoS Storm', desc: 'High Fan-In SYN Flood (10.0.0.5)' },
    { id: 'recon', label: 'APT Reconnaissance', desc: 'Portsweep & Host Scanning' },
    { id: 'bruteforce', label: 'SSH Brute Force (R2L)', desc: 'Credential Stuffing Attacks' },
    { id: 'u2r', label: 'Privilege Escalation', desc: 'Root Buffer Overflow (U2R)' }
  ];

  const summary = detectionResult?.summary;
  const topThreat = detectionResult?.top_threat;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-card p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Multi-Modal Attack Detection Pipeline
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ingest network connection logs (NSL-KDD format), execute Random Forest classification, analyze topological graph risks, and fuse signals into actionable SOC threat intelligence.
          </p>
        </div>

        {/* Quick Scenario Selector & Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            disabled={isProcessing}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs outline-none cursor-pointer"
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                Scenario: {sc.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => executePipeline(true)}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Inject Dataset Scenario</span>
          </button>
        </div>
      </div>

      {/* Visual Pipeline Status Stepper */}
      <PipelineStatus currentStep={pipelineStep} isProcessing={isProcessing} />

      {/* Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Container */}
        <div className="lg:col-span-1 glass-card p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              Dataset Ingestion
            </h3>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500/70 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-900/40 hover:bg-cyan-950/20 group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                accept=".csv,.txt"
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-cyan-900/50 flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:text-cyan-400 transition-colors">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-slate-200">
                Drag & Drop CSV / TXT or <span className="text-cyan-400 underline">Browse</span>
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                Supports NSL-KDD, KDDCup99, or custom traffic logs
              </p>
            </div>

            {/* Selected File Details */}
            {uploadInfo && (
              <div className="mt-4 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-200">
                  <span className="flex items-center gap-1.5 truncate">
                    <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    {file?.name || uploadInfo.filename}
                  </span>
                  <span className="text-cyan-400 font-bold">{uploadInfo.total_rows} rows</span>
                </div>
                <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Validated & Schema Verified
                </p>
              </div>
            )}

            {error && (
              <div className="mt-3 p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <button
              onClick={() => executePipeline(false)}
              disabled={!uploadInfo || isProcessing}
              className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Multi-Modal Detection</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Primary Detection Result Card */}
        <div className="lg:col-span-2 glass-card p-5 rounded-xl border border-slate-800">
          {!detectionResult ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Database className="w-12 h-12 text-slate-700 mb-3" />
              <h4 className="text-sm font-semibold text-slate-300 font-mono">No Telemetry Analyzed Yet</h4>
              <p className="text-xs max-w-sm mt-1">
                Upload a CSV network traffic log or click <span className="text-cyan-400 font-medium">"Run Pre-Loaded NSL-KDD Dataset"</span> to trigger the multi-modal detection engine.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Highlight Result Banner */}
              <div className={`p-4 rounded-xl border ${
                summary.attack_records > 0
                  ? 'bg-rose-950/30 border-rose-600/50 glow-red'
                  : 'bg-emerald-950/30 border-emerald-600/50 glow-emerald'
              } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${
                    summary.attack_records > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {summary.attack_records > 0 ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-mono text-white">
                      {summary.attack_records > 0 ? 'CYBER ATTACK DETECTED' : 'TRAFFIC VERIFIED CLEAN'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {summary.attack_records > 0
                        ? `Identified ${summary.attack_records} malicious network flows across ${summary.attack_types.join(', ')} attack vectors.`
                        : 'All examined sessions strictly match authorized benign network traffic profiles.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <ThreatBadge type={summary.highest_severity} variant="severity" />
                  <button
                    onClick={() => navigate('/analysis', { state: { threat: topThreat } })}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono font-medium border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>View AI Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Metric Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Total Analyzed</span>
                  <p className="text-xl font-bold text-slate-100 mt-0.5">{summary.total_records}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Normal Records</span>
                  <p className="text-xl font-bold text-emerald-400 mt-0.5">{summary.normal_records}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Attack Records</span>
                  <p className="text-xl font-bold text-rose-400 mt-0.5">{summary.attack_records}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Avg ML Confidence</span>
                  <p className="text-xl font-bold text-cyan-400 mt-0.5">{summary.average_confidence}%</p>
                </div>
              </div>

              {/* Top Threat Preview */}
              {topThreat && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                      Primary Threat Vector Focus
                    </span>
                    <ThreatBadge type={topThreat.attack_type} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-400">Attacker Source:</span>
                      <p className="text-rose-400 font-bold">{topThreat.source_ip}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Victim Target:</span>
                      <p className="text-slate-200 font-bold">{topThreat.destination_ip}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Fused Risk Score:</span>
                      <p className="text-amber-400 font-bold">{(topThreat.final_risk_score * 100).toFixed(1)}% ({topThreat.severity})</p>
                    </div>
                  </div>
                  {topThreat.explanation && (
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
                      <p className="text-slate-300 leading-relaxed font-sans">
                        <span className="font-semibold text-cyan-400 font-mono">AI Assessment: </span>
                        {topThreat.explanation.what_happened}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Detected Events Table */}
      {detectionResult && (
        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-200">
                Detailed Telemetry Breakdown ({detectionResult.records.length} Records)
              </h3>
              <p className="text-xs text-slate-400">Multi-modal scores per individual network connection session</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2">Source IP</th>
                  <th className="pb-2">Target IP</th>
                  <th className="pb-2">Proto</th>
                  <th className="pb-2">Service</th>
                  <th className="pb-2">Classification</th>
                  <th className="pb-2">ML Conf</th>
                  <th className="pb-2">Graph Risk</th>
                  <th className="pb-2">Final Risk</th>
                  <th className="pb-2">Severity</th>
                  <th className="pb-2 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {detectionResult.records.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className={`py-2 font-semibold ${rec.is_attack ? 'text-rose-400' : 'text-slate-300'}`}>
                      {rec.source_ip}
                    </td>
                    <td className="py-2 text-slate-300">{rec.destination_ip}</td>
                    <td className="py-2 uppercase text-slate-400">{rec.protocol}</td>
                    <td className="py-2 text-slate-400">{rec.service}</td>
                    <td className="py-2">
                      <ThreatBadge type={rec.attack_type} />
                    </td>
                    <td className="py-2 text-cyan-400 font-bold">{(rec.ml_confidence * 100).toFixed(0)}%</td>
                    <td className="py-2 text-amber-400 font-bold">{rec.graph_risk.toFixed(2)}</td>
                    <td className="py-2 text-rose-400 font-bold">{(rec.final_risk_score * 100).toFixed(0)}%</td>
                    <td className="py-2">
                      <ThreatBadge type={rec.severity} variant="severity" />
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => navigate('/analysis', { state: { threat: rec } })}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-400 border border-slate-700 text-[11px] cursor-pointer"
                      >
                        Explain
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttackDetection;
