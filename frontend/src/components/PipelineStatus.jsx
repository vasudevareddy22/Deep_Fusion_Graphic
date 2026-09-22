import React from 'react';
import { Database, Filter, Cpu, Share2, Flame, Bot, CheckCircle2 } from 'lucide-react';

export const PipelineStatus = ({ currentStep = 5, isProcessing = false }) => {
  const steps = [
    { id: 1, name: 'Data Ingestion', desc: 'CSV / TXT Validated', icon: Database },
    { id: 2, name: 'Preprocessing', desc: 'Normalized & Scaled', icon: Filter },
    { id: 3, name: 'ML Classifier', desc: 'Random Forest Inference', icon: Cpu },
    { id: 4, name: 'Graph Analysis', desc: 'NetworkX / GNN Topology', icon: Share2 },
    { id: 5, name: 'Threat Fusion', desc: 'Multi-Modal Risk Fused', icon: Flame },
    { id: 6, name: 'LLM Reasoning', desc: 'Threat Explanations Generated', icon: Bot },
  ];

  return (
    <div className="glass-card p-4 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          DeepFusion Multi-Modal Detection Pipeline
        </h4>
        <span className="text-xs font-mono text-slate-400">
          {isProcessing ? 'Status: PROCESSING TELEMETRY...' : 'Status: PIPELINE READY'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const isDone = currentStep >= step.id;
          const isActive = currentStep === step.id && isProcessing;

          return (
            <div
              key={step.id}
              className={`p-2.5 rounded-lg border transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-cyan-500/20 glow-cyan animate-pulse'
                  : isDone
                  ? 'bg-slate-900/80 border-slate-700/60 text-slate-200'
                  : 'bg-slate-950/40 border-slate-900 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isDone ? 'bg-cyan-500/20 text-cyan-400 font-semibold' : 'bg-slate-800 text-slate-500'
                }`}>
                  0{step.id}
                </span>
                {isDone && !isActive && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${isDone ? 'text-cyan-400' : 'text-slate-500'}`} />
                <p className="text-xs font-medium truncate">{step.name}</p>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineStatus;
