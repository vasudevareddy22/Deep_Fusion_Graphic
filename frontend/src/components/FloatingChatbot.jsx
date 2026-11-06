import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  ChevronRight,
  ShieldAlert,
  Trash2,
  Globe
} from 'lucide-react';
import { api } from '../services/api';
import MarkdownRenderer from './MarkdownRenderer';

export const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(
    () => localStorage.getItem('dfg_active_chat_session') || null
  );
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      initSession();
      scrollToBottom();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  const initSession = async () => {
    try {
      let targetId = sessionId;
      if (!targetId) {
        const sessRes = await api.getChatSessions();
        if (sessRes.success && sessRes.sessions && sessRes.sessions.length > 0) {
          targetId = sessRes.sessions[0].id;
        } else {
          const newSess = await api.createChatSession("Quick Assistant Session");
          targetId = newSess.session.id;
        }
        setSessionId(targetId);
        localStorage.setItem('dfg_active_chat_session', targetId);
      }

      // Load saved messages from database
      const msgRes = await api.getSessionMessages(targetId);
      if (msgRes.success && msgRes.messages && msgRes.messages.length > 0) {
        setMessages(msgRes.messages);
      } else {
        setMessages([
          {
            id: 'floating-welcome',
            role: 'assistant',
            content: "### 🤖 Universal SOC AI Assistant\nAsk me anything in **English**, **తెలుగు (Telugu)**, or **हिंदी (Hindi)**! All chats are saved in your database.",
            engine: 'DeepFusion Universal AI',
            suggestedPrompts: [
              "What attacks are currently active on my network?",
              "GNN ante enti? ela pani chesthundi?",
              "Explain DoS vs Probe attacks"
            ],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error("Floating chatbot init error:", err);
    }
  };

  const handleSend = async (customText = null) => {
    const query = (customText !== null ? customText : input).trim();
    if (!query || isLoading) return;

    const userMsg = {
      id: `float-user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = messages
        .filter(m => !m.id.startsWith('floating-welcome'))
        .slice(-4)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await api.chatWithAnalyst(query, sessionId, historyPayload);

      if (res.session_id && res.session_id !== sessionId) {
        setSessionId(res.session_id);
        localStorage.setItem('dfg_active_chat_session', res.session_id);
      }

      const assistantMsg = {
        id: `float-ai-${Date.now()}`,
        role: 'assistant',
        content: res.reply || "No response received.",
        engine: res.engine || 'DeepFusion Universal AI',
        suggestedPrompts: res.suggested_prompts || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `float-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Failed to query SOC AI: \`${err.message || 'Error'}\``,
          engine: 'Local Fallback',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSession = async () => {
    try {
      const newSess = await api.createChatSession("New Quick Chat");
      setSessionId(newSess.session.id);
      localStorage.setItem('dfg_active_chat_session', newSess.session.id);
      setMessages([
        {
          id: 'floating-reset',
          role: 'assistant',
          content: "### 🔄 New Chat Session Initialized\nPrevious chats remain safely preserved in the database. What would you like to investigate?",
          engine: 'DeepFusion Universal AI',
          suggestedPrompts: [
            "What attacks are currently active on my network?",
            "GNN ante enti? ela pani chesthundi?"
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative group p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-400/70 border border-cyan-300/40 transition-all transform hover:-translate-y-1 flex items-center gap-2 cursor-pointer"
          title="Chat with DeepFusion SOC AI"
        >
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-300"></span>
          </span>
          <Bot className="w-6 h-6 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wide pr-1 hidden sm:inline">
            ChatGPT SOC Analyst
          </span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[550px] rounded-2xl bg-[#090E1B]/95 backdrop-blur-2xl border border-cyan-500/40 shadow-2xl shadow-black/90 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-[#0C1527] border-b border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                  ChatGPT SOC Analyst
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </h3>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5 text-cyan-400" /> English • తెలుగు • Database Synced
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetSession}
                className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Start new chat session"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Close chatbot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs bg-[#070B14]">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] font-mono text-slate-500 mb-1">
                    {isUser ? 'Operator' : msg.engine} • {msg.timestamp}
                  </span>
                  <div
                    className={`p-3 rounded-xl max-w-[90%] text-xs leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-xs'
                        : 'bg-[#0B1222] border border-slate-800 rounded-tl-xs text-slate-200'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}
                  </div>

                  {/* Suggestion Chips */}
                  {!isUser && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1 w-full max-w-[90%]">
                      {msg.suggestedPrompts.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(p)}
                          disabled={isLoading}
                          className="px-2.5 py-1 text-left rounded-lg bg-[#0C1527] hover:bg-cyan-950/60 text-[10px] text-cyan-300 border border-cyan-500/20 hover:border-cyan-400/40 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span className="truncate">{p}</span>
                          <ChevronRight className="w-3 h-3 text-cyan-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono py-2">
                <Bot className="w-4 h-4 animate-spin" />
                <span>Processing in database...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Input Bar */}
          <div className="p-2.5 bg-[#0A1020] border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask in English or Telugu (e.g. 'GNN ante enti?')..."
                className="flex-1 bg-[#060913] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingChatbot;
