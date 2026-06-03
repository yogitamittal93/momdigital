// web/src/components/Chatbot/ChatWindow.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { api, parseReply } from '@/lib/api-client';

export const ChatWindow = () => {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Namaste! I am your Digital Amma. How are you feeling today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages or typing state changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const data = (await api.post('/chatbot/message', { message: userMsg })) as Record<string, unknown>;
      const reply = parseReply(data) || 'Please try again.';
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'bot', text: "Amma is resting. Check your connection!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] w-full max-w-2xl mx-auto 
                    bg-white/70 dark:bg-zinc-900/80 backdrop-blur-2xl 
                    rounded-[2.5rem] border border-white/40 dark:border-zinc-800/50 
                    shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-500">

      {/* Premium Header */}
      <div className="px-8 py-6 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#eb3489] to-[#ff8c42] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform duration-300">
              A
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-[3px] border-white dark:border-zinc-900 rounded-full"></div>
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">Digital Amma</h3>
            <p className="text-[11px] text-green-600 dark:text-green-400 font-bold tracking-widest uppercase">Online • Expert Midwife</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role as 'user' | 'bot'} text={msg.text} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={scrollRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="p-8 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800/50">
        <div className="relative group">
          <input
            className="w-full bg-white dark:bg-zinc-950/50 border-2 border-zinc-100 dark:border-zinc-800 
                       text-zinc-900 dark:text-zinc-100 pl-7 pr-16 py-5 rounded-[1.8rem] 
                       focus:border-[#eb3489] focus:ring-4 focus:ring-[#eb3489]/10 outline-none 
                       transition-all duration-300 placeholder:text-zinc-400 font-medium"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Amma anything..."
          />
          <button 
            onClick={handleSend} 
            disabled={!input.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-[#eb3489] p-3.5 rounded-[1.4rem] 
                       hover:scale-105 active:scale-95 transition-all shadow-xl shadow-pink-500/30
                       disabled:opacity-50 disabled:hover:scale-100"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 mt-4 font-medium uppercase tracking-tighter">
          Amma provides general advice. For emergencies, contact a doctor immediately.
        </p>
      </div>
    </div>
  );
};