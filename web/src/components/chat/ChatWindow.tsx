'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { api, parseReply, type ApiUser } from '@/lib/api-client';
import { useMlStatus } from '@/hooks/use-ml-status';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: 'auto_safe' | 'ai_generated' | 'requires_doctor' | 'emergency' | 'safety_fallback';
  sources?: string[];
  timestamp: Date;
}

// ── Language definitions ──────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'en-IN', label: 'English',  flag: '🇬🇧', short: 'EN' },
  { code: 'hi-IN', label: 'Hindi',    flag: '🇮🇳', short: 'HI' },
  { code: 'mr-IN', label: 'Marathi',  flag: '🇮🇳', short: 'MR' },
  { code: 'te-IN', label: 'Telugu',   flag: '🇮🇳', short: 'TE' },
  { code: 'ta-IN', label: 'Tamil',    flag: '🇮🇳', short: 'TA' },
  { code: 'bn-IN', label: 'Bengali',  flag: '🇮🇳', short: 'BN' },
  { code: 'pa-IN', label: 'Punjabi',  flag: '🇮🇳', short: 'PA' },
] as const;

type LangCode = typeof LANGUAGES[number]['code'];

// ── Confidence banners ────────────────────────────────────────────────────────

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

// ── SpeechRecognition type shim (not in lib.dom by default) ──────────────────

interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

