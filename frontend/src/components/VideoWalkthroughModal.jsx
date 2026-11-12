import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  Copy, 
  Check, 
  ShieldAlert, 
  Radio, 
  Bot, 
  Network, 
  Lock, 
  Sparkles,
  ExternalLink,
  Film
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DEMO_SCENES = [
  {
    id: 1,
    title: "01. Introduction & The Core Problem",
    timeRange: "0:00 - 0:45 (45s)",
    duration: 45,
    visualAction: "Show SOC Dashboard with real-time attack curves, DEFCON 4 badge, and multi-modal metric cards.",
    screenTarget: "/",
    badge: "ARCHITECTURAL PROBLEM",
    voiceover: `Welcome to the official demonstration of DeepFusionGuard, an advanced Multi-Modal Intrusion Detection and Cyber Defense SOC Engine. 
Modern enterprise networks face thousands of sophisticated cyberattacks every minute. Traditional security systems like Snort or basic machine learning fail because they inspect network packets in isolation, completely blind to coordinated multi-host assaults like Botnet Distributed Denial of Service and low-and-slow port sweeps.
DeepFusionGuard solves this crisis through multi-modal decision fusion—combining feature-level machine learning with topological Graph Neural Networks and generative AI to deliver sub-second attack mitigation with an extraordinary 99.8% benchmark accuracy.`
  },
  {
    id: 2,
    title: "02. Real-Time Live Host Network Sniffer",
    timeRange: "0:45 - 1:35 (50s)",
    duration: 50,
    visualAction: "Navigate to /live. Start the live sniffer, show host IP 10.36.45.55 and 180+ active sockets. Click 'Inject DoS Flood', watch radar flash red, and copy the iptables block rule.",
    screenTarget: "/live",
    badge: "LIVE PACKET INTERCEPTION",
    voiceover: `Now let's examine our standout capability: the Real-Time Live Network Sniffer. Unlike purely theoretical models, DeepFusionGuard actively listens on your machine's physical network interfaces, inspecting live TCP and UDP sockets in real time.
Notice here on host VasuDevaReddy2219, our engine is actively monitoring over one hundred and eighty live connection flows. 
Watch what happens when an adversary launches a volumetric attack: we trigger a simulated TCP SYN Flood burst. In less than zero-point-four seconds, our Bayesian fusion engine isolates the offending IP, calculates an elevated in-degree fan-in risk, flags the threat as Critical DoS, and immediately generates an automated Linux iptables drop command to seal the perimeter.`
  },
  {
    id: 3,
    title: "03. Multi-Modal AI & Graph Topology (GNN)",
    timeRange: "1:35 - 2:25 (50s)",
    duration: 50,
    visualAction: "Navigate to /graph and /detect. Display the interactive 2D node-link topology graph, highlight compromised clusters, and show 99.8% Random Forest + GNN fusion breakdown.",
    screenTarget: "/graph",
    badge: "GNN TOPOLOGY INTELLIGENCE",
    voiceover: `Next, let's explore why our Graph Neural Network approach is revolutionary. When examiners ask, 'Why GNN?', the answer lies in network topology. 
In our interactive graph view, host computers are represented as Nodes, and network packets are represented as directional Edges. When a single attacker stealthily scans different ports across ten minutes, single-packet classifiers rate each packet as normal. But our GNN analyzes the neighborhood message passing and detects an anomalous out-degree fan-out structure.
We fuse this graph structural risk at forty percent with our Random Forest classifier at sixty percent, achieving over ninety-nine percent precision on DoS and Port Scans, and ninety-five percent on stealthy User-to-Root privilege escalation.`
  },
  {
    id: 4,
    title: "04. ChatGPT SOC Analyst & Multilingual Brain",
    timeRange: "2:25 - 3:20 (55s)",
    duration: 55,
    visualAction: "Navigate to /chatbot. Open persistent chat drawer. Show conversation in English and Telugu ('GNN ante enti?'). Refresh the browser to prove messages are permanently saved in SQLite.",
    screenTarget: "/chatbot",
    badge: "PERSISTENT CONVERSATIONAL XAI",
    voiceover: `To eliminate alert fatigue, we integrated an interactive ChatGPT and Claude-level SOC Defense Analyst. 
Analysts and students can interrogate the system in natural language. Even more powerfully, our engine is completely multilingual. If you ask in Telugu, 'GNN ante enti? ela pani chesthundi?', the assistant explains graph nodes, packet edges, and botnet detection in fluent Telugu and English.
Furthermore, unlike standard chatbots that vanish when you refresh the screen, DeepFusionGuard stores every conversation in a dedicated relational SQLite database. You can refresh your browser, switch devices, or review past investigations with zero data loss.`
  },
  {
    id: 5,
    title: "05. Master Admin Exclusivity & Conclusion",
    timeRange: "3:20 - 4:00 (40s)",
    duration: 40,
    visualAction: "Click 'Customers' directory in Navbar. Show Vasudevareddyeevuri@gmail.com Super Admin status, download user Excel sheet, and show 365-day compliance retention.",
    screenTarget: "/",
    badge: "ENTERPRISE GOVERNANCE",
    voiceover: `Finally, enterprise security demands rigorous governance. DeepFusionGuard implements strict Role-Based Access Control. While customers can register with one-time email authentication, administrative authority is exclusively reserved for the Master Administrator, Vasudevareddyeevuri at gmail dot com.
Only the master admin can inspect customer login sheets, export audit records to Excel, or purge sensitive logs, backed by automated three-hundred-and-sixty-five-day data retention.
In conclusion, DeepFusionGuard bridges the gap between deep learning and real-world cybersecurity, delivering real-time packet interception, multi-modal graph intelligence, and automated incident mitigation. Thank you.`
  }
];

