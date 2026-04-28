import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import XamioLogo from '../../../components/ui/XamioLogo';
import { ThemePicker } from '../../../components/ui/ThemeToggle';
import { useSidebar } from '../../../context/SidebarContext';

/* ── Config ────────────────────────────────────────────────────────────── */

// URL de base de l'API Laravel backend
// En prod : variable d'env Vite → import.meta.env.VITE_API_URL
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

// Récupérer le token Sanctum depuis localStorage (clé standard Laravel)
// Adapte cette clé selon ton système d'auth
const getAuthToken = () => localStorage.getItem('sanctum_token') ?? '';

/* ── Context per page ──────────────────────────────────────────────────── */
const PAGE_CONTEXT = {
  '/':             "L'utilisateur est sur le tableau de bord XAMIO (stats, réunions à venir, actions).",
  '/meetings':     "L'utilisateur gère ses réunions : planification, comptes-rendus, résumés IA.",
  '/tasks':        "L'utilisateur est sur le Kanban de tâches : créer, déplacer entre colonnes.",
  '/documents':    "L'utilisateur gère ses documents : upload, partage, stockage cloud sécurisé.",
  '/appointments': "L'utilisateur gère ses rendez-vous professionnels.",
  '/workshops':    "L'utilisateur organise des ateliers internes.",
};

const SYSTEM = `Tu es XAMIO Assistant, l'IA intégrée à la plateforme XAMIO — SaaS de gestion d'entreprise pour l'Afrique.

Tu aides les utilisateurs à :
- Gérer réunions, tâches, documents, rendez-vous et ateliers
- Rédiger comptes-rendus, résumés, plans d'action
- Comprendre et utiliser XAMIO

XAMIO en bref :
- 5 modules : Réunions, Tâches Kanban, Documents, Rendez-vous, Ateliers
- Plans : Gratuit (0 FCFA, 5 users) · Pro (2 500 FCFA/user/mois) · Entreprise (sur devis)
- Sécurité : JWT, 2FA, RBAC, TLS, backups quotidiens
- IA : résumés automatiques, extraction décisions, suggestions planning
- Marché : entreprises africaines, tarification FCFA

Règles : réponds en français, sois concis et utile, utilise des listes quand pertinent, propose des actions concrètes liées à la page active.`;

/* ── Markdown renderer ─────────────────────────────────────────────────── */
function Md({ text }) {
  const lines = text.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { out.push(<div key={i} style={{ height: 6 }} />); i++; continue; }
    if (/^[-•*]\s/.test(l)) {
      const items = [];
      while (i < lines.length && /^[-•*]\s/.test(lines[i])) {
        items.push(<li key={i} style={{ marginBottom: 3 }}>{inlineFmt(lines[i].replace(/^[-•*]\s/, ''))}</li>);
        i++;
      }
      out.push(<ul key={`ul${i}`} style={{ paddingLeft: 14, margin: '4px 0' }}>{items}</ul>);
      continue;
    }
    if (/^\d+\.\s/.test(l)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i} style={{ marginBottom: 3 }}>{inlineFmt(lines[i].replace(/^\d+\.\s/, ''))}</li>);
        i++;
      }
      out.push(<ol key={`ol${i}`} style={{ paddingLeft: 14, margin: '4px 0' }}>{items}</ol>);
      continue;
    }
    if (/^#{1,3}\s/.test(l)) {
      out.push(<p key={i} style={{ fontWeight: 600, fontSize: 13, margin: '8px 0 3px', color: 'var(--color-text-primary)' }}>{l.replace(/^#+\s/, '')}</p>);
      i++; continue;
    }
    out.push(<p key={i} style={{ margin: '2px 0', lineHeight: 1.65 }}>{inlineFmt(l)}</p>);
    i++;
  }
  return <>{out}</>;
}

function inlineFmt(t) {
  return t.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (/^\*\*.*\*\*$/.test(p)) return <strong key={i} style={{ color: 'var(--color-warning)' }}>{p.slice(2, -2)}</strong>;
    if (/^`.*`$/.test(p)) return <code key={i} style={{ background: 'var(--color-background-elevated)', borderRadius: 3, padding: '1px 5px', fontSize: 11, fontFamily: 'var(--mono)' }}>{p.slice(1, -1)}</code>;
    return p;
  });
}

/* ── Typing dots ───────────────────────────────────────────────────────── */
function Dots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-warning)', opacity: 0.5, animation: `pulse 1.1s ease ${i * 0.18}s infinite` }} />
      ))}
    </div>
  );
}