function getSpeechRecognition(): (new () => ISpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as unknown as Record<string, unknown>).SpeechRecognition as (new () => ISpeechRecognition) ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition as (new () => ISpeechRecognition) ||
    null
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface ChatWindowProps {
  userId?: string;
  userProfile?: ApiUser;
  context?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function ChatWindow({ context }: ChatWindowProps) {
  const isMentalHealth = context === 'mental-health';
  const { status: mlStatus, chunksIndexed, isWaking, warningMessage } = useMlStatus();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: isMentalHealth
        ? "Hi, I'm Matrny 💛 I'm here to listen. Motherhood can be overwhelming, and it's okay to not be okay. You can share anything with me — how you're feeling, what's weighing on you, or just talk. If you're experiencing symptoms of postpartum depression or anxiety, I can also help you understand when to seek professional support. How are you feeling right now?"
        : 'Namaste! I am Matrny, your maternal and infant health companion. I combine MBBS clinical guidelines with Ayurvedic wisdom to support you on your journey. How can I help you today?',
      confidence: 'auto_safe',
      timestamp: new Date(),
    },
  ]);

  const [input, setInput]           = useState('');
  const [isLoading, setIsLoading]   = useState(false);

  // ── Voice state ──────────────────────────────────────────────────────────
  const [selectedLang, setSelectedLang] = useState<LangCode>('en-IN');
  const [isListening, setIsListening]   = useState(false);
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [ttsEnabled, setTtsEnabled]     = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [micAvailable, setMicAvailable] = useState(false);
  const [interimText, setInterimText]   = useState('');

  const recognitionRef  = useRef<ISpeechRecognition | null>(null);
  const bottomRef       = useRef<HTMLDivElement>(null);
  const langMenuRef     = useRef<HTMLDivElement>(null);
  const committedInputRef = useRef(''); // tracks input before interim text

  // Check mic availability on mount
  useEffect(() => {
    setMicAvailable(!!getSpeechRecognition());
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close lang menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Speech-to-text ───────────────────────────────────────────────────────

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setInterimText('');
  }, []);

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;

    // Stop any ongoing recognition
    if (recognitionRef.current) {
      stopListening();
      return;
    }

    const recognition = new SR();
    recognition.lang             = selectedLang;
    recognition.continuous       = true;
    recognition.interimResults   = true;
    recognition.maxAlternatives  = 1;

    committedInputRef.current = input;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim  = '';
      let finalStr = committedInputRef.current;

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalStr += (finalStr ? ' ' : '') + transcript.trim();
          committedInputRef.current = finalStr;
          interim = '';
        } else {
          interim += transcript;
        }
      }

      setInput(finalStr + (interim ? ' ' + interim : ''));
      setInterimText(interim);
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== 'aborted') {
        console.warn('[SpeechRecognition] error:', e.error);
      }
      stopListening();
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [selectedLang, input, stopListening]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  // ── Text-to-speech ───────────────────────────────────────────────────────

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Strip markdown symbols for cleaner speech
    const clean = text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/---/g, '')
      .replace(/[📚🏥🌿💡⚠️🚨ℹ️]/g, '')
      .trim();

    const utterance  = new SpeechSynthesisUtterance(clean);
    utterance.lang   = selectedLang;
    utterance.rate   = 0.9;
    utterance.pitch  = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend   = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [selectedLang]);

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  // ── Send message ─────────────────────────────────────────────────────────

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    // Stop recording before sending
    if (isListening) stopListening();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    committedInputRef.current = '';
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

      // Auto-speak the response if TTS is enabled
      if (ttsEnabled) speak(replyContent);

    } catch (err: unknown) {
      const msg   = err instanceof Error ? err.message : 'Connection error';
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

  // ── ML status indicator ───────────────────────────────────────────────────

  const statusDot =
    mlStatus === 'loading'
      ? { color: 'bg-yellow-400', label: isWaking ? 'AI warming up — may take ~60s…' : 'AI connecting…' }
      : mlStatus === 'ok'
      ? { color: 'bg-green-400', label: `AI online · ${chunksIndexed.toLocaleString()} docs` }
      : {
          color: isWaking ? 'bg-yellow-400' : 'bg-red-400',
          label: isWaking ? 'AI warming up — may take ~60s…' : 'AI offline — check back shortly',
        };

  const currentLang = LANGUAGES.find((l) => l.code === selectedLang) ?? LANGUAGES[0];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto min-h-[500px] rounded-2xl overflow-hidden border border-border">

      {/* ── Status bar ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border bg-muted/50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span
            id="ml-status-dot"
            className={`inline-block w-2 h-2 rounded-full ${statusDot.color} ${mlStatus === 'loading' ? 'animate-pulse' : ''}`}
          />
          <span className="text-xs text-muted-foreground">{statusDot.label}</span>
        </div>

        {/* Language selector pill */}
        <div className="relative" ref={langMenuRef}>
          <button
            type="button"
            onClick={() => setLangMenuOpen((o) => !o)}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-xs font-medium text-foreground transition-colors"
            title="Select language for voice input"
          >
            <span>{currentLang.flag}</span>
            <span>{currentLang.short}</span>
            <span className="text-muted-foreground">▾</span>
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 top-8 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[140px]">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setSelectedLang(lang.code);
                    setLangMenuOpen(false);
                    if (isListening) stopListening();
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-left ${
                    selectedLang === lang.code ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Degraded banner ──────────────────────────────────────────────────── */}
      {mlStatus === 'degraded' && (
        <div className={`px-4 py-2 border-b text-xs ${
          isWaking
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {isWaking ? `⏳ ${warningMessage}` : `⚠️ ${warningMessage}`}
        </div>
      )}

      {/* ── Message list ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
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
                    : 'bg-muted text-foreground rounded-bl-sm shadow-sm border border-border'
                }`}
              >
                {message.content || '…'}
              </div>

              {/* Speaker button for assistant messages */}
              {message.role === 'assistant' && (
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                    } else {
                      speak(message.content);
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title={isSpeaking ? 'Stop speaking' : `Read aloud in ${currentLang.label}`}
                >
                  {isSpeaking ? (
                    <VolumeX className="w-3 h-3" />
                  ) : (
                    <Volume2 className="w-3 h-3" />
                  )}
                </button>
              )}

              {message.sources && message.sources.length > 0 && (
                <div className="text-xs text-muted-foreground px-2">
                  Sources: {message.sources.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted border border-border shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
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

      {/* ── Disclaimer ─────────────────────────────────────────── */}
      <div className="text-center text-xs text-muted-foreground px-4 pb-2 bg-background">
        Matrny provides AI-generated health information only. Not a substitute for
        professional medical advice. Emergency: <strong>112</strong> | NHM:{' '}
        <strong>104</strong>
      </div>

      {/* ── Listening indicator ──────────────────────────────────── */}
      {isListening && (
        <div className="px-4 pb-1 bg-card flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">
            Listening in {currentLang.label}
            {interimText && (
              <span className="italic text-foreground/60"> — {interimText}</span>
            )}
          </span>
        </div>
      )}

      {/* ── Input area ─────────────────────────────────────────── */}
      <div className="p-4 border-t border-border bg-card">

        {/* TTS toggle */}
        <div className="flex items-center justify-end mb-2">
          <button
            type="button"
            onClick={() => {
              setTtsEnabled((v) => !v);
              if (isSpeaking) stopSpeaking();
            }}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
              ttsEnabled
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            title={ttsEnabled ? 'Turn off auto-read responses' : 'Auto-read AI responses aloud'}
          >
            {ttsEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            <span>{ttsEnabled ? 'Auto-read on' : 'Auto-read off'}</span>
          </button>
        </div>

        <div className="flex gap-2">
          {/* Mic button */}
          {micAvailable && (
            <button
              type="button"
              id="chat-mic-btn"
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all shrink-0 ${
                isListening
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              } disabled:opacity-50`}
              title={isListening ? 'Stop recording' : `Speak in ${currentLang.label}`}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}

          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              committedInputRef.current = e.target.value;
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? `Listening in ${currentLang.label}… tap mic to stop`
                : isMentalHealth
                ? "Share how you're feeling, or ask about postpartum emotions..."
                : "Ask about nutrition, symptoms, baby care, Ayurvedic remedies..."
            }
            className="flex-1 resize-none rounded-xl border border-border bg-background text-foreground px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-400 min-h-[44px] max-h-[120px]"
            rows={1}
          />

          <button
            type="button"
            id="chat-send-btn"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-rose-500 text-white rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-rose-600 transition-colors shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
