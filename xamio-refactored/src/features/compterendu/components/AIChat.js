/**
 * XAMIO — AIChat v2
 * Chat intelligent sur document · typing effect · markdown · suggestions
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCompteRendu } from '../../../context/CompteRenduContext';
import { SUGGESTED_QUESTIONS } from '../../../data/compteRenduMock';

/* ── Rendu markdown minimal ── */
function MarkdownText({ text }) {
  if (!text) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 5 }} />;
        // Render bold **...**
        const parts = line.split(/(\*\*[^*]+\*\*)/).map((p, j) =>
          p.startsWith('**') ? <strong key={j}>{p.slice(2,-2)}</strong> : p
        );
        if (line.startsWith('- ') || line.startsWith('• ')) return (
          <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--color-accent)', marginTop: 3, fontSize: 10, flexShrink: 0 }}>▸</span>
            <span>{line.replace(/^[-•]\s*/,'')}</span>
          </div>
        );
        if (/^\d+\./.test(line)) return (
          <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--color-accent)', fontSize: 10, flexShrink: 0, marginTop: 3, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{line.match(/^\d+/)[0]}.</span>
            <span>{line.replace(/^\d+\.\s*/,'')}</span>
          </div>
        );
        if (line.startsWith('|')) return <p key={i} style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--color-text-muted)' }}>{line}</p>;
        return <p key={i} style={{ margin: 0, lineHeight: 1.65 }}>{parts}</p>;
      })}
    </div>
  );
}

/* ── Typing effect ── */
function TypingText({ text, onDone }) {
  const [shown, setShown] = useState('');
  const idxRef = useRef(0);

  useEffect(() => {
    idxRef.current = 0;
    setShown('');
  }, [text]);

  useEffect(() => {
    if (idxRef.current >= text.length) { onDone?.(); return; }
    const ch = text[idxRef.current];
    const speed = ch === '\n' ? 25 : ch === ' ' ? 30 : 10 + Math.random() * 12;
    const t = setTimeout(() => {
      idxRef.current++;
      setShown(text.slice(0, idxRef.current));
    }, speed);
    return () => clearTimeout(t);
  });

  return <MarkdownText text={shown} />;
}

/* ── Bulle message ── */
function ChatBubble({ msg, isLast }) {
  const isAI = msg.role === 'ai';
  const [typed, setTyped] = useState(false);

  return (
    <div style={{ display: 'flex', gap: 9, flexDirection: isAI ? 'row' : 'row-reverse', alignItems: 'flex-start', animation: 'msgIn 220ms ease both' }}>
      {/* Avatar */}
      <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: isAI ? 'var(--color-accent-bg)' : 'var(--color-purple-bg)', border: `1px solid ${isAI ? 'var(--color-accent-border)' : 'var(--color-purple-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
        {isAI ? '🤖' : '👤'}
      </div>
      {/* Bubble */}
      <div style={{ maxWidth: '84%', background: isAI ? 'var(--color-background-tertiary)' : 'var(--color-accent-bg)', border: `1px solid ${isAI ? 'var(--color-border-medium)' : 'var(--color-accent-border)'}`, borderRadius: isAI ? '3px 11px 11px 11px' : '11px 3px 11px 11px', padding: '9px 13px' }}>
        <div style={{ fontSize: 12, color: isAI ? 'var(--color-text-secondary)' : 'var(--color-text-primary)', fontFamily: 'var(--font-sans)', lineHeight: 1.65 }}>
          {isAI && isLast && !typed
            ? <TypingText text={msg.text} onDone={() => setTyped(true)} />
            : <MarkdownText text={msg.text} />
          }
        </div>
        <p style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 5, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
          {msg.ts?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

/* ── Typing indicator ── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🤖</div>
      <div style={{ background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border-medium)', borderRadius: '3px 11px 11px 11px', padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)', animation: `bounce 1.2s ${i*.2}s ease-in-out infinite` }} />)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   AIChat principal
   ══════════════════════════════════════════════════════════════ */
export default function AIChat() {
  const { messages, isTyping, sendMessage, isAnalyzed } = useCompteRendu();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const isEmpty   = messages.length === 0;

  // Auto-scroll vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const send = useCallback((text) => {
    const q = (text || input).trim();
    if (!q || isTyping) return;
    sendMessage(q);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [input, isTyping, sendMessage]);

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  if (!isAnalyzed) return null;

  return (
    <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-medium)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeSlide 400ms ease' }}>
      {/* Header */}
      <div style={{ padding: '11px 14px', background: 'var(--color-background-tertiary)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', animation: 'pulse 2s ease-in-out infinite' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '.07em' }}>CHAT IA · POSEZ VOS QUESTIONS</span>
        {messages.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {messages.length} msg{messages.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 260, maxHeight: 380 }}>
        {/* Empty state */}
        {isEmpty && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '24px 12px', flex: 1 }}>
            <div style={{ fontSize: 32 }}>💬</div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', textAlign: 'center' }}>
              Document prêt — posez votre première question
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.6, maxWidth: 260 }}>
              Je peux résumer, clarifier des points, lister des décisions ou extraire des actions de ce compte rendu.
            </p>
          </div>
        )}
        {/* Messages list */}
        {messages.map((msg, i) => (
          <ChatBubble key={msg.id} msg={msg} isLast={i === messages.length - 1} />
        ))}
        {isTyping && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {isEmpty && (
        <div style={{ padding: '0 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button key={i} onClick={() => send(q)} disabled={isTyping} style={{ padding: '4px 11px', borderRadius: 20, border: '1px solid var(--color-border-medium)', background: 'var(--color-background-elevated)', fontSize: 10.5, color: 'var(--color-text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', transition: 'all 120ms' }}
              onMouseOver={e => { e.currentTarget.style.borderColor='var(--color-accent-border)'; e.currentTarget.style.color='var(--color-accent)'; e.currentTarget.style.background='var(--color-accent-bg)'; }}
              onMouseOut={e =>  { e.currentTarget.style.borderColor='var(--color-border-medium)'; e.currentTarget.style.color='var(--color-text-secondary)'; e.currentTarget.style.background='var(--color-background-elevated)'; }}
            >{q}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)', background: 'var(--color-background-tertiary)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          rows={1}
          disabled={isTyping}
          placeholder="Posez une question sur ce document…"
          style={{ flex: 1, resize: 'none', border: '1px solid var(--color-border-medium)', borderRadius: 9, padding: '8px 11px', background: 'var(--color-background-elevated)', color: 'var(--color-text-primary)', fontSize: 12, fontFamily: 'var(--font-sans)', lineHeight: 1.5, outline: 'none', opacity: isTyping ? .5 : 1, transition: 'border-color 120ms', overflowY: 'hidden' }}
          onFocus={e => e.target.style.borderColor = 'var(--color-accent-border)'}
          onBlur={e  => e.target.style.borderColor = 'var(--color-border-medium)'}
        />
        <button onClick={() => send()} disabled={!input.trim() || isTyping} style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, border: 'none', background: input.trim() && !isTyping ? 'var(--color-accent)' : 'var(--color-background-elevated)', cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed', color: input.trim() && !isTyping ? '#fff' : 'var(--color-text-muted)', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 160ms', transform: input.trim() && !isTyping ? 'scale(1)' : 'scale(.92)' }}>
          ↑
        </button>
      </div>

      <style>{`
        @keyframes msgIn    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlide{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce   { 0%,80%,100%{transform:scale(.55);opacity:.4} 40%{transform:scale(1);opacity:1} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </div>
  );
}
