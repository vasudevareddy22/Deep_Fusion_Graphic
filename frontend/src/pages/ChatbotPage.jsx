import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  Trash2, 
  Download, 
  Plus, 
  MessageSquare, 
  Edit3, 
  Check, 
  X, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Globe, 
  Terminal, 
  ChevronRight,
  Clock,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import MarkdownRenderer from '../components/MarkdownRenderer';

const PRESET_PROMPTS = [
  {
    title: "⚡ Active Threats (Database)",
    desc: "Scan live SQLite telemetry for confirmed attacks and top offending IPs",
    prompt: "What attacks are currently active on my network?"
  },
  {
    title: "🌐 GNN ante enti? (తెలుగు)",
    desc: "గ్రాఫ్ న్యూరల్ నెట్‌వర్క్ వివరణ & ఎగ్జామినర్ వైవా ప్రశ్నలు",
    prompt: "GNN ante enti? ela pani chesthundi?"
  },
  {
    title: "🛡️ DoS vs Probe Analysis",
    desc: "Compare volumetric SYN floods against distributed port scans",
    prompt: "Explain DoS vs Probe attacks with examples and detection signatures"
  },
  {
    title: "💻 Firewall Block Script",
    desc: "Generate ready-to-run Linux iptables and ufw rules for malicious hosts",
    prompt: "Generate iptables firewall commands to block attacker IP"
  },
  {
    title: "🎯 99.8% Accuracy & Novelty",
    desc: "Examine benchmark accuracy and hybrid multi-modal fusion",
    prompt: "What is our system's accuracy rate and novelty?"
  },
  {
    title: "🚪 R2L & U2R Deep-Dive",
    desc: "Understand remote brute-force and local privilege escalation vectors",
    prompt: "Explain R2L and U2R attacks with prevention techniques"
  }
];

