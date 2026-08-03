'use client';

import { useState, useRef, useEffect } from 'react';
import { api, parseReply, type ApiUser } from '@/lib/api-client';
import { useMlStatus } from '@/hooks/use-ml-status';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: 'auto_safe' | 'ai_generated' | 'requires_doctor' | 'emergency' | 'safety_fallback';
  sources?: string[];
  timestamp: Date;
}

const CONFIDENCE_BANNERS = {
  auto_safe: null,
  ai_generated: {
    bg: 'bg-amber-50 border-amber-200',
    icon: '⚠️',
    text: 'AI-generated information. Always consult your doctor before acting on health advice.',
    textColor: 'text-amber-800',
  },
  requires_doctor: {
    bg: 'bg-red-50 border-red-200',
    icon: '🚨',
    text: 'This answer requires doctor consultation. Do not act on this information without speaking to your doctor first.',
    textColor: 'text-red-800',
  },
  emergency: {
    bg: 'bg-red-100 border-red-400',
    icon: '🚨',
    text: 'EMERGENCY — Please call 112 or go to your nearest hospital immediately.',
    textColor: 'text-red-900',
  },
  safety_fallback: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'ℹ️',
    text: 'Limited information available. Please consult a healthcare provider.',
    textColor: 'text-blue-800',
  },
};

export interface ChatWindowProps {
  userId?: string;
  /** Pass the current user profile for richer context in future features */
  userProfile?: ApiUser;
  /** Optional context hint, e.g. 'mental-health' to seed a supportive greeting */
  context?: string;
}

export function ChatWindow({ context }: ChatWindowProps) {
  const isMentalHealth = context === 'mental-health';
  const { status: mlStatus, chunksIndexed, isWaking, warningMessage } = useMlStatus();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: isMentalHealth
        ? 'Hi, I\'m Matrny 💛 I\'m here to listen. Motherhood can be overwhelming, and it\'s okay to not be okay. You can share anything with me — how you\'re feeling, what\'s weighing on you, or just talk. If you\'re experiencing symptoms of postpartum depression or anxiety, I can also help you understand when to seek professional support. How are you feeling right now?'
        : 'Namaste! I am Matrny, your maternal and infant health companion. I combine MBBS clinical guidelines with Ayurvedic wisdom to support you on your journey. How can I help you today?',
      confidence: 'auto_safe',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const data = (await api.post('/chatbot/message', {
        message: currentInput,
      })) as Record<string, unknown>;

      const replyContent =
        parseReply(data) ||
        'I received your message but had trouble forming a response. Please try again.';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyContent,
        confidence:
          (data.confidence as Message['confidence']) ||
          (data.source === 'rag' ? 'ai_generated' : 'auto_safe'),
        sources: (data.sources as string[]) || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Connection error';
      const isAuth =
        msg.toLowerCase().includes('token') ||
        msg.toLowerCase().includes('unauthorized') ||
        msg.includes('401');

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: isAuth
            ? 'Please log in to use the chat. Go to Login and sign in, then return here.'
            : "I'm having trouble connecting right now. Please try again. For urgent concerns, call NHM helpline: 104.",
          confidence: 'requires_doctor',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── ML status indicator ──────────────────────────────────────────────────────
  const statusDot =
    mlStatus === 'loading'
      ? { color: 'bg-yellow-400', label: isWaking ? 'AI warming up — may take ~60s…' : 'AI connecting…' }
      : mlStatus === 'ok'
      ? { color: 'bg-green-400', label: `AI online · ${chunksIndexed.toLocaleString()} docs` }
      : {
          color: isWaking ? 'bg-yellow-400' : 'bg-red-400',
          label: isWaking
            ? 'AI warming up — may take ~60s…'
            : 'AI offline — check back shortly',
        };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto min-h-[500px]">

      {/* ── Status bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
        <span
          id="ml-status-dot"
          className={`inline-block w-2 h-2 rounded-full ${statusDot.color} ${mlStatus === 'loading' ? 'animate-pulse' : ''}`}
        />
        <span className="text-xs text-gray-500">{statusDot.label}</span>
      </div>

      {/* ── Degraded banner ─────────────────────────────────────────────────── */}
      {mlStatus === 'degraded' && (
        <div className={`px-4 py-2 border-b text-xs ${
          isWaking
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {isWaking
            ? `⏳ ${warningMessage}`
            : `⚠️ ${warningMessage}`}
        </div>
      )}

      {/* ── Message list ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] flex flex-col gap-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {message.role === 'assistant' &&
                message.confidence &&
                CONFIDENCE_BANNERS[message.confidence] && (
                  <div
                    className={`text-xs px-3 py-1.5 rounded-lg border ${CONFIDENCE_BANNERS[message.confidence]!.bg} ${CONFIDENCE_BANNERS[message.confidence]!.textColor} flex items-start gap-1.5`}
                  >
                    <span>{CONFIDENCE_BANNERS[message.confidence]!.icon}</span>
                    <span>{CONFIDENCE_BANNERS[message.confidence]!.text}</span>
                  </div>
                )}

              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'bg-rose-500 text-white rounded-br-sm'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                }`}
              >
                {message.content || '…'}
              </div>

              {message.sources && message.sources.length > 0 && (
                <div className="text-xs text-gray-400 px-2">
                  Sources: {message.sources.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Disclaimer ──────────────────────────────────────────────────────── */}
      <div className="text-center text-xs text-gray-400 px-4 pb-2">
        Matrny provides AI-generated health information only. Not a substitute for
        professional medical advice. Emergency: <strong>112</strong> | NHM:{' '}
        <strong>104</strong>
      </div>

      {/* ── Input area ──────────────────────────────────────────────────────── */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isMentalHealth
              ? "Share how you're feeling, or ask about postpartum emotions..."
              : "Ask about nutrition, symptoms, baby care, Ayurvedic remedies..."
            }
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 min-h-[44px] max-h-[120px]"
            rows={1}
          />
          <button
            type="button"
            id="chat-send-btn"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-rose-500 text-white rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-rose-600 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
