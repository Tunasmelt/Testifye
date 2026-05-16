'use client';

/**
 * SidekickChat — project-scoped conversational QA assistant.
 * Phase 1: session-only memory (React state, cleared on refresh).
 * Phase 2 will persist to chat_sessions table.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import * as I from '@/components/ui/Icons';
import { SimpleMarkdown } from './SimpleMarkdown';

// ── Types ────────────────────────────────────────────────────────────────────

type Role = 'system' | 'user' | 'assistant';

interface Message {
  role:      Role;
  text:      string;
  streaming?: boolean;
}

interface Props {
  projectId:   string;
  projectName: string;
}

// ── Preset chips (shown when conversation is empty) ───────────────────────────

const CHAT_PRESETS = [
  'Summarize test coverage',
  "What's missing from UX?",
  'Generate edge case ideas',
  'Explain the Gap findings',
];

// ── Avatar helper ─────────────────────────────────────────────────────────────

function Avatar({ role }: { role: Role }) {
  if (role === 'user') {
    return (
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: 'var(--bg-3)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 10, fontWeight: 700,
        color: 'var(--text-1)',
      }}>
        YOU
      </div>
    );
  }
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 8,
      background: 'linear-gradient(135deg, var(--accent), #6366F1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <I.Sparkle size={14} style={{ color: '#fff' }} />
    </div>
  );
}

// ── Typing indicator (3 bouncing dots) ────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 14 }}>
      <span className="tf-typing-dot" />
      <span className="tf-typing-dot" />
      <span className="tf-typing-dot" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SidekickChat({ projectId, projectName }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      text: `Hi! I'm scoped to your **${projectName}** project. I know your analyzed screens, test cases, and the latest artifacts. Ask me anything QA-related.`,
    },
  ]);
  const [input,     setInput]     = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const abortRef   = useRef<AbortController | null>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const send = useCallback(async (overrideText?: string) => {
    const q = (overrideText ?? input).trim();
    if (!q || streaming) return;

    // Optimistically add user message + empty assistant bubble
    setMessages((prev) => [
      ...prev,
      { role: 'user',      text: q },
      { role: 'assistant', text: '', streaming: true },
    ]);
    setInput('');
    setStreaming(true);

    // Build conversation history (exclude system greeting, convert to API shape)
    const history = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.text }));
    history.push({ role: 'user', content: q });

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/generate/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  ctrl.signal,
        body:    JSON.stringify({ projectId, messages: history }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Stream SSE line-by-line
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buf     = '';
      let   accumulated = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6)) as { type: string; text?: string; message?: string };
            if (event.type === 'delta' && event.text) {
              accumulated += event.text;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'assistant', text: accumulated, streaming: true };
                return copy;
              });
            } else if (event.type === 'done') {
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'assistant', text: accumulated };
                return copy;
              });
            } else if (event.type === 'error') {
              throw new Error(event.message ?? 'Stream error');
            }
          } catch {
            // Malformed JSON line — skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // User cancelled — leave whatever accumulated text is there
        setMessages((prev) => {
          const copy = [...prev];
          if (copy[copy.length - 1]?.streaming) {
            copy[copy.length - 1] = { ...copy[copy.length - 1], streaming: false };
          }
          return copy;
        });
      } else {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: 'assistant',
            text: "Sorry — couldn't reach the model. Try again in a moment.",
          };
          return copy;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }, [input, streaming, messages, projectId]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const hasConversation = messages.length > 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="tf-page-header" style={{ flexShrink: 0 }}>
        <div>
          <div className="tf-page-title">
            <I.Chat size={20} style={{ color: 'var(--accent-2)' }} />
            Sidekick
          </div>
          <div className="tf-page-sub">
            Project-aware chat. Knows your scope, screens, and every artifact you&apos;ve generated.
          </div>
        </div>
        {hasConversation && (
          <button
            className="tf-btn tf-btn-ghost tf-btn-sm"
            onClick={() => setMessages([messages[0]])}
            title="Clear chat"
          >
            <I.Refresh size={13} /> Clear
          </button>
        )}
      </div>

      {/* ── Session notice ─────────────────────────────────────────────────── */}
      {!hasConversation && (
        <div
          className="tf-card"
          style={{ marginBottom: 16, padding: '10px 14px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <I.Alert size={14} style={{ color: 'var(--text-1)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-1)' }}>
            Chat history is session-only — refreshing the page will clear it.
          </span>
        </div>
      )}

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
          gap: 14, padding: '0 0 12px', minHeight: 0,
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className="tf-fade-in"
            style={{
              display:       'flex',
              gap:           10,
              alignItems:    'flex-start',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <Avatar role={msg.role} />

            <div style={{
              maxWidth:    '78%',
              padding:     '10px 14px',
              background:  msg.role === 'user' ? 'var(--accent-glow)' : 'var(--bg-2)',
              border:      `1px solid ${msg.role === 'user' ? 'var(--accent-strong)' : 'var(--border)'}`,
              borderRadius: 12,
              fontSize:    13,
              lineHeight:  1.6,
              wordBreak:   'break-word',
              color:       'var(--text-0)',
            }}>
              {msg.streaming && !msg.text
                ? <TypingDots />
                : <SimpleMarkdown text={msg.text} />
              }
            </div>
          </div>
        ))}
      </div>

      {/* ── Preset chips (shown only before first user message) ─────────── */}
      {!hasConversation && (
        <div style={{ flexShrink: 0, padding: '8px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CHAT_PRESETS.map((preset) => (
            <button
              key={preset}
              className="tf-chip"
              style={{ cursor: 'pointer' }}
              onClick={() => send(preset)}
              disabled={streaming}
            >
              {preset}
            </button>
          ))}
        </div>
      )}

      {/* ── Input area ─────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            className="tf-input"
            placeholder="Ask Sidekick about your project…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming}
            rows={2}
            style={{
              flex:   1,
              resize: 'none',
              height: 'auto',
              minHeight: 44,
              maxHeight: 120,
              fontFamily: 'inherit',
              fontSize:   13,
            }}
          />
          <button
            className="tf-btn tf-btn-primary"
            onClick={() => send()}
            disabled={streaming || !input.trim()}
            style={{ height: 44, paddingInline: 16, flexShrink: 0 }}
          >
            <I.Send size={14} />
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 6 }}>
          Context: <strong style={{ color: 'var(--text-1)' }}>{projectName}</strong> · Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
