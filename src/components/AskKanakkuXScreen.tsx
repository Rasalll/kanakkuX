'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useLedger } from '../context/LedgerContext';

const SUGGESTIONS = [
  'How much did I spend last month?',
  'What was my biggest expense?',
  'How much did I spend on food?',
  'How much income did I receive this month?',
  'Who owes me money?',
  'How much is still pending?',
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  mock?: boolean;
  error?: boolean;
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now()) + Math.random().toString(16).slice(2);
}

export const AskKanakkuXScreen: React.FC = () => {
  const { setActiveTab } = useLedger();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lastFailed, setLastFailed] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;

    setInput('');
    setLastFailed(null);
    const userMsg: ChatMessage = { id: newId(), role: 'user', text: message };
    const history = [...messages, userMsg];
    setMessages(history);
    setSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversation: history.slice(0, -1).map(m => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLastFailed(message);
        setMessages(prev => [
          ...prev,
          {
            id: newId(),
            role: 'assistant',
            text: data.error || 'I could not answer that. Please try again.',
            error: true,
          },
        ]);
        return;
      }
      setMessages(prev => [
        ...prev,
        {
          id: newId(),
          role: 'assistant',
          text: data.reply || 'I could not find the requested information.',
          mock: Boolean(data.mock),
        },
      ]);
    } catch {
      setLastFailed(message);
      setMessages(prev => [
        ...prev,
        {
          id: newId(),
          role: 'assistant',
          text: 'Network error. Check your connection and try again.',
          error: true,
        },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-surface">
      <header className="shrink-0 sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-surface-container/60">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low"
            aria-label="Back to dashboard"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-on-surface font-bold leading-tight">Ask KanakkuX</span>
            <span className="text-[11px] text-outline leading-tight">Your financial assistant</span>
          </div>
        </div>
      </header>

      <div ref={scrollerRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]">auto_awesome</span>
            </div>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">Ask KanakkuX</h1>
            <p className="mt-1 text-sm text-on-surface-variant max-w-sm">
              Ask me anything about your expenses, income, and money owed.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 max-w-md">
              {SUGGESTIONS.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
                  className="px-3 py-2 rounded-full bg-surface-container-low border border-surface-container text-left text-sm text-on-surface hover:bg-surface-container transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => (
          <div
            key={m.id}
            className={`mb-3 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-primary text-on-primary rounded-br-md'
                  : m.error
                    ? 'bg-error-container text-on-error-container rounded-bl-md'
                    : 'bg-surface-container-lowest border border-surface-container text-on-surface rounded-bl-md'
              }`}
            >
              {m.text}
              {m.mock && (
                <p className="mt-1.5 text-[10px] uppercase tracking-wide text-outline">
                  Demo reply — add GEMINI_API_KEY for live answers
                </p>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="mb-3 flex justify-start">
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl rounded-bl-md px-4 py-3 text-on-surface-variant text-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        {lastFailed && !sending && (
          <div className="mb-2 flex justify-center">
            <button
              type="button"
              onClick={() => void send(lastFailed)}
              className="text-sm font-semibold text-primary"
            >
              Retry last question
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="shrink-0 border-t border-surface-container/60 bg-surface px-3 pt-2 pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-4"
      >
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Ask about your finances..."
            className="flex-1 resize-none max-h-28 min-h-[44px] rounded-2xl bg-surface-container-low border border-surface-container px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            aria-label="Send"
            className="min-w-[44px] min-h-[44px] rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
      </form>
    </div>
  );
};
