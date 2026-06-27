import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

const SUGGESTIONS = [
  "What are my top 3 spending categories this month?",
  "How much did I spend on food last month?",
  "What is my total savings across all accounts?",
  "Show my income vs expenses for the last 3 months",
];

function Message({ msg }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-fade-in`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                        flex items-center justify-center text-xs mr-2 mt-1 shrink-0 shadow-lg shadow-indigo-900/40">
          🤖
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-sm'
          : 'bg-[#16162e] border border-white/8 text-slate-200 rounded-bl-sm'
      }`}>
        {msg.content}
        {msg.sql && (
          <details className="mt-2">
            <summary className="text-xs text-indigo-400 cursor-pointer hover:text-indigo-300 transition-colors select-none">
              🔍 View generated SQL
            </summary>
            <pre className="mt-2 text-xs bg-[#0a0a1a] rounded-lg p-2.5 overflow-x-auto
                            text-emerald-400 border border-white/5 font-mono leading-5">
              {msg.sql}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                      flex items-center justify-center text-xs mr-2 shrink-0">
        🤖
      </div>
      <div className="bg-[#16162e] border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

export default function AIChat() {
  const [isOpen, setIsOpen]       = useState(false);
  const [messages, setMessages]   = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI financial assistant 🧠 Ask me anything about your expenses, income, budgets, or account balances!",
    },
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const query = (text || input).trim();
    if (!query || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      const res = await api.post('/insights', { query });
      const { insight, sql } = res.data;
      setMessages((prev) => [...prev, { role: 'assistant', content: insight, sql }]);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Something went wrong. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Chat Panel ──────────────────────────────────────────── */}
      {isOpen && (
        <div
          id="ai-chat-panel"
          className="fixed bottom-20 right-4 md:right-6 z-50
                     w-[calc(100vw-2rem)] sm:w-96
                     flex flex-col
                     bg-[#0a0a1a]/98 backdrop-blur-2xl
                     border border-indigo-500/20 rounded-2xl shadow-2xl shadow-indigo-950/60
                     overflow-hidden animate-slide-up"
          style={{ height: 'min(540px, calc(100vh - 90px))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
                          border-b border-white/5 bg-[#0f0f23]/80">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                                flex items-center justify-center text-sm shadow-lg shadow-indigo-900/50">
                  🤖
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500
                                 rounded-full border-2 border-[#0f0f23]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AI Assistant</p>
                <p className="text-xs text-emerald-400">Online · Powered by Gemini</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg
                         text-slate-500 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Close chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (only when no user messages yet) */}
          {messages.length === 1 && !loading && (
            <div className="px-4 pb-2">
              <p className="text-xs text-slate-500 mb-2 font-medium">Try asking:</p>
              <div className="flex flex-col gap-1.5">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-left text-xs px-3 py-2 rounded-xl
                               bg-indigo-600/10 border border-indigo-500/20
                               text-indigo-300 hover:bg-indigo-600/20 hover:text-indigo-200
                               transition-all duration-150"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/5 bg-[#0f0f23]/60">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                id="ai-chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about your finances..."
                disabled={loading}
                className="flex-1 bg-[#16162e] border border-white/10 rounded-xl
                           px-4 py-2.5 text-sm text-white placeholder-slate-500
                           focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30
                           disabled:opacity-50 transition-all"
              />
              <button
                id="ai-chat-send"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="w-10 h-10 flex items-center justify-center rounded-xl
                           bg-gradient-to-br from-indigo-600 to-indigo-700
                           text-white shadow-lg shadow-indigo-900/40
                           hover:from-indigo-500 hover:to-indigo-600
                           disabled:opacity-40 disabled:cursor-not-allowed
                           transition-all active:scale-95"
                aria-label="Send message"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Trigger Button ─────────────────────────────── */}
      <button
        id="ai-chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-4 md:right-6 z-50
                   w-14 h-14 rounded-full
                   bg-gradient-to-br from-indigo-600 to-purple-600
                   flex items-center justify-center text-2xl
                   shadow-2xl shadow-indigo-950/60
                   hover:scale-110 active:scale-95
                   transition-transform duration-200
                   animate-pulse-glow"
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? '✕' : '🤖'}
      </button>
    </>
  );
}