export const ChatbotPage = () => {
  // Session State
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(
    () => localStorage.getItem('dfg_active_chat_session') || null
  );
  const [sessionTitle, setSessionTitle] = useState('Security Investigation');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Messages State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [liveContext, setLiveContext] = useState(null);
  const [engineName, setEngineName] = useState('DeepFusionGuard Universal SOC Engine');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load user sessions from database on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsSessionsLoading(true);
    try {
      const res = await api.getChatSessions();
      if (res.success && res.sessions && res.sessions.length > 0) {
        setSessions(res.sessions);
        
        // If current active session exists in list, keep it; otherwise default to first session
        const currentId = activeSessionId;
        const exists = res.sessions.find(s => s.id === currentId);
        const targetId = exists ? currentId : res.sessions[0].id;
        
        setActiveSessionId(targetId);
        localStorage.setItem('dfg_active_chat_session', targetId);
        
        const activeSess = res.sessions.find(s => s.id === targetId);
        if (activeSess) setSessionTitle(activeSess.title);
        
        // Load messages for this session
        loadSessionMessages(targetId);
      } else {
        // Create initial session if none exist
        handleCreateNewSession();
      }
    } catch (err) {
      console.error("Failed to load chat sessions from database:", err);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  const loadSessionMessages = async (sessionId) => {
    try {
      const res = await api.getSessionMessages(sessionId);
      if (res.success && res.messages && res.messages.length > 0) {
        setMessages(res.messages);
      } else {
        // Welcome template for brand-new empty session
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `### 🛡️ DeepFusion ChatGPT Security Analyst

Greetings, Operator. I am your **SOC Cyber Intelligence & Incident Assistant**. All messages in this conversation are **automatically saved in your database** and will persist across refreshes.

* **Multilingual Intelligence**: Ask in English, Telugu (e.g. *"GNN ante enti?"*), or Hindi.
* **Live Telemetry & Forensics**: Query current network attacks, inspect offending IPs, or generate firewall block scripts.

Select a quick question below or type your inquiry to begin:`,
            engine: 'DeepFusionGuard Universal SOC Engine',
            suggestedPrompts: [
              "What attacks are currently active on my network?",
              "GNN ante enti? ela pani chesthundi?",
              "Explain DoS vs Probe attacks with examples and detection signatures",
              "Generate iptables firewall commands to block attacker IP"
            ],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to load messages for session:", err);
    }
  };

  const handleSelectSession = (session) => {
    if (session.id === activeSessionId) return;
    setActiveSessionId(session.id);
    setSessionTitle(session.title);
    localStorage.setItem('dfg_active_chat_session', session.id);
    loadSessionMessages(session.id);
  };

  const handleCreateNewSession = async () => {
    try {
      const res = await api.createChatSession("New Investigation");
      if (res.success && res.session) {
        setSessions(prev => [res.session, ...prev]);
        setActiveSessionId(res.session.id);
        setSessionTitle(res.session.title);
        localStorage.setItem('dfg_active_chat_session', res.session.id);
        
        setMessages([
          {
            id: 'welcome-new',
            role: 'assistant',
            content: `### 🛡️ New SOC Investigation Initialized

Session memory is active and persistent. Ask any question about network attacks, firewall containment, or viva defense concepts (like GNN and accuracy rate).`,
            engine: 'DeepFusionGuard Universal SOC Engine',
            suggestedPrompts: [
              "What attacks are currently active on my network?",
              "GNN ante enti? ela pani chesthundi?",
              "Generate iptables firewall commands to block attacker IP"
            ],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to create new session:", err);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this chat from the database?")) return;

    try {
      await api.deleteChatSession(sessionId);
      const remaining = sessions.filter(s => s.id !== sessionId);
      setSessions(remaining);

      if (sessionId === activeSessionId) {
        if (remaining.length > 0) {
          handleSelectSession(remaining[0]);
        } else {
          handleCreateNewSession();
        }
      }
    } catch (err) {
      console.error("Failed to delete chat session:", err);
    }
  };

  const handleSaveRenameTitle = async () => {
    if (!editedTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await api.renameChatSession(activeSessionId, editedTitle.trim());
      setSessionTitle(editedTitle.trim());
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title: editedTitle.trim() } : s));
      setIsEditingTitle(false);
    } catch (err) {
      console.error("Failed to rename session:", err);
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend !== null ? textToSend : input).trim();
    if (!query || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Optimistic UI update
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = messages
        .filter(m => !m.id.startsWith('welcome'))
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await api.chatWithAnalyst(query, activeSessionId, historyPayload);

      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.reply || "No response received from the security engine.",
        engine: res.engine || 'DeepFusionGuard Universal SOC Engine',
        suggestedPrompts: res.suggested_prompts || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (res.live_context) setLiveContext(res.live_context);
      if (res.engine) setEngineName(res.engine);

      setMessages(prev => [...prev, assistantMsg]);

      // Refresh session list in background to update title & message counts
      api.getChatSessions().then(r => {
        if (r.success && r.sessions) {
          setSessions(r.sessions);
          const current = r.sessions.find(s => s.id === activeSessionId);
          if (current) setSessionTitle(current.title);
        }
      });

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

  const handleExportTranscript = () => {
    const transcriptText = messages.map(m => {
      const author = m.role === 'user' ? 'OPERATOR' : `SOC AI ANALYST (${m.engine || 'DeepFusion'})`;
      return `[${m.timestamp}] ${author}:\n${m.content}\n\n${'-'.repeat(60)}\n`;
    }).join('\n');

    const blob = new Blob([transcriptText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DeepFusion_Chat_${sessionTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex h-[calc(100vh-5rem)] gap-4">
      {/* ── Left Sidebar: Chat History / Sessions Drawer (ChatGPT & Claude Style) ── */}
      <div 
        className={`${
          isSidebarOpen ? 'w-72 sm:w-80' : 'w-0 -ml-4 hidden sm:hidden'
        } transition-all duration-300 flex flex-col shrink-0 glass-card rounded-2xl border border-slate-800/90 bg-[#080D1A]/95 overflow-hidden shadow-2xl shadow-black/80`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-[#0B1222]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold font-mono text-white tracking-wider uppercase">
              Chat Database
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Collapse chat history"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleCreateNewSession}
            className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500/20 via-blue-600/20 to-cyan-500/10 hover:from-cyan-500/30 hover:to-blue-600/30 text-cyan-300 hover:text-white border border-cyan-500/40 hover:border-cyan-400 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>+ New Investigation</span>
          </button>
        </div>

        {/* Chat Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-3 text-xs">
          <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
            Saved Conversations ({sessions.length})
          </div>

          {sessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            return (
              <div
                key={sess.id}
                onClick={() => handleSelectSession(sess)}
                className={`group px-3 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/80 via-blue-950/50 to-transparent border-l-3 border-cyan-400 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate flex-1 mr-2">
                  <Bot className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <div className="truncate">
                    <p className="truncate text-xs">{sess.title}</p>
                    <span className="text-[9px] font-mono text-slate-500">
                      {sess.message_count ? `${sess.message_count} msgs` : 'New'} • {sess.updated_at ? sess.updated_at.slice(5, 16) : ''}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteSession(e, sess.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-all shrink-0"
                  title="Delete chat from database"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Database Footer Info */}
        <div className="p-3 border-t border-slate-800 bg-[#060913] text-[10px] font-mono text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            SQLite Persistent DB
          </span>
          <span>Never Lost on Refresh</span>
        </div>
      </div>

      {/* ── Main Chat Window ── */}
      <div className="flex-1 flex flex-col glass-card rounded-2xl border border-slate-800/90 bg-[#070B14]/95 overflow-hidden shadow-2xl shadow-black/90">
        {/* Top Header Card */}
        <div className="p-3.5 sm:p-4 bg-[#090E1B] border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Open chat history sidebar"
              >
                <PanelLeftOpen className="w-4 h-4 text-cyan-400" />
              </button>
            )}

            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>

            <div>
              {/* Editable Session Title */}
              {isEditingTitle ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveRenameTitle()}
                    className="bg-[#060913] border border-cyan-500/50 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none"
                    autoFocus
                  />
                  <button onClick={handleSaveRenameTitle} className="p-1 text-emerald-400 hover:text-emerald-300">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setIsEditingTitle(false)} className="p-1 text-slate-400 hover:text-slate-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-bold font-mono text-white tracking-wide truncate max-w-[200px] sm:max-w-md">
                    {sessionTitle}
                  </h2>
                  <button
                    onClick={() => { setEditedTitle(sessionTitle); setIsEditingTitle(true); }}
                    className="text-slate-500 hover:text-cyan-400 transition-colors"
                    title="Rename conversation"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-400">
                <span className="text-cyan-400 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Multilingual: English, తెలుగు, हिंदी
                </span>
                <span>•</span>
                <span className="text-emerald-400">Database Synced</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTranscript}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-all font-mono"
              title="Download conversation markdown transcript"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#060A14]">
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
                          className="px-2.5 py-1 rounded-lg bg-[#0C1527] hover:bg-cyan-950/60 text-[11px] text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 hover:border-cyan-400/50 transition-all font-mono text-left flex items-center gap-1.5 shadow-xs cursor-pointer"
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

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 sm:gap-4 items-start">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-sm shadow-cyan-500/20">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-xs bg-[#0B1222]/95 border border-slate-800/90 text-xs text-slate-400 flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
                <span className="font-mono text-cyan-300 ml-1">Understanding intent & analyzing database...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Carousel (if few messages) */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 border-t border-slate-800/60 bg-[#080D1A]/90 shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>CLICK TO ASK POPULAR QUESTIONS IN ENGLISH OR TELUGU:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {PRESET_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  disabled={isLoading}
                  className="p-2.5 rounded-xl bg-[#0B1222] hover:bg-[#101C33] border border-cyan-500/20 hover:border-cyan-400/50 text-left transition-all group flex flex-col justify-between shadow-sm cursor-pointer"
                >
                  <div className="text-xs font-bold text-cyan-300 group-hover:text-cyan-200 flex items-center justify-between">
                    <span>{item.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Input Form */}
        <div className="p-3.5 bg-[#090E1B] border-t border-slate-800 shrink-0">
          <div className="flex items-end gap-2.5">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask in English or Telugu (e.g. 'GNN ante enti?', 'show attacks', 'block IP 192.168.1.105')..."
                rows={2}
                className="w-full bg-[#060913] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 resize-none font-sans leading-relaxed selection:bg-cyan-500/30"
                disabled={isLoading}
              />
              <div className="absolute right-2.5 bottom-2.5 text-[10px] font-mono text-slate-500 hidden sm:block">
                Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Enter ↵</kbd>
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
    </div>
  );
};

export default ChatbotPage;