export const VideoWalkthroughModal = ({ isOpen, onClose }) => {
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.95);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();
  const timerRef = useRef(null);
  const synthRef = useRef(null);
  const utteranceRef = useRef(null);

  const currentScene = DEMO_SCENES[currentSceneIdx];

  // Speech synthesis setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      stopVoice();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // When modal closes, stop voice
  useEffect(() => {
    if (!isOpen) {
      stopVoice();
      setIsPlaying(false);
      setElapsedSeconds(0);
      setCurrentSceneIdx(0);
    }
  }, [isOpen]);

  const stopVoice = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  const speakText = (text, onEndCallback) => {
    stopVoice();
    if (isVoiceMuted || !synthRef.current) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    // Pick best English voice if available
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      if (onEndCallback) onEndCallback();
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      // Pause
      stopVoice();
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      // Play
      setIsPlaying(true);
      speakCurrentScene();

      // Start elapsed timer
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          if (prev >= 240) {
            clearInterval(timerRef.current);
            setIsPlaying(false);
            return 240;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const speakCurrentScene = () => {
    speakText(currentScene.voiceover, () => {
      // Auto-advance to next scene if not last
      if (currentSceneIdx < DEMO_SCENES.length - 1) {
        goToScene(currentSceneIdx + 1);
      } else {
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    });
  };

  const goToScene = (idx) => {
    stopVoice();
    setCurrentSceneIdx(idx);

    // Calculate approximate start elapsed time
    const startOffset = DEMO_SCENES.slice(0, idx).reduce((acc, s) => acc + s.duration, 0);
    setElapsedSeconds(startOffset);

    if (isPlaying) {
      setTimeout(() => {
        const nextScene = DEMO_SCENES[idx];
        speakText(nextScene.voiceover, () => {
          if (idx < DEMO_SCENES.length - 1) {
            goToScene(idx + 1);
          } else {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
          }
        });
      }, 300);
    }
  };

  const handleRestart = () => {
    stopVoice();
    setElapsedSeconds(0);
    goToScene(0);
  };

  const handleJumpToScreen = () => {
    onClose();
    navigate(currentScene.screenTarget);
  };

  const handleCopyScript = () => {
    const fullScript = DEMO_SCENES.map(s => `[SCENE ${s.id}: ${s.title} (${s.timeRange})]\nON-SCREEN ACTION:\n${s.visualAction}\n\nSPOKEN VOICEOVER:\n"${s.voiceover}"\n\n${'='.repeat(70)}\n`).join('\n');
    navigator.clipboard.writeText(fullScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const fullScript = `# DeepFusionGuard - 4-Minute Video Demonstration Script & Voiceover Guide\n\nTotal Duration: Exactly 4:00 (240 Seconds)\nTarget Pacing: ~135 words per minute (Clear, authoritative, technical cadence)\n\n` + 
      DEMO_SCENES.map(s => `## Scene ${s.id}: ${s.title}\n* **Timestamp**: \`${s.timeRange}\`\n* **On-Screen Action / Visual Direction**:\n  > ${s.visualAction}\n* **Spoken Voiceover Script**:\n  "${s.voiceover}"\n\n---\n`).join('\n');

    const blob = new Blob([fullScript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DeepFusionGuard_4Min_Video_Demonstration_Script.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = Math.min(100, (elapsedSeconds / 240) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-5xl rounded-3xl bg-[#090E1B] border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* ── Top Header ── */}
        <div className="p-4 sm:p-5 bg-[#0C1425] border-b border-cyan-500/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md">
              <Film className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold font-mono text-white tracking-wide">
                  4-Minute Video Demonstration & Voiceover Showcase
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  4:00 TIMED MASTER SCRIPT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Complete scene-by-scene visual cues, on-screen camera actions, and natural synthesized voice narration.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadScript}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-xs text-slate-300 hover:text-white transition-all font-mono"
              title="Download full script as Markdown"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={handleCopyScript}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-xs text-slate-300 hover:text-white transition-all font-mono"
              title="Copy complete voiceover text to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Script'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Progress Bar & Playback Controls Bar ── */}
        <div className="p-3 sm:p-4 bg-[#080D1A] border-b border-slate-800 shrink-0 space-y-3">
          {/* Time & Slider */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold">{formatTime(elapsedSeconds)}</span>
              <span>/</span>
              <span>4:00</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold">
              Scene {currentSceneIdx + 1} of 5: {currentScene.badge}
            </span>
          </div>

          <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/30 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? 'Pause Voiceover' : 'Play Voiceover Narration'}</span>
              </button>

              <button
                onClick={handleRestart}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
                title="Restart demonstration"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsVoiceMuted(prev => !prev)}
                className={`p-2 rounded-xl border transition-colors ${
                  isVoiceMuted ? 'bg-rose-950/60 border-rose-500/40 text-rose-300' : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
                title={isVoiceMuted ? "Unmute AI Voice" : "Mute AI Voice"}
              >
                {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Quick jump to live page */}
            <button
              onClick={handleJumpToScreen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition-all"
            >
              <span>Jump to {currentScene.screenTarget} Screen</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Scene Selector Tabs ── */}
        <div className="flex border-b border-slate-800 bg-[#070B14] overflow-x-auto shrink-0 scrollbar-none">
          {DEMO_SCENES.map((scene, idx) => (
            <button
              key={scene.id}
              onClick={() => goToScene(idx)}
              className={`px-4 py-2.5 text-xs font-mono font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                idx === currentSceneIdx
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <span>{scene.title.split('.')[0]}</span>
              <span className="text-[10px] text-slate-500">({scene.duration}s)</span>
            </button>
          ))}
        </div>

        {/* ── Main Scene Body: Visual Simulation vs. Voiceover Script ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#060913]">
          
          {/* Left Column: Visual Cues & On-Screen Demonstration Action (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-[#090E1B] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" />
                  What to Show on Screen
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                  {currentScene.timeRange}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#060A13] border border-cyan-500/20 text-xs text-slate-200 leading-relaxed font-sans space-y-2">
                <p className="font-semibold text-cyan-300">Camera / Screen Focus:</p>
                <p>{currentScene.visualAction}</p>
              </div>

              {/* Dynamic Action Shortcut based on Scene */}
              <div className="p-3 rounded-xl bg-[#0C1527] border border-slate-800 text-xs font-mono space-y-2">
                <span className="text-[10px] uppercase text-slate-500 font-bold">Key Examiner Talking Point:</span>
                <p className="text-emerald-300 text-[11px]">
                  {currentScene.id === 1 && "Highlight the core failure of Snort/Suricata vs. DeepFusion Multi-Modal Fusion."}
                  {currentScene.id === 2 && "Point to your real machine IP 10.36.45.55 and the 1-click iptables drop rule."}
                  {currentScene.id === 3 && "Explain GNN Message Passing formula: captures Botnet fan-in & port sweep fan-out."}
                  {currentScene.id === 4 && "Demonstrate Telugu 'GNN ante enti?' and prove SQLite persistence on refresh."}
                  {currentScene.id === 5 && "Show Master Admin exclusivity for vasudevareddyeevuri@gmail.com and 365d retention."}
                </p>
              </div>
            </div>

            {/* Quick Navigation between Scenes */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => goToScene(Math.max(0, currentSceneIdx - 1))}
                disabled={currentSceneIdx === 0}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Scene</span>
              </button>

              <button
                onClick={() => goToScene(Math.min(DEMO_SCENES.length - 1, currentSceneIdx + 1))}
                disabled={currentSceneIdx === DEMO_SCENES.length - 1}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 disabled:opacity-40"
              >
                <span>Next Scene</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Spoken Voiceover Script with Pacing (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-card p-5 rounded-2xl border border-cyan-500/30 bg-[#090E1B] space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-white font-bold">
                    Spoken Voiceover Script (Exact Audio Narration)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Target Speed: ~135 WPM
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#060913] border border-slate-800 text-xs sm:text-sm text-slate-100 leading-loose font-sans selection:bg-cyan-500/30">
                <p className="whitespace-pre-line">
                  {currentScene.voiceover}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  Natural AI Speech Enabled
                </span>
                <button
                  onClick={speakCurrentScene}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  🔊 Repeat This Scene's Audio
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VideoWalkthroughModal;
