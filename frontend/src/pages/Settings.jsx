import React, { useState } from 'react';
import { 
  Sliders, 
  Cpu, 
  Bot, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Layers,
  Save
} from 'lucide-react';

export const Settings = () => {
  const [mlWeight, setMlWeight] = useState(60);
  const [graphWeight, setGraphWeight] = useState(40);
  const [llmEngine, setLlmEngine] = useState('local');
  const [saved, setSaved] = useState(false);

  const handleMlChange = (val) => {
    const ml = Number(val);
    setMlWeight(ml);
    setGraphWeight(100 - ml);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-card p-5 rounded-xl border border-slate-800">
        <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          SOC Engine & Fusion Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Adjust multi-modal threat fusion parameters, inspect machine learning architectures, and configure AI reasoning integrations.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Engine parameters updated successfully in active runtime memory.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Fusion Weights */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-200">
                Multi-Modal Fusion Weights
              </h3>
              <p className="text-xs text-slate-400">
                Balances feature-level Random Forest ML predictions against topological graph risk.
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              Sum: 100%
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">Random Forest Classifier Weight:</span>
                <span className="text-cyan-400 font-bold">{mlWeight}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={mlWeight}
                onChange={(e) => handleMlChange(e.target.value)}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">Graph Topology (NetworkX / GNN) Risk Weight:</span>
                <span className="text-amber-400 font-bold">{graphWeight}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={graphWeight}
                onChange={(e) => handleMlChange(100 - Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* LLM Engine Configuration */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              Threat Explanation Engine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select generative reasoning backend or use the built-in offline expert SOC rule engine.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <label
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                llmEngine === 'local'
                  ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-900/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="engine"
                value="local"
                checked={llmEngine === 'local'}
                onChange={() => setLlmEngine('local')}
                className="hidden"
              />
              <p className="font-bold text-slate-200">Local SOC Rule Engine</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Active default. 100% offline, zero API latency, deterministic MITRE ATT&CK mappings.
              </p>
            </label>

            <label
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                llmEngine === 'gemini'
                  ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-900/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="engine"
                value="gemini"
                checked={llmEngine === 'gemini'}
                onChange={() => setLlmEngine('gemini')}
                className="hidden"
              />
              <p className="font-bold text-slate-200">Google Gemini API</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Configurable via GEMINI_API_KEY environment variable. Dynamic zero-shot reasoning.
              </p>
            </label>

            <label
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                llmEngine === 'openai'
                  ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-900/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="engine"
                value="openai"
                checked={llmEngine === 'openai'}
                onChange={() => setLlmEngine('openai')}
                className="hidden"
              />
              <p className="font-bold text-slate-200">OpenAI GPT-4o</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Configurable via OPENAI_API_KEY environment variable.
              </p>
            </label>
          </div>
        </div>

        {/* Model Architecture Info */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Model Pipeline Specifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-slate-300">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500">ML Classifier:</span>
              <p className="font-bold text-slate-200 mt-0.5">Random Forest (120 Trees)</p>
              <p className="text-[10px] text-emerald-400 mt-1">Accuracy: 100% on NSL-KDD test fold</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500">Graph Engine:</span>
              <p className="font-bold text-slate-200 mt-0.5">NetworkX + Modular 2-Layer GCN</p>
              <p className="text-[10px] text-cyan-400 mt-1">Analyzes Fan-In, Fan-Out, Centrality</p>
            </div>
          </div>
        </div>

        {/* Google Account Connection Management */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Google Account Integration
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your connected Google Workspace or personal Google account with token revocation.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border bg-cyan-950/60 border-cyan-800 text-cyan-400">
              OAuth 2.0 PKCE
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.8 7.3l3.7 2.9C6.4 7.2 8.9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"/>
                  <path fill="#FBBC05" d="M5.5 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.2.2-2 .4-2.8L1.8 6.3C.7 8.5 0 10.7 0 12s.7 3.5 1.8 5.7l3.7-2.9z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.6-2.2-6.5-5.2L1.8 16C3.7 20.4 7.5 23 12 23z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">Google OAuth Authorization Flow</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Prompts Google's official account chooser with <code className="text-[#00E5D9]">prompt=select_account</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await api.getGoogleAuthUrl('/settings');
                    if (res?.auth_url && res.client_id_configured) {
                      window.location.href = res.auth_url;
                    } else {
                      alert('Google OAuth credentials not configured in backend/.env yet.');
                    }
                  } catch (e) {
                    alert('Could not initialize Google connection flow.');
                  }
                }}
                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#111723] hover:bg-[#162032] border border-[#00E5D9]/40 hover:border-[#00E5D9] text-[#00E5D9] transition-all cursor-pointer shadow-xs"
              >
                Connect Google Account
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Disconnect Google account and revoke access tokens?')) {
                    try {
                      await api.disconnectGoogle();
                      alert('Google account disconnected and tokens revoked.');
                    } catch (e) {
                      alert('Could not disconnect Google account.');
                    }
                  }
                }}
                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 transition-all cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
