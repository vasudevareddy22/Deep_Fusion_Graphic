import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  Trash2, 
  Download, 
  CornerDownLeft, 
  Cpu, 
  Activity, 
  CheckCircle2, 
  Terminal, 
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import MarkdownRenderer from '../components/MarkdownRenderer';

const PRESET_PROMPTS = [
  {
    title: "⚡ Active Network Threats",
    desc: "Scan live SQLite telemetry for confirmed attacks and top offending IPs",
    prompt: "What attacks are currently active on my network?"
  },
  {
    title: "🛡️ DoS vs Probe Analysis",
    desc: "Compare volumetric SYN floods against distributed port scans",
    prompt: "Explain DoS vs Probe attacks with examples and detection signatures"
  },
  {
    title: "🌐 Why Graph Neural Networks?",
    desc: "Deep-dive into GNN message passing, topology, and viva explanation",
    prompt: "Why use Graph Neural Networks (GNN) for cybersecurity?"
  },
  {
    title: "💻 Firewall Block Script",
    desc: "Generate ready-to-run Linux iptables and ufw rules for malicious hosts",
    prompt: "Generate iptables firewall commands to block attacker IP"
  },
  {
    title: "🎯 Model Accuracy & Novelty",
    desc: "Examine 99.8% benchmark accuracy and hybrid multi-modal fusion",
    prompt: "What is our system's accuracy rate and novelty?"
  },
  {
    title: "🚪 R2L & U2R Deep-Dive",
    desc: "Understand remote brute-force and local privilege escalation vectors",
    prompt: "Explain R2L and U2R attacks with prevention techniques"
  }
];

export const ChatbotPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### 🛡️ DeepFusion ChatGPT Security Analyst

Greetings, Operator. I am your **SOC Cyber Intelligence & Incident Assistant**. I can help you investigate attacks, examine network topology, translate raw packets into MITRE ATT&CK tactics, and answer academic viva defense questions.

* **Live Database Telemetry**: Connected to DeepFusionGuard telemetry store.
* **Hybrid Reasoning**: Tabular Random Forest + Graph Neural Network topology + MITRE ATT&CK guidance.