/* ── Source card (RAG) ─────────────────────────────────────────────────── */
function SourceCard({ source, index }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      onClick={() => setExpanded(e => !e)}
      style={{
        width: '100%',
        background: 'var(--color-background-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        padding: '7px 10px',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--font-sans)',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-warning-border)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Index badge */}
        <span style={{
          width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
          background: 'var(--color-warning)', color: 'var(--color-background)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 700,
        }}>{index + 1}</span>

        {/* Doc name */}
        <span style={{
          flex: 1, fontSize: 11, fontWeight: 500,
          color: 'var(--color-text-secondary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{source.doc_nom}</span>

        {/* Similarity */}
        <span style={{ fontSize: 10, color: 'var(--color-warning)', fontWeight: 600, fontFamily: 'var(--mono)', flexShrink: 0 }}>
          {source.similarite}
        </span>

        <span style={{ fontSize: 9, color: 'var(--color-text-muted)', flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <p style={{ margin: '7px 0 0 22px', fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.55 }}>
          {source.extrait}
        </p>
      )}
    </button>
  );
}

/* ── RAG message bubble ────────────────────────────────────────────────── */
function RagBubble({ msg }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <div style={{
          maxWidth: '80%',
          background: 'var(--color-warning)',
          color: 'var(--color-background)',
          borderRadius: '12px 12px 3px 12px',
          padding: '9px 12px',
          fontSize: 12,
          lineHeight: 1.6,
          fontFamily: 'var(--font-sans)',
        }}>
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
      {/* Avatar */}
      <div style={{
        width: 22, height: 22, borderRadius: 6, background: 'var(--color-warning)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
      }}>
        <svg width="10" height="10" viewBox="0 0 144 144" fill="none">
          <polygon points="0,0 28,0 72,72 44,72" fill="#4FA3F7"/>
          <polygon points="0,144 28,144 72,72 44,72" fill="#4FA3F7" opacity=".8"/>
          <polygon points="144,0 116,0 72,72 100,72" fill="#FFB300"/>
          <polygon points="144,144 116,144 72,72 100,72" fill="#FF6A00" opacity=".8"/>
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Response text */}
        <div style={{
          background: 'var(--color-background-tertiary)',
          border: '1px solid var(--color-border)',
          borderRadius: '3px 12px 12px 12px',
          padding: '9px 12px',
          fontSize: 12,
          lineHeight: 1.6,
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-text-primary)',
        }}>
          <Md text={msg.content} />
        </div>

        {/* Sources */}
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <p style={{
              fontSize: 10, color: 'var(--color-text-muted)',
              margin: '0 0 5px 2px', letterSpacing: '.05em', fontWeight: 500,
              fontFamily: 'var(--font-sans)',
            }}>
              SOURCES · {msg.sources.length} document{msg.sources.length > 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {msg.sources.map((src, i) => (
                <SourceCard key={i} source={src} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Token count */}
        {msg.tokens != null && (
          <p style={{ margin: '5px 0 0 2px', fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--mono)' }}>
            {msg.tokens.toLocaleString('fr-FR')} tokens · Gemini Flash
          </p>
        )}
      </div>
    </div>
  );
}

/* ── RAG empty state ───────────────────────────────────────────────────── */
const RAG_SUGGESTIONS = [
  "Quelles décisions ont été prises lors de la dernière réunion ?",
  "Résume les actions en attente pour mon équipe.",
  "Y a-t-il des réunions annulées avec des motifs importants ?",
  "Quels sont les points clés des comptes rendus de ce mois ?",
];

function RagEmptyState({ onSuggest, stats }) {
  return (
    <div>
      {/* Stats mini */}
      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16,
        }}>
          {[
            { label: 'Docs indexés', value: stats.docs_indexes ?? '—' },
            { label: 'Chunks',       value: stats.total_chunks?.toLocaleString('fr-FR') ?? '—' },
            { label: 'Questions',    value: stats.total_questions ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'var(--color-background-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '8px 10px',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--color-warning)' }}>{value}</p>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--color-text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12, lineHeight: 1.65, fontFamily: 'var(--font-sans)' }}>
        Posez une question sur vos documents indexés.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {RAG_SUGGESTIONS.map(s => (
          <button key={s} onClick={() => onSuggest(s)}
            style={{
              background: 'var(--color-background-tertiary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-medium)',
              padding: '8px 12px',
              cursor: 'pointer', fontSize: 12,
              color: 'var(--color-text-secondary)',
              textAlign: 'left', fontFamily: 'var(--font-sans)',
              transition: 'all var(--transition-normal)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-warning-border)'; e.currentTarget.style.color = 'var(--color-warning)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Mode pill toggle ──────────────────────────────────────────────────── */
function ModePill({ mode, onChange }) {
  return (
    <div style={{ display: 'flex', background: 'var(--color-background-elevated)', borderRadius: 8, padding: 2, gap: 1 }}>
      {[
        { id: 'chat', label: '💬 Chat' },
        { id: 'rag',  label: '📄 Documents' },
      ].map(({ id, label }) => (
        <button key={id} onClick={() => onChange(id)} style={{
          background: mode === id ? 'var(--color-background-secondary)' : 'transparent',
          border: 'none', borderRadius: 6, padding: '4px 10px',
          cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-sans)',
          color: mode === id ? 'var(--color-warning)' : 'var(--color-text-muted)',
          transition: 'all var(--transition-normal)', whiteSpace: 'nowrap',
        }}>
          {label}
        </button>
      ))}
    </div>
  );
}

/* ── Quick suggestions (chat) ──────────────────────────────────────────── */
const QUICK = [
  { label: 'Rédiger un compte-rendu',   text: "Aide-moi à structurer un compte-rendu de réunion avec décisions et actions." },
  { label: 'Plans tarifaires XAMIO',    text: "Quelles sont les différences entre les plans Gratuit, Pro et Entreprise ?" },
  { label: "Générer un plan d'action",  text: "Crée un plan d'action en 5 étapes pour lancer un projet." },
  { label: 'Sécurité des données',      text: "Comment XAMIO protège-t-il mes données d'entreprise ?" },
];

/* ══════════════════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════════════════ */
export default function AIAssistant() {
  const location   = useLocation();
  const { isMobile } = useSidebar();

  // Panel state
  const [open, setOpen]   = useState(false);
  const [tab, setTab]     = useState('chat'); // 'chat' | 'settings'
  const [mode, setMode]   = useState('chat'); // 'chat' | 'rag'

  // Chat (Claude direct)
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]       = useState('');
  const [chatLoading, setChatLoading]   = useState(false);
  const [chatError, setChatError]       = useState('');

  // RAG
  const [ragMessages, setRagMessages]   = useState([]);
  const [ragInput, setRagInput]         = useState('');
  const [ragLoading, setRagLoading]     = useState(false);
  const [ragError, setRagError]         = useState('');
  const [ragStats, setRagStats]         = useState(null);

  const endRef   = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, ragMessages, chatLoading, ragLoading]);

  // Focus input on open
  useEffect(() => { if (open && tab === 'chat') setTimeout(() => inputRef.current?.focus(), 150); }, [open, tab]);

  // Load RAG stats on panel open (mode rag) or mode switch
  useEffect(() => {
    if (open && mode === 'rag' && !ragStats) {
      fetchRagStats();
    }
  }, [open, mode]);

  /* ── Auth header ── */
  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`,
    'Accept': 'application/json',
  }), []);

  /* ── Fetch RAG stats ── */
  const fetchRagStats = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/rag/stats`, { headers: authHeaders() });
      const data = await res.json();
      if (data?.data) setRagStats(data.data);
    } catch (_) {
      // silently fail — stats are non-critical
    }
  }, [authHeaders]);

  /* ────────────────────────────────────────────────────────────────────────
     CHAT SEND (appel direct Claude via Anthropic API)
     ⚠  En production : remplacer par un appel à ton backend Laravel
         POST /api/ai/chat  qui détient la clé API côté serveur.
  ──────────────────────────────────────────────────────────────────────── */
  const sendChat = useCallback(async (txt) => {
    const text = (txt || chatInput).trim();
    if (!text || chatLoading) return;
    setChatInput(''); setChatError('');

    const userMsg = { role: 'user', content: text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const ctx = PAGE_CONTEXT[location.pathname] || '';
      const sys = ctx ? `${SYSTEM}\n\nContexte actuel : ${ctx}` : SYSTEM;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: sys,
          messages: [...chatMessages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error?.message || `Erreur API (${res.status})`);
      }

      const data  = await res.json();
      const reply = data.content?.map(b => b.text || '').join('') || '';
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);

    } catch (e) {
      setChatError(e.message || 'Erreur de connexion.');
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatMessages, chatLoading, location.pathname]);

  /* ────────────────────────────────────────────────────────────────────────
     RAG SEND (appel backend Laravel → RagService → Gemini)
  ──────────────────────────────────────────────────────────────────────── */
  const sendRag = useCallback(async (txt) => {
    const question = (txt || ragInput).trim();
    if (!question || ragLoading) return;
    setRagInput(''); setRagError('');

    const userMsg = { role: 'user', content: question };
    setRagMessages(prev => [...prev, userMsg]);
    setRagLoading(true);

    try {
      const res = await fetch(`${API_BASE}/rag/query`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 402 = module IA non inclus dans le plan
        if (res.status === 402) {
          throw new Error("Le module Documents IA n'est pas inclus dans votre plan. Passez au plan Pro.");
        }
        throw new Error(data?.message || `Erreur ${res.status}`);
      }

      const assistantMsg = {
        role:    'assistant',
        content: data.data.reponse,
        sources: data.data.sources     || [],
        tokens:  data.data.tokens_utilises ?? null,
      };

      setRagMessages(prev => [...prev, assistantMsg]);

      // Mettre à jour les stats après chaque question
      fetchRagStats();

    } catch (e) {
      setRagError(e.message || 'Erreur de connexion au service RAG.');
    } finally {
      setRagLoading(false);
    }
  }, [ragInput, ragMessages, ragLoading, authHeaders, fetchRagStats]);

  /* ── Keyboard shortcuts ── */
  const onChatKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } };
  const onRagKey  = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendRag(); } };

  /* ── Textarea auto-resize ── */
  const autoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
  };

  /* ── Current state helpers ── */
  const isRag     = mode === 'rag';
  const messages  = isRag ? ragMessages  : chatMessages;
  const loading   = isRag ? ragLoading   : chatLoading;
  const error     = isRag ? ragError     : chatError;
  const inputVal  = isRag ? ragInput     : chatInput;
  const setInput  = isRag ? setRagInput  : setChatInput;
  const sendFn    = isRag ? sendRag      : sendChat;
  const onKey     = isRag ? onRagKey     : onChatKey;

  /* ────────────────────────────────────────────────────────────────────────
     RENDER
  ──────────────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── FAB ── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="XAMIO Assistant IA"
        style={{
          position: 'fixed',
          bottom: isMobile ? 16 : 28,
          right:  isMobile ? 16 : 28,
          width: 48, height: 48,
          borderRadius: '50%',
          background: open ? 'var(--color-background-tertiary)' : 'var(--color-warning)',
          border: open ? '1px solid var(--color-warning-border)' : 'none',
          boxShadow: open ? 'none' : '0 4px 20px rgba(200,146,42,0.35)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
          transition: 'all 0.22s ease',
        }}
      >
        {open
          ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="3" y1="3" x2="13" y2="13" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round"/><line x1="13" y1="3" x2="3" y2="13" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round"/></svg>
          : <XamioLogo variant="mark" height={22} />
        }
      </button>

      {/* ── Panel ── */}
      {open && (
        <div className="animate-enter" style={{
          position: 'fixed',
          bottom: isMobile ? 74    : 86,
          right:  isMobile ? 12   : 28,
          left:   isMobile ? 12   : 'auto',
          width:  isMobile ? 'auto' : 380,
          height: isMobile ? 'min(520px, calc(100vh - 140px))' : 'min(560px, calc(100vh - 140px))',
          background: 'var(--color-background-secondary)',
          border: '1px solid var(--color-border-medium)',
          borderRadius: 10,
          boxShadow: 'var(--shadow-modal)',
          display: 'flex', flexDirection: 'column',
          zIndex: 1001, overflow: 'hidden',
        }}>

          {/* ── Header ── */}
          <div style={{
            padding: '13px 16px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--color-background-tertiary)',
            flexShrink: 0, gap: 10,
          }}>
            {/* Logo + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <XamioLogo variant="mark" height={28} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)', lineHeight: 1.1 }}>
                  Assistant IA
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sage)' }} />
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--mono)', letterSpacing: '.03em' }}>
                    {isRag ? 'Gemini Flash · RAG' : 'Claude Sonnet'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Mode toggle — visible only on chat tab */}
              {tab === 'chat' && <ModePill mode={mode} onChange={setMode} />}

              {/* Tab pills */}
              <div style={{ display: 'flex', background: 'var(--color-background-elevated)', borderRadius: 8, padding: 2, gap: 1 }}>
                {[['chat', '💬'], ['settings', '⚙']].map(([t, ic]) => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    background: tab === t ? 'var(--color-background-secondary)' : 'transparent',
                    border: 'none', borderRadius: 6, padding: '4px 9px', cursor: 'pointer',
                    fontSize: 12, color: tab === t ? 'var(--color-warning)' : 'var(--color-text-muted)',
                    transition: 'all var(--transition-normal)',
                  }}>{ic}</button>
                ))}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              TAB: CHAT
          ══════════════════════════════════════════════════════════════ */}
          {tab === 'chat' && (
            <>
              {/* Messages area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>

                {/* ── Empty state ── */}
                {messages.length === 0 && (
                  isRag
                    ? <RagEmptyState onSuggest={txt => sendRag(txt)} stats={ragStats} />
                    : (
                      <div>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16, lineHeight: 1.65, fontFamily: 'var(--font-sans)' }}>
                          Bonjour. Comment puis-je vous aider avec XAMIO ?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {QUICK.map(q => (
                            <button key={q.label} onClick={() => sendChat(q.text)}
                              style={{ background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-medium)', padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'left', fontFamily: 'var(--font-sans)', transition: 'all var(--transition-normal)' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-warning-border)'; e.currentTarget.style.color = 'var(--color-warning)'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                            >{q.label}</button>
                          ))}
                        </div>
                      </div>
                    )
                )}

                {/* ── Messages ── */}
                {messages.map((m, i) => (
                  isRag
                    ? <RagBubble key={i} msg={m} />
                    : (
                      <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10, gap: 8 }}>
                        {m.role === 'assistant' && (
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                            <svg width="10" height="10" viewBox="0 0 144 144" fill="none">
                              <polygon points="0,0 28,0 72,72 44,72" fill="#4FA3F7"/>
                              <polygon points="0,144 28,144 72,72 44,72" fill="#4FA3F7" opacity=".8"/>
                              <polygon points="144,0 116,0 72,72 100,72" fill="#FFB300"/>
                              <polygon points="144,144 116,144 72,72 100,72" fill="#FF6A00" opacity=".8"/>
                            </svg>
                          </div>
                        )}
                        <div style={{
                          maxWidth: '80%',
                          background: m.role === 'user' ? 'var(--color-warning)' : 'var(--color-background-tertiary)',
                          color: m.role === 'user' ? 'var(--color-background)' : 'var(--color-text-primary)',
                          borderRadius: m.role === 'user' ? '12px 12px 3px 12px' : '3px 12px 12px 12px',
                          padding: '9px 12px', fontSize: 12, lineHeight: 1.6, fontFamily: 'var(--font-sans)',
                        }}>
                          {m.role === 'user' ? m.content : <Md text={m.content} />}
                        </div>
                      </div>
                    )
                ))}

                {/* ── Typing indicator ── */}
                {loading && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="10" viewBox="0 0 144 144" fill="none">
                        <polygon points="0,0 28,0 72,72 44,72" fill="#4FA3F7"/>
                        <polygon points="0,144 28,144 72,72 44,72" fill="#4FA3F7" opacity=".8"/>
                        <polygon points="144,0 116,0 72,72 100,72" fill="#FFB300"/>
                        <polygon points="144,144 116,144 72,72 100,72" fill="#FF6A00" opacity=".8"/>
                      </svg>
                    </div>
                    <div style={{ background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: '3px 12px 12px 12px', padding: '9px 12px' }}>
                      <Dots />
                    </div>
                  </div>
                )}

                {/* ── Error ── */}
                {error && (
                  <div style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--color-danger)', marginBottom: 8 }}>
                    ⚠ {error}
                  </div>
                )}

                <div ref={endRef} />
              </div>

              {/* ── Input bar ── */}
              <div style={{ padding: '10px 12px', borderTop: '1px solid var(--color-border)', flexShrink: 0, background: 'var(--color-background-tertiary)' }}>
                {messages.length > 0 && (
                  <button
                    onClick={() => {
                      if (isRag) { setRagMessages([]); setRagError(''); }
                      else       { setChatMessages([]); setChatError(''); }
                    }}
                    style={{ fontSize: 10, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 7, padding: 0, fontFamily: 'var(--font-sans)', letterSpacing: '.03em' }}
                  >
                    Effacer la conversation
                  </button>
                )}

                {/* RAG disclaimer */}
                {isRag && messages.length === 0 && (
                  <p style={{ fontSize: 10, color: 'var(--color-text-muted)', margin: '0 0 7px', fontFamily: 'var(--font-sans)' }}>
                    Les réponses s'appuient uniquement sur vos documents indexés.
                  </p>
                )}

                <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
                  <textarea
                    ref={inputRef}
                    value={inputVal}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKey}
                    onInput={autoResize}
                    placeholder={isRag ? "Question sur vos documents…" : "Votre question… (Entrée pour envoyer)"}
                    rows={1}
                    style={{
                      flex: 1, background: 'var(--color-background-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-medium)',
                      padding: '8px 11px', color: 'var(--color-text-primary)',
                      fontSize: 12, outline: 'none', resize: 'none',
                      fontFamily: 'var(--font-sans)', lineHeight: 1.5,
                      maxHeight: 80, overflowY: 'auto',
                      transition: 'border var(--transition-normal)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-warning-border)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                  />
                  <button
                    onClick={() => sendFn()}
                    disabled={!inputVal.trim() || loading}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: inputVal.trim() && !loading ? 'var(--color-warning)' : 'var(--color-background-elevated)',
                      border: 'none',
                      cursor: inputVal.trim() && !loading ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all var(--transition-normal)',
                    }}
                  >
                    {loading
                      ? <span style={{ width: 12, height: 12, border: '1.5px solid var(--color-text-muted)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill={inputVal.trim() ? 'var(--color-background)' : 'var(--color-text-muted)'}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    }
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB: SETTINGS
          ══════════════════════════════════════════════════════════════ */}
          {tab === 'settings' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 22 }}>

              {/* Apparence */}
              <div>
                <p style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '.1em', marginBottom: 12, fontWeight: 500, fontFamily: 'var(--font-sans)' }}>APPARENCE</p>
                <div style={{ background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-medium)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Thème de l'interface</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Sombre ou clair</p>
                  </div>
                  <ThemePicker />
                </div>
              </div>

              {/* Mode Chat */}
              <div>
                <p style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '.1em', marginBottom: 12, fontWeight: 500, fontFamily: 'var(--font-sans)' }}>MODE CHAT · CLAUDE SONNET</p>
                <div style={{ background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-medium)', padding: '14px 16px' }}>
                  {[['Modèle','Claude Sonnet'],['Langue','Français'],['Contexte','Sensible à la page'],['Données','Non conservées']].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9, fontSize: 12 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{k}</span>
                      <span style={{ fontWeight: 500, color: 'var(--color-warning)', fontFamily: 'var(--mono)', fontSize: 11 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mode RAG */}
              <div>
                <p style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '.1em', marginBottom: 12, fontWeight: 500, fontFamily: 'var(--font-sans)' }}>MODE DOCUMENTS · RAG</p>
                <div style={{ background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-medium)', padding: '14px 16px' }}>
                  {[
                    ['Embedding',  'text-embedding-004'],
                    ['Génération', 'gemini-1.5-flash'],
                    ['Coût',       'Gratuit (free tier)'],
                    ['Sources',    'Top-5 par similarité cosinus'],
                    ['Docs indexés', ragStats ? `${ragStats.docs_indexes}` : '—'],
                    ['Chunks',     ragStats ? ragStats.total_chunks?.toLocaleString('fr-FR') : '—'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9, fontSize: 12 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{k}</span>
                      <span style={{ fontWeight: 500, color: 'var(--color-warning)', fontFamily: 'var(--mono)', fontSize: 11 }}>{v}</span>
                    </div>
                  ))}
                  {/* Refresh stats */}
                  <button onClick={fetchRagStats} style={{ fontSize: 10, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-sans)', marginTop: 4 }}>
                    ↻ Actualiser les stats
                  </button>
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <p style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '.1em', marginBottom: 12, fontWeight: 500, fontFamily: 'var(--font-sans)' }}>SUGGESTIONS RAPIDES</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {QUICK.map(q => (
                    <button key={q.label} onClick={() => { setMode('chat'); setTab('chat'); sendChat(q.text); }}
                      style={{ background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-medium)', padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'left', fontFamily: 'var(--font-sans)', transition: 'all var(--transition-normal)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-warning-border)'; e.currentTarget.style.color = 'var(--color-warning)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                    >{q.label} →</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}