Select a quick question below or type your inquiry to begin:`,
      engine: 'DeepFusionGuard SOC Engine',
      suggestedPrompts: [
        "What attacks are currently active on my network?",
        "Explain DoS vs Probe attacks with examples and detection signatures",
        "Why use Graph Neural Networks (GNN) for cybersecurity?",
        "Generate iptables firewall commands to block attacker IP"
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [liveContext, setLiveContext] = useState(null);
  const [engineName, setEngineName] = useState('DeepFusionGuard SOC Engine');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend !== null ? textToSend : input).trim();
    if (!query || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build lightweight conversation history
      const historyPayload = messages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await api.chatWithAnalyst(query, historyPayload);

      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.reply || "No response received from the security engine.",
        engine: res.engine || 'DeepFusionGuard SOC Engine',
        suggestedPrompts: res.suggested_prompts || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (res.live_context) {
        setLiveContext(res.live_context);
      }
      if (res.engine) {
        setEngineName(res.engine);
      }

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `### ⚠️ Incident Communication Interrupted\n\nCould not reach the SOC analyst service: \`${err.message || 'Network Timeout'}\`. Please ensure the backend server is running and try again.`,
        engine: 'Local Fallback',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear active chat session?")) {
      setMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: "### 🔄 Chat Session Reset\n\nSession memory cleared. Ask any question about network attacks, firewall containment, or model architecture to begin.",
          engine: 'DeepFusionGuard SOC Engine',
          suggestedPrompts: [
            "What attacks are currently active on my network?",
            "Explain DoS vs Probe attacks with examples and detection signatures",
            "Why use Graph Neural Networks (GNN) for cybersecurity?"
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleExportTranscript = () => {
    const transcriptText = messages.map(m => {
      const author = m.role === 'user' ? 'OPERATOR' : `SOC AI ANALYST (${m.engine || 'DeepFusion'})`;
      return `[${m.timestamp}] ${author}:\n${m.content}\n\n${'-'.repeat(60)}\n`;
    }).join('\n');

    const blob = new Blob([transcriptText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DeepFusion_SOC_Chat_Transcript_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-5rem)]">
      {/* Top Header Card */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800/90 mb-4 shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#090E1B]/95 shadow-xl shadow-black/40">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-cyan-400/10 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-md shadow-cyan-500/20 shrink-0">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base font-bold font-mono text-white tracking-wide">
                ChatGPT SOC Threat Analyst
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                <span>{engineName}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive cyber threat intelligence, forensic telemetry queries, firewall synthesis & viva defense.
            </p>
          </div>
        </div>

        {/* Live Status Indicators & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {liveContext && (
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#0C1425] border border-cyan-500/20 text-[11px] font-mono">
              <span className="text-slate-400">Total Events: <strong className="text-white">{liveContext.total_events}</strong></span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Attacks: <strong className="text-rose-400">{liveContext.attack_events}</strong></span>
            </div>
          )}

          <button
            onClick={handleExportTranscript}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-all font-mono"
            title="Export conversation as markdown file"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-rose-950/40 border border-slate-700/80 hover:border-rose-500/40 text-xs text-slate-400 hover:text-rose-300 transition-all font-mono"
            title="Clear chat session"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Main Chat Conversation Container */}
      <div className="flex-1 overflow-y-auto glass-card rounded-2xl border border-slate-800/90 p-4 sm:p-6 mb-4 space-y-5 bg-[#070B14]/90 shadow-2xl shadow-black/80">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 mt-1 shadow-sm shadow-cyan-500/20">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-3xl space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Author & Timestamp */}
                <div className={`flex items-center gap-2 text-[10px] font-mono text-slate-500 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <span>{isUser ? 'Operator (You)' : (msg.engine || 'SOC AI Analyst')}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl text-xs leading-relaxed shadow-lg ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-600/90 via-blue-600/90 to-blue-700/90 text-white rounded-tr-xs border border-cyan-400/30'
                      : 'bg-[#0B1222]/95 border border-slate-800/90 rounded-tl-xs text-slate-200'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap font-sans text-sm font-medium">{msg.content}</p>
                  ) : (
                    <MarkdownRenderer content={msg.content} />
                  )}
                </div>

                {/* Interactive Suggestion Chips from Assistant */}
                {!isUser && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-mono text-slate-500 mr-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      Suggested:
                    </span>
                    {msg.suggestedPrompts.map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSendMessage(prompt)}
                        disabled={isLoading}
                        className="px-2.5 py-1 rounded-lg bg-[#0C1527] hover:bg-cyan-950/60 text-[11px] text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 hover:border-cyan-400/50 transition-all font-mono text-left flex items-center gap-1.5 shadow-xs"
                      >
                        <span>{prompt}</span>
                        <ChevronRight className="w-3 h-3 text-cyan-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0 mt-1 shadow-sm shadow-blue-500/20 font-mono text-xs font-bold">
                  YOU
                </div>
              )}
            </div>
          );
        })}

        {/* Loading / Typing Indicator */}
        {isLoading && (
          <div className="flex gap-3 sm:gap-4 items-start">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-sm shadow-cyan-500/20">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-xs bg-[#0B1222]/95 border border-slate-800/90 text-xs text-slate-400 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
              <span className="font-mono text-cyan-300 ml-1">Analyzing network telemetry & compiling response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset Quick Question Carousel */}
      {messages.length <= 2 && (
        <div className="mb-3 overflow-x-auto pb-1 shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>CLICK TO ASK POPULAR VIVA & ATTACK ANALYSIS QUESTIONS:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PRESET_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(item.prompt)}
                disabled={isLoading}
                className="p-3 rounded-xl bg-[#09101F]/90 hover:bg-[#0E1A33] border border-cyan-500/20 hover:border-cyan-400/50 text-left transition-all group flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="text-xs font-bold text-cyan-300 group-hover:text-cyan-200 flex items-center justify-between">
                    <span>{item.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="glass-card p-3 rounded-2xl border border-slate-800/90 bg-[#0A1020]/95 shrink-0 shadow-2xl shadow-black/90">
        <div className="flex items-end gap-2.5">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about network attacks, GNN, accuracy rate, DoS/Probe/R2L/U2R, or firewall block rules..."
              rows={2}
              className="w-full bg-[#060913] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 resize-none font-sans leading-relaxed selection:bg-cyan-500/30"
              disabled={isLoading}
            />
            <div className="absolute right-2.5 bottom-2.5 text-[10px] font-mono text-slate-500 hidden sm:block">
              Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Enter ↵</kbd> to send
            </div>
          </div>

          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className={`h-11 px-5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              input.trim() && !isLoading
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30 cursor-pointer'
                : 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
