/**
 * Xamio — WorkshopsPage v2
 * Design: Aligned with MeetingsPage (Linear × Arc)
 * Font: Inter + JetBrains Mono (via app.css)
 */

import React, {
  useState, useMemo, useRef, useEffect, useCallback, memo,
} from 'react';
import { SectionHeader, EmptyState as BaseEmptyState } from '../../../components/ui/index';
import { useNotif } from '../../../context/NotifContext';
import { useAuth }  from '../../../context/AuthContext';
import VisibilitySelector from '../../../components/ui/VisibilitySelector';

/* ════════════════════════════════════════════════════════════════
   DESIGN TOKENS — miroir exact de MeetingsPage
   ════════════════════════════════════════════════════════════════ */
const T = {
  bg0: 'transparent',
  bg1: 'var(--color-background-secondary)',
  bg2: 'var(--color-background-tertiary)',
  bg3: 'var(--color-background-elevated)',
  bd0: 'var(--color-border)',
  bd1: 'var(--color-border-medium)',
  bd2: 'var(--color-border-strong)',
  t1:  'var(--color-text-primary)',
  t2:  'var(--color-text-secondary)',
  t3:  'var(--color-text-muted)',

  acc:  '#E8500A',
  acc2: '#C94108',
  accm: 'rgba(232, 80, 10, 0.08)',
  accb: 'rgba(232, 80, 10, 0.22)',

  dan:  'var(--color-danger)',
  danb: 'var(--color-danger-bg)',
  danr: 'var(--color-danger-border)',

  pur:  'var(--color-purple)',
  purb: 'var(--color-purple-bg)',
  purr: 'var(--color-purple-border)',

  r6:  'var(--radius-medium)',
  r8:  'var(--radius-large)',
  r10: '10px',
  r12: 'var(--radius-xlarge)',
  r14: '14px',
  r16: '16px',
  r20: '20px',
  r24: '24px',
  sdrop: 'var(--shadow-dropdown)',
  smod:  'var(--shadow-modal)',

  status: {
    planned:   { label: 'Planifié',  fg: 'var(--color-accent)',   bg: 'var(--color-accent-bg)',   dot: 'var(--color-accent)',   border: 'var(--color-accent-border)'   },
    ongoing:   { label: 'En cours',  fg: 'var(--color-warning)',  bg: 'var(--color-warning-bg)',  dot: 'var(--color-warning)',  border: 'var(--color-warning-border)'  },
    done:      { label: 'Terminé',   fg: 'var(--color-success)',  bg: 'var(--color-success-bg)',  dot: 'var(--color-success)',  border: 'var(--color-success-border)'  },
    cancelled: { label: 'Annulé',    fg: 'var(--color-danger)',   bg: 'var(--color-danger-bg)',   dot: 'var(--color-danger)',   border: 'var(--color-danger-border)'   },
  },
};

/* ════════════════════════════════════════════════════════════════
   GLOBAL CSS
   ════════════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  .xw-page   { font-family: var(--font-sans); }
  .xw-grid {
    display: grid; gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
  }
  @media (max-width: 700px) {
    .xw-grid          { grid-template-columns: 1fr !important; }
    .xw-filters-row   { flex-direction: column; align-items: stretch !important; }
    .xw-stats-row     { grid-template-columns: repeat(2, 1fr) !important; }
    .xw-header-row    { flex-direction: column; align-items: flex-start !important; }
    .xw-detail-layout { grid-template-columns: 1fr !important; }
    .xw-sidebar       { position: static !important; order: -1; }
  }
  @keyframes xw-fade-up  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
  @keyframes xw-scale-in { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
  @keyframes xw-bar      { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  @keyframes xw-pulse    { 0%,100%{opacity:1} 50%{opacity:.35} }
  @keyframes xw-menu-pop { from{opacity:0;transform:scale(.96) translateY(-4px)} to{opacity:1;transform:none} }
  @keyframes xw-modal-bg { from{opacity:0} to{opacity:1} }
  @keyframes xw-modal-box{ from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:none} }
  .xw-card-enter { animation: xw-fade-up .32s cubic-bezier(.22,1,.36,1) both; }
  .xw-page-enter { animation: xw-fade-up .28s cubic-bezier(.22,1,.36,1); }
  .xw-s1 { animation: xw-fade-up .32s cubic-bezier(.22,1,.36,1) both; animation-delay:0ms; }
  .xw-s2 { animation: xw-fade-up .32s cubic-bezier(.22,1,.36,1) both; animation-delay:60ms; }
  .xw-s3 { animation: xw-fade-up .32s cubic-bezier(.22,1,.36,1) both; animation-delay:120ms; }
  .xw-s4 { animation: xw-fade-up .32s cubic-bezier(.22,1,.36,1) both; animation-delay:180ms; }
  .xw-sb::-webkit-scrollbar          { width: 5px; height: 5px; }
  .xw-sb::-webkit-scrollbar-track    { background: transparent; }
  .xw-sb::-webkit-scrollbar-thumb    { background: var(--color-background-hover); border-radius: 99px; }
  .xw-row-hover:hover { background: var(--color-background-tertiary) !important; }
  .xw-nav-back:hover  { color: var(--color-text-primary) !important; }
  .xw-side-btn:hover        { border-color: var(--color-border-medium) !important; background: var(--color-background-tertiary) !important; color: var(--color-text-primary) !important; }
  .xw-side-btn-danger:hover { background: var(--color-danger-bg) !important; border-color: var(--color-danger-border) !important; color: var(--color-danger) !important; }
`;

function useGlobalStyle() {
  useEffect(() => {
    const id = 'xw-global-style';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = GLOBAL_CSS;
      document.head.appendChild(s);
    }
  }, []);
}

/* ════════════════════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════════════════════ */
const CATEGORIES = ['Interne', 'Onboarding', 'Formation', 'Design Thinking', 'Technique', 'Managérial'];
const DIRECTION_ROLES = ['Directeur', 'Assistant'];

const CAT_COLORS = {
  'Interne':         'var(--color-accent)',
  'Onboarding':      'var(--color-success)',
  'Formation':       'var(--color-warning)',
  'Design Thinking': 'var(--color-purple)',
  'Technique':       T.acc,
  'Managérial':      'var(--color-danger)',
};

const STATUS_FILTERS = [
  { v: 'all',       l: 'Tous les statuts' },
  { v: 'planned',   l: 'Planifiés'        },
  { v: 'ongoing',   l: 'En cours'         },
  { v: 'done',      l: 'Terminés'         },
  { v: 'cancelled', l: 'Annulés'          },
];

const STAT_CONFIG = [
  { key: 'planned',   label: 'Planifiés',  dot: 'var(--color-accent)'  },
  { key: 'ongoing',   label: 'En cours',   dot: 'var(--color-warning)' },
  { key: 'done',      label: 'Terminés',   dot: 'var(--color-success)' },
  { key: 'cancelled', label: 'Annulés',    dot: 'var(--color-danger)'  },
];

const INITIAL_WORKSHOPS = [
  {
    id: 'w1',
    title: 'Formation XAMIO — Équipe pilote Sonatel',
    date: '2026-04-07', time: '09:00', duration: '1 jour',
    location: 'Siège Sonatel, Dakar',
    participants: 15, maxParticipants: 20,
    trainer: 'Support XAMIO',
    status: 'planned', category: 'Onboarding', visibility: 'all',
    description: "Formation complète à la plateforme XAMIO pour les équipes pilotes de Sonatel. Couvre les modules réunions, tâches, documents et IA.",
    programme: [
      { time: '09:00', item: 'Accueil et introduction à XAMIO' },
      { time: '10:00', item: 'Module Réunions & Compte rendu IA' },
      { time: '11:30', item: 'Module Tâches & Documents' },
      { time: '13:00', item: 'Pause déjeuner' },
      { time: '14:00', item: 'Module Agenda & Rendez-vous' },
      { time: '15:30', item: 'Questions / Réponses & Cas pratiques' },
      { time: '17:00', item: 'Clôture & Évaluation' },
    ],
    registrations: ['Fatou Ndiaye', 'Ibrahima Diop', 'Aïssatou Bah', 'Cheikh Sow', 'Mariama Diallo'],
    membres: [
      { nom: 'Fatou Ndiaye',    email: 'fatou.ndiaye@sonatel.sn' },
      { nom: 'Ibrahima Diop',   email: 'ibrahima.diop@sonatel.sn' },
      { nom: 'Aïssatou Bah',   email: 'aissatou.bah@sonatel.sn' },
      { nom: 'Cheikh Sow',     email: 'cheikh.sow@sonatel.sn' },
      { nom: 'Mariama Diallo', email: 'mariama.diallo@sonatel.sn' },
    ],
    documents: ['Guide utilisateur XAMIO v2.pdf', 'Présentation onboarding.pptx'],
  },
  {
    id: 'w2',
    title: 'Atelier Design Thinking — Roadmap v2',
    date: '2026-04-10', time: '14:00', duration: '3h',
    location: 'Bureau XAMIO, Dakar',
    participants: 8, maxParticipants: 12,
    trainer: 'A. Diallo',
    status: 'planned', category: 'Design Thinking', visibility: 'direction',
    description: "Session de design thinking pour définir les priorités de la roadmap produit v2. Méthode double diamant.",
    programme: [
      { time: '14:00', item: 'Warm-up & cadrage' },
      { time: '14:30', item: 'Phase Découverte — pain points' },
      { time: '15:30', item: 'Phase Idéation — brainstorming' },
      { time: '16:30', item: 'Priorisation & synthèse' },
      { time: '17:00', item: 'Clôture' },
    ],
    registrations: ['Mamadou Sow', 'Aïssatou Bah', 'Tech Lead', 'Product Manager'],
    membres: [
      { nom: 'Mamadou Sow',      email: 'mamadou.sow@xamio.io' },
      { nom: 'Aïssatou Bah',    email: 'aissatou.bah@sonatel.sn' },
      { nom: 'Tech Lead',        email: 'techlead@xamio.io' },
      { nom: 'Product Manager',  email: 'pm@xamio.io' },
    ],
    documents: ['Template double diamant.pdf'],
  },
];

/* ════════════════════════════════════════════════════════════════
   HOOKS
   ════════════════════════════════════════════════════════════════ */
function useHover() {
  const [h, set] = useState(false);
  return [h, { onMouseEnter: () => set(true), onMouseLeave: () => set(false) }];
}

function useOutsideClick(ref, cb) {
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [ref, cb]);
}

/* ════════════════════════════════════════════════════════════════
   ICONS — inline SVG, même pattern que MeetingsPage
   ════════════════════════════════════════════════════════════════ */
const Ic = {
  plus:     () => <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  search:   () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  close:    () => <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  filter:   () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M4 8h8M6 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  check:    () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trash:    () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M5 5l.5 8h5L11 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  dots:     () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="1.4" fill="currentColor"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/><circle cx="13" cy="8" r="1.4" fill="currentColor"/></svg>,
  back:     () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevDown: () => <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevRight:() => <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  clock:    () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  loc:      () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a4.5 4.5 0 014.5 4.5c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 018 1.5z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  user:     () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  users:    () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="11.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M13.5 13c0-2-.9-3.76-2.26-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  doc:      () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4 2h6l3 3v9H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 2v3h3M6 8h5M6 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  download: () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  mail:     () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2 5l6 4.5L14 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  lock:     () => <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><rect x="3" y="7.5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 7.5V5a2.5 2.5 0 015 0v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  warn:     () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2L14.5 13H1.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  lightning:() => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M9 1L3 9h5l-1 6 6-8H8l1-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  share:    () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="12" cy="3" r="1.8" stroke="currentColor" strokeWidth="1.3"/><circle cx="12" cy="13" r="1.8" stroke="currentColor" strokeWidth="1.3"/><circle cx="4" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.3"/><path d="M5.8 7l4.4-2.8M5.8 9l4.4 2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  workshop: () => <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6 5V4a2 2 0 012-2h4a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 9v4M8 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
};

/* ════════════════════════════════════════════════════════════════
   ATOMS — même API que MeetingsPage
   ════════════════════════════════════════════════════════════════ */
function IconBtn({ children, onClick, active, danger, title, size = 28 }) {
  const [h, hp] = useHover();
  return (
    <button onClick={onClick} title={title} {...hp} style={{
      width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: active ? T.bg3 : h ? T.bg2 : 'transparent',
      border: `1px solid ${active || h ? T.bd1 : 'transparent'}`,
      borderRadius: T.r6, cursor: 'pointer', flexShrink: 0,
      color: danger && h ? T.dan : active ? T.t1 : h ? T.t2 : T.t3,
      transition: 'all .13s',
    }}>{children}</button>
  );
}

function PrimaryBtn({ children, onClick, disabled, small, danger }) {
  const [h, hp] = useHover();
  const bg = danger ? T.dan : disabled ? T.t3 : h ? T.acc2 : T.acc;
  return (
    <button onClick={onClick} disabled={disabled} {...hp} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: small ? '6px 14px' : '9px 18px',
      borderRadius: T.r8, border: 'none',
      background: bg, color: '#FFF',
      fontSize: small ? 12 : 13, fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      fontFamily: 'var(--font-sans)', transition: 'all .15s',
      boxShadow: !disabled && h ? `0 4px 20px ${T.acc}55` : !disabled ? `0 2px 8px ${T.acc}33` : 'none',
      transform: !disabled && h ? 'translateY(-1px)' : 'none',
      whiteSpace: 'nowrap',
    }}>{children}</button>
  );
}

function GhostBtn({ children, onClick, small }) {
  const [h, hp] = useHover();
  return (
    <button onClick={onClick} {...hp} style={{
      padding: small ? '5px 12px' : '8px 16px',
      borderRadius: T.r8, border: `1px solid ${T.bd1}`,
      background: h ? T.bg2 : 'transparent',
      fontSize: small ? 12 : 13, fontWeight: 450,
      color: h ? T.t1 : T.t2,
      cursor: 'pointer', fontFamily: 'var(--font-sans)',
      transition: 'all .15s', whiteSpace: 'nowrap',
    }}>{children}</button>
  );
}

function StatusPill({ statusKey, compact = false }) {
  const c = T.status[statusKey] || T.status.planned;
  const isLive = statusKey === 'ongoing';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: compact ? '2px 7px' : '3px 10px',
      borderRadius: T.r20,
      background: c.bg, fontSize: compact ? 10 : 11,
      fontWeight: 500, color: c.fg,
      border: `1px solid ${c.border}`, whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: c.dot, flexShrink: 0,
        animation: isLive ? 'xw-pulse 1.8s ease infinite' : 'none',
      }} />
      {c.label}
    </span>
  );
}

function Avatar({ name = '', size = 22 }) {
  const colors = ['#2E70D9', '#E07B2A', '#3D9A6F', '#7B60C8', '#B0443A', '#2A8FA8'];
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  const color = colors[Math.abs(h) % colors.length];
  const initials = name.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '22', border: `1.5px solid ${color}44`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color,
      flexShrink: 0, lineHeight: 1, fontFamily: 'var(--font-sans)',
    }}>{initials}</span>
  );
}

function Field({ as: As = 'input', style, ...props }) {
  const [f, sf] = useState(false);
  return (
    <As {...props} style={{
      width: '100%', background: T.bg3,
      border: `1px solid ${f ? T.bd2 : T.bd0}`,
      borderRadius: T.r8,
      padding: As === 'textarea' ? '9px 13px' : '0 13px',
      height: As === 'textarea' ? undefined : 36,
      color: T.t1, fontSize: 13, lineHeight: 1.6, outline: 'none',
      fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
      transition: 'border-color .15s, box-shadow .15s',
      boxShadow: f ? `0 0 0 3px ${T.accm}` : 'none',
      ...style,
    }} onFocus={() => sf(true)} onBlur={() => sf(false)} />
  );
}

function FormLabel({ children, required, hint }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.t2, marginBottom: 5 }}>
      {children}
      {required && <span style={{ color: T.dan, marginLeft: 3 }}>*</span>}
      {hint && <span style={{ color: T.t3, fontWeight: 400, marginLeft: 6, fontSize: 11 }}>{hint}</span>}
    </label>
  );
}

/* ════════════════════════════════════════════════════════════════
   DROPDOWN
   ════════════════════════════════════════════════════════════════ */
function Dropdown({ label, options, value, onChange, icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, useCallback(() => setOpen(false), []));
  const current = options.find(o => o.v === value);
  const [h, hp] = useHover();
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} {...hp} style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '0 12px', height: 34,
        borderRadius: T.r8, border: `1px solid ${open || h ? T.bd2 : T.bd0}`,
        background: open ? T.bg2 : h ? T.bg2 : T.bg1,
        color: T.t1, fontSize: 12.5, fontWeight: 500,
        cursor: 'pointer', fontFamily: 'var(--font-sans)',
        transition: 'all .13s', whiteSpace: 'nowrap',
      }}>
        {icon && <span style={{ color: T.t3, lineHeight: 0 }}>{icon}</span>}
        {current?.l || label}
        <span style={{ color: T.t3, lineHeight: 0, marginLeft: 2, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
          <Ic.chevDown />
        </span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 40, left: 0, zIndex: 300,
          background: T.bg2, border: `1px solid ${T.bd1}`,
          borderRadius: T.r10, padding: 5, minWidth: 200,
          boxShadow: T.sdrop, animation: 'xw-menu-pop .14s cubic-bezier(.22,1,.36,1)',
        }}>
          {options.map(o => {
            const sel = o.v === value;
            const [dh, dhp] = [false, {}]; // simpler without state per item
            return (
              <button key={o.v} onClick={() => { onChange(o.v); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px', borderRadius: T.r6, border: 'none',
                  background: sel ? T.bg3 : 'transparent',
                  color: sel ? T.t1 : T.t2,
                  fontSize: 12.5, fontWeight: sel ? 500 : 400,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)', textAlign: 'left',
                  transition: 'all .1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg3}
                onMouseLeave={e => e.currentTarget.style.background = sel ? T.bg3 : 'transparent'}
              >
                {o.l}
                {sel && <span style={{ color: T.acc, lineHeight: 0 }}><Ic.check /></span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ACTION MENU (3 points)
   ════════════════════════════════════════════════════════════════ */
function ActionMenu({ workshop, onStart, onFinish, onCancel, onDelete, isDirection }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, useCallback(() => setOpen(false), []));

  const { status } = workshop;
  if (status === 'cancelled') return null;

  const items = [];
  if (status === 'planned')  items.push({ icon: <Ic.lightning />, label: 'Démarrer', fn: onStart });
  if (status === 'ongoing')  items.push({ icon: <Ic.check />, label: 'Terminer', fn: onFinish });
  if (status !== 'done' && status !== 'cancelled')
    items.push({ icon: <Ic.warn />, label: 'Annuler', fn: onCancel });
  if (isDirection) {
    items.push({ sep: true });
    items.push({ icon: <Ic.trash />, label: 'Supprimer', fn: onDelete, danger: true });
  }

  if (!items.length) return null;
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
      <IconBtn onClick={() => setOpen(o => !o)} active={open}><Ic.dots /></IconBtn>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 34, zIndex: 200,
          background: T.bg2, border: `1px solid ${T.bd1}`,
          borderRadius: T.r10, padding: 5, minWidth: 200,
          boxShadow: T.sdrop, animation: 'xw-menu-pop .14s cubic-bezier(.22,1,.36,1)',
        }}>
          {items.map((it, i) =>
            it.sep
              ? <div key={i} style={{ height: 1, background: T.bd0, margin: '4px 0' }} />
              : (
                <button key={i} onClick={() => { setOpen(false); it.fn(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '7px 10px', borderRadius: T.r6, border: 'none',
                    background: 'transparent',
                    color: it.danger ? T.dan : T.t2,
                    fontSize: 12.5, fontWeight: 450,
                    cursor: 'pointer', fontFamily: 'var(--font-sans)', textAlign: 'left',
                    transition: 'all .1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = it.danger ? 'rgba(240,112,112,.07)' : T.bg3}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ lineHeight: 0, opacity: .85, flexShrink: 0 }}>{it.icon}</span>
                  {it.label}
                </button>
              )
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MODAL
   ════════════════════════════════════════════════════════════════ */
function Modal({ open, onClose, title, width = 520, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, backdropFilter: 'blur(6px)',
      animation: 'xw-modal-bg .16s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.bg1, border: `1px solid ${T.bd1}`,
        borderRadius: T.r16, width: '100%', maxWidth: width,
        maxHeight: 'calc(100dvh - 32px)',
        display: 'flex', flexDirection: 'column',
        boxShadow: T.smod, animation: 'xw-modal-box .2s cubic-bezier(.22,1,.36,1)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: `1px solid ${T.bd0}`, flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: T.t1, margin: 0, fontFamily: 'var(--font-sans)' }}>{title}</h2>
          <IconBtn onClick={onClose}><Ic.close /></IconBtn>
        </div>
        <div className="xw-sb" style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalFooter({ onCancel, onConfirm, cancelLabel = 'Annuler', confirmLabel = 'Confirmer', danger = false, disabled = false }) {
  return (
    <div style={{
      display: 'flex', gap: 8, justifyContent: 'flex-end',
      paddingTop: 20, borderTop: `1px solid ${T.bd0}`, marginTop: 4,
    }}>
      <GhostBtn onClick={onCancel}>{cancelLabel}</GhostBtn>
      <PrimaryBtn onClick={onConfirm} danger={danger} disabled={disabled}>{confirmLabel}</PrimaryBtn>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CARD — même pattern que MeetingDetail
   ════════════════════════════════════════════════════════════════ */
function Card({ title, icon, children, className = '', noPad = false }) {
  return (
    <div className={className} style={{
      background: T.bg1, border: `1px solid ${T.bd0}`,
      borderRadius: T.r14, overflow: 'hidden',
    }}>
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '13px 16px', borderBottom: `1px solid ${T.bd0}`,
        }}>
          {icon && <span style={{ color: T.t3, lineHeight: 0 }}>{icon}</span>}
          <span style={{ fontSize: 12, fontWeight: 600, color: T.t2, letterSpacing: '.03em' }}>{title}</span>
        </div>
      )}
      <div style={noPad ? {} : { padding: '14px 16px' }}>{children}</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STATS HEADER
   ════════════════════════════════════════════════════════════════ */
function StatsHeader({ workshops }) {
  const total = workshops.length;
  const byStatus = STAT_CONFIG.reduce((acc, { key }) => {
    acc[key] = workshops.filter(w => w.status === key).length;
    return acc;
  }, {});

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 10, marginBottom: 24,
    }} className="xw-stats-row">
      <StatCard value={total} label="Total ateliers" accent={T.acc} />
      {STAT_CONFIG.map(({ key, label, dot }) => {
        const n = byStatus[key] || 0;
        const pct = total > 0 ? Math.round(n / total * 100) : 0;
        return <StatCard key={key} value={n} label={label} accent={dot} pct={pct} />;
      })}
    </div>
  );
}

function StatCard({ value, label, accent, pct }) {
  const [h, hp] = useHover();
  return (
    <div {...hp} style={{
      background: T.bg1, border: `1px solid ${h ? T.bd1 : T.bd0}`,
      borderRadius: T.r12, padding: '14px 16px',
      transition: 'border-color .15s, box-shadow .15s',
      boxShadow: h ? T.sdrop : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: T.t1, letterSpacing: '-1px', fontFamily: 'var(--font-sans)', lineHeight: 1 }}>{value}</span>
        {pct !== undefined && <span style={{ fontSize: 11, color: T.t3, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{pct}%</span>}
      </div>
      {pct !== undefined && (
        <div style={{ height: 2, background: T.bg3, borderRadius: 99, marginBottom: 8, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: accent, borderRadius: 99, width: `${pct}%`,
            transformOrigin: 'left', animation: 'xw-bar .7s cubic-bezier(.22,1,.36,1)',
          }} />
        </div>
      )}
      <div style={{ fontSize: 11.5, color: T.t3, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
        {pct !== undefined && <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, flexShrink: 0 }} />}
        {label}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   FILTERS BAR
   ════════════════════════════════════════════════════════════════ */
function FiltersBar({ query, setQuery, statusFilter, setStatusFilter, catFilter, setCatFilter, activeCount }) {
  const hasActive = statusFilter !== 'all' || catFilter !== 'all' || query !== '';
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="xw-filters-row" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.t3, pointerEvents: 'none', lineHeight: 0 }}>
            <Ic.search />
          </span>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un atelier, formateur…"
            style={{
              width: '100%', background: T.bg1, border: `1px solid ${T.bd0}`,
              borderRadius: T.r8, padding: '0 13px 0 35px', height: 34,
              color: T.t1, fontSize: 12.5, outline: 'none',
              fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
              transition: 'border-color .13s, box-shadow .13s',
            }}
            onFocus={e => { e.target.style.borderColor = T.bd2; e.target.style.boxShadow = `0 0 0 3px ${T.accm}`; }}
            onBlur={e => { e.target.style.borderColor = T.bd0; e.target.style.boxShadow = 'none'; }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: T.t3, lineHeight: 0, padding: 2,
            }}><Ic.close /></button>
          )}
        </div>

        <Dropdown label="Statut" icon={<Ic.filter />} options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />

        <Dropdown
          label="Catégorie"
          options={[{ v: 'all', l: 'Toutes catégories' }, ...CATEGORIES.map(c => ({ v: c, l: c }))]}
          value={catFilter}
          onChange={setCatFilter}
        />

        {hasActive && (
          <button
            type="button"
            onClick={() => { setQuery(''); setStatusFilter('all'); setCatFilter('all'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '0 10px', height: 34, borderRadius: T.r8,
              border: `1px solid ${T.bd0}`, background: 'transparent',
              color: T.t3, fontSize: 12, cursor: 'pointer',
              fontFamily: 'var(--font-sans)', transition: 'all .13s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = T.t1; e.currentTarget.style.borderColor = T.bd1; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.t3; e.currentTarget.style.borderColor = T.bd0; }}
          >
            <Ic.close /> Réinitialiser
          </button>
        )}
      </div>

      {(statusFilter !== 'all' || catFilter !== 'all') && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {statusFilter !== 'all' && (
            <ActiveChip label={STATUS_FILTERS.find(f => f.v === statusFilter)?.l} onRemove={() => setStatusFilter('all')} />
          )}
          {catFilter !== 'all' && (
            <ActiveChip label={catFilter} onRemove={() => setCatFilter('all')} />
          )}
          <span style={{ fontSize: 11, color: T.t3, display: 'flex', alignItems: 'center', marginLeft: 2 }}>
            {activeCount} résultat{activeCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

function ActiveChip({ label, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '2px 8px 2px 10px', borderRadius: T.r20,
      background: T.accm, border: `1px solid ${T.accb}`,
      fontSize: 11, fontWeight: 500, color: T.acc,
    }}>
      {label}
      <button onClick={onRemove} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: T.acc, lineHeight: 0, padding: 1, opacity: .7, transition: 'opacity .1s',
      }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '.7'}
      ><Ic.close /></button>
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════
   WORKSHOP CARD (liste)
   ════════════════════════════════════════════════════════════════ */
const WorkshopCard = memo(function WorkshopCard({ w, index, isDirection, onStart, onFinish, onCancel, onDelete, onClick }) {
  const [h, hp] = useHover();
  const isCancelled = w.status === 'cancelled';
  const isLive = w.status === 'ongoing';
  const catColor = CAT_COLORS[w.category] || T.acc;
  const fillPct = Math.round((w.registrations.length / (w.maxParticipants || 1)) * 100);

  return (
    <article
      className="xw-card-enter"
      {...(isCancelled ? {} : hp)}
      onClick={isCancelled ? undefined : onClick}
      style={{
        background: h && !isCancelled ? T.bg2 : T.bg1,
        border: `1px solid ${isLive && h ? T.acc : h && !isCancelled ? T.bd2 : isCancelled ? 'rgba(240,112,112,.15)' : T.bd0}`,
        borderRadius: T.r12, padding: '15px 16px',
        cursor: isCancelled ? 'default' : 'pointer',
        opacity: isCancelled ? 0.55 : 1,
        position: 'relative', overflow: 'hidden',
        transition: 'border-color .18s, box-shadow .18s, background .18s',
        boxShadow: isLive && h ? `0 0 0 1px ${T.acc}33, 0 4px 20px rgba(232,80,10,.12)` : h && !isCancelled ? T.sdrop : 'none',
        animationDelay: `${index * 35}ms`, minWidth: 0,
      }}
    >
      {isLive && (
        <div style={{
          position: 'absolute', left: 0, top: 0, width: 2, height: '100%',
          background: T.acc, borderRadius: '0 1px 1px 0',
          animation: 'xw-pulse 2s ease infinite',
        }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: 13.5, fontWeight: 600, lineHeight: 1.4, marginBottom: 8,
            color: isCancelled ? T.t3 : T.t1,
            textDecoration: isCancelled ? 'line-through' : 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-sans)',
          }}>{w.title}</h3>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusPill statusKey={w.status} compact />
            <span style={{
              padding: '2px 8px', borderRadius: T.r20,
              background: `${catColor}16`, border: `1px solid ${catColor}30`,
              fontSize: 10, fontWeight: 600, color: catColor,
            }}>{w.category}</span>
            {w.visibility === 'direction' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 7px', borderRadius: T.r20,
                background: T.purb, border: `1px solid ${T.purr}`,
                fontSize: 10, fontWeight: 600, color: T.pur,
              }}>
                <Ic.lock /> Privé
              </span>
            )}
          </div>
        </div>
        <ActionMenu
          workshop={w}
          onStart={onStart}
          onFinish={onFinish}
          onCancel={onCancel}
          onDelete={onDelete}
          isDirection={isDirection}
        />
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', gap: 10, fontSize: 11, color: T.t3, flexWrap: 'wrap', alignItems: 'center', fontFamily: 'var(--font-mono)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Ic.clock /> {w.date.split('-').reverse().join('/')} · {w.time} · {w.duration}
        </span>
        {w.location && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Ic.loc /> {w.location}
          </span>
        )}
      </div>

      {/* Trainer + participants */}
      {(w.trainer || w.registrations.length > 0) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.bd0}`,
        }}>
          {w.trainer && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar name={w.trainer} size={18} />
              <span style={{ fontSize: 11, color: T.t3 }}>{w.trainer}</span>
            </div>
          )}
          {w.registrations.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.t3, fontSize: 11 }}>
              <Ic.users />
              <span style={{ fontFamily: 'var(--font-mono)' }}>{w.registrations.length}/{w.maxParticipants}</span>
            </div>
          )}
        </div>
      )}

      {/* Capacity bar */}
      <div style={{ marginTop: 10 }}>
        <div style={{ height: 3, background: T.bd0, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(fillPct, 100)}%`,
            background: fillPct >= 100 ? T.dan : fillPct > 75 ? 'var(--color-warning)' : 'var(--color-success)',
            borderRadius: 99,
          }} />
        </div>
      </div>

      {isLive && (
        <div style={{
          marginTop: 10, padding: '7px 10px', borderRadius: T.r8,
          background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)',
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <span style={{ animation: 'xw-pulse 1.6s ease infinite', lineHeight: 0, color: T.acc }}><Ic.lightning /></span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: T.acc }}>Atelier en cours</span>
        </div>
      )}
    </article>
  );
});

/* ════════════════════════════════════════════════════════════════
   EMPTY STATE
   ════════════════════════════════════════════════════════════════ */
function EmptyState({ hasQuery, onAction }) {
  return (
    <div style={{
      textAlign: 'center', padding: '72px 24px',
      background: T.bg1, borderRadius: T.r16, border: `1px solid ${T.bd0}`,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: T.accm,
        border: `1px solid ${T.accb}`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 18px', color: T.acc,
      }}>
        <Ic.workshop />
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 6, fontFamily: 'var(--font-sans)' }}>
        {hasQuery ? 'Aucun résultat' : 'Aucun atelier'}
      </p>
      <p style={{ fontSize: 13, color: T.t3, maxWidth: 300, margin: '0 auto 20px', lineHeight: 1.7 }}>
        {hasQuery ? 'Modifiez vos filtres ou votre recherche.' : 'Organisez votre premier atelier.'}
      </p>
      {!hasQuery && (
        <PrimaryBtn onClick={onAction}><Ic.plus /> Organiser un atelier</PrimaryBtn>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   DOCUMENT UPLOADER
   ════════════════════════════════════════════════════════════════ */
function DocumentUploader({ documents, onChange }) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const getIcon = name => {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf')  return { icon: 'PDF', color: '#E24B4A', bg: '#FCEBEB' };
    if (['doc', 'docx'].includes(ext)) return { icon: 'DOC', color: '#185FA5', bg: '#E6F1FB' };
    if (['xls', 'xlsx'].includes(ext)) return { icon: 'XLS', color: '#1D9E75', bg: '#E1F5EE' };
    if (['ppt', 'pptx'].includes(ext)) return { icon: 'PPT', color: '#BA7517', bg: '#FAEEDA' };
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return { icon: 'IMG', color: '#533AB7', bg: '#EEEDFE' };
    return { icon: 'FILE', color: '#5F5E5A', bg: '#F1EFE8' };
  };

  const formatSize = bytes => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  };

  const handleFiles = files => {
    const newDocs = Array.from(files).map(f => ({
      name: f.name, size: f.size, type: f.type,
      url: URL.createObjectURL(f), addedAt: new Date().toISOString(),
    }));
    onChange([...documents, ...newDocs]);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <FormLabel hint={`(${documents.length} fichier${documents.length !== 1 ? 's' : ''})`}>Documents</FormLabel>
        <button type="button" onClick={() => fileInputRef.current?.click()}
          style={{ fontSize: 11, color: T.acc, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
          + Ajouter
        </button>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragging ? T.acc : T.bd1}`,
          borderRadius: T.r10, padding: '12px 14px', cursor: 'pointer',
          background: dragging ? T.accm : T.bg2,
          transition: 'all 150ms', marginBottom: documents.length ? 10 : 0,
          display: 'flex', alignItems: 'center', gap: 10,
        }}
        onMouseEnter={e => { if (!dragging) e.currentTarget.style.borderColor = T.accb; }}
        onMouseLeave={e => { if (!dragging) e.currentTarget.style.borderColor = T.bd1; }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: T.r8,
          background: T.accm, border: `1px solid ${T.accb}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, flexShrink: 0,
        }}>📎</div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 500, color: T.t2, margin: 0 }}>Glissez vos fichiers ici ou cliquez</p>
          <p style={{ fontSize: 10, color: T.t3, margin: '2px 0 0' }}>PDF, Word, Excel, PPT — max 20 Mo</p>
        </div>
      </div>

      {documents.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {documents.map((doc, i) => {
            const name = doc.name || doc;
            const { icon, color, bg } = getIcon(name);
            const size = doc.size ? formatSize(doc.size) : '';
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', background: T.bg1,
                border: `1px solid ${T.bd0}`, borderRadius: T.r8,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: T.r6, background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color, fontFamily: 'var(--font-mono)', letterSpacing: '.02em' }}>{icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: T.t1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                  {size && <p style={{ fontSize: 10, color: T.t3, margin: '1px 0 0', fontFamily: 'var(--font-mono)' }}>{size}</p>}
                </div>
                <button type="button"
                  onClick={e => { e.stopPropagation(); onChange(documents.filter((_, idx) => idx !== i)); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.t3, fontSize: 16, lineHeight: 1, padding: '2px 4px', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = T.dan}
                  onMouseLeave={e => e.currentTarget.style.color = T.t3}
                >×</button>
              </div>
            );
          })}
        </div>
      )}

      <input ref={fileInputRef} type="file" multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.txt"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files.length) handleFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   DETAIL VIEW — sidebar + main layout
   ════════════════════════════════════════════════════════════════ */
function SideMeta({ icon, label, value, mono }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: `1px solid ${T.bd0}` }}>
      <span style={{ color: T.t3, lineHeight: 0, flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, color: T.t3, fontWeight: 600, letterSpacing: '.07em', margin: '0 0 3px', textTransform: 'uppercase' }}>{label}</p>
        <p style={{ fontSize: 12.5, lineHeight: 1.45, margin: 0, wordBreak: 'break-word', color: T.t1, fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)' }}>
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

function SideBtn({ icon, label, onClick, danger }) {
  return (
    <button type="button" onClick={onClick}
      className={danger ? 'xw-side-btn xw-side-btn-danger' : 'xw-side-btn'}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px 11px', borderRadius: T.r8,
        border: `1px solid ${danger ? T.danr : T.bd0}`,
        background: danger ? T.danb : 'transparent',
        color: danger ? T.dan : T.t2,
        fontSize: 12.5, fontWeight: 450, cursor: 'pointer',
        fontFamily: 'var(--font-sans)', textAlign: 'left', transition: 'all .13s',
      }}>
      <span style={{ lineHeight: 0, flexShrink: 0, opacity: .85 }}>{icon}</span>
      {label}
    </button>
  );
}

function ParticipantRow({ p, index }) {
  const membre = typeof p === 'object' ? p : { nom: p };
  const name = membre.nom || membre.email || '';
  const email = membre.email || '';
  return (
    <div className="xw-row-hover" style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 6px', borderBottom: `1px solid ${T.bd0}`,
      borderRadius: T.r6, transition: 'background .12s',
    }}>
      <Avatar name={name} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12.5, fontWeight: 500, color: T.t1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
        {email && (
          <a href={`mailto:${email}`}
            style={{ fontSize: 10, color: T.acc, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)' }}
            onClick={e => e.stopPropagation()}>
            <Ic.mail /> {email}
          </a>
        )}
      </div>
      <span style={{
        fontSize: 10, fontFamily: 'var(--font-mono)', color: T.t3,
        background: T.bg2, padding: '2px 6px', borderRadius: T.r6,
      }}>#{index + 1}</span>
    </div>
  );
}

function WorkshopDetailView({ w, onBack, onStatusChange, onDelete, onRegister, isDirection, addToast }) {
  const st = T.status[w.status] || T.status.planned;
  const catColor = CAT_COLORS[w.category] || T.acc;
  const fillPct = Math.round((w.registrations.length / (w.maxParticipants || 1)) * 100);
  const isLive = w.status === 'ongoing';
  const isCancelled = w.status === 'cancelled';
  const isDone = w.status === 'done';
  const [regModal, setRegModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');

  const handleRegister = useCallback(() => {
    if (!regName.trim()) { addToast('Nom requis.', 'error'); return; }
    onRegister(w.id, regName.trim(), regEmail.trim(), (msg) => {
      if (msg === 'already') { addToast('Déjà inscrit.', 'warning'); return; }
      if (msg === 'full') { addToast('Capacité maximale atteinte.', 'error'); return; }
      addToast(`${regName} inscrit(e) !`, 'success');
      setRegModal(false); setRegName(''); setRegEmail('');
    });
  }, [regName, regEmail, w.id, onRegister, addToast]);

  const handleExportCSV = useCallback(() => {
    const lines = ['Nom,Email', ...w.registrations.map(name => {
      const m = (w.membres || []).find(mb => mb.nom === name);
      return `${name},${m?.email || ''}`;
    })].join('\n');
    const blob = new Blob([lines], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participants-${w.title.replace(/\s+/g, '-')}.csv`;
    a.click();
    addToast('Liste exportée en CSV.', 'success');
  }, [w, addToast]);

  return (
    <div className="xw-page-enter">
      {/* Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 20 }}>
        <button type="button" className="xw-nav-back" onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.t3, fontSize: 12.5, padding: 0,
          fontFamily: 'var(--font-sans)', transition: 'color .13s',
        }}>
          <Ic.back /> Ateliers
        </button>
        <span style={{ color: T.bd1 }}>/</span>
        <span style={{ fontSize: 12.5, color: T.t3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
          {w.title}
        </span>
      </nav>

      {/* Header carte */}
      <div className="xw-s1" style={{
        marginBottom: 16, padding: '20px 24px',
        background: T.bg1, border: `1px solid ${T.bd0}`,
        borderRadius: T.r16, position: 'relative', overflow: 'hidden',
      }}>
        {isLive && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', background: T.acc, animation: 'xw-pulse 2s ease infinite' }} />
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 11, flexWrap: 'wrap' }}>
              <StatusPill statusKey={w.status} />
              <span style={{
                padding: '3px 10px', borderRadius: T.r20,
                background: `${catColor}16`, border: `1px solid ${catColor}30`,
                fontSize: 11, fontWeight: 600, color: catColor,
              }}>{w.category}</span>
              {w.visibility === 'direction' && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: T.r20,
                  background: T.purb, border: `1px solid ${T.purr}`,
                  fontSize: 11, fontWeight: 600, color: T.pur,
                }}>
                  <Ic.lock /> Privé
                </span>
              )}
            </div>
            <h1 style={{
              fontSize: 22, fontWeight: 700, letterSpacing: '-.5px',
              lineHeight: 1.25, margin: '0 0 12px',
              color: isCancelled ? T.t3 : T.t1,
              textDecoration: isCancelled ? 'line-through' : 'none',
              opacity: isCancelled ? .5 : 1, fontFamily: 'var(--font-sans)',
            }}>{w.title}</h1>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: T.t3, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)' }}>
                <Ic.clock /> {w.date.split('-').reverse().join('/')} · {w.time} · {w.duration}
              </span>
              {w.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Ic.loc /> {w.location}
                </span>
              )}
              {w.trainer && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Avatar name={w.trainer} size={16} /> {w.trainer}
                </span>
              )}
            </div>
          </div>
          {/* Actions header */}
          {!isCancelled && (
            <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexShrink: 0 }}>
              {w.status === 'planned' && <PrimaryBtn small onClick={() => onStatusChange(w.id, 'ongoing')}><Ic.lightning /> Démarrer</PrimaryBtn>}
              {w.status === 'ongoing' && <PrimaryBtn small onClick={() => onStatusChange(w.id, 'done')}><Ic.check /> Terminer</PrimaryBtn>}
              {!isDone && <GhostBtn small onClick={() => onStatusChange(w.id, 'cancelled')}>Annuler</GhostBtn>}
            </div>
          )}
        </div>
      </div>

      {/* Banner si en cours */}
      {isLive && (
        <div style={{
          padding: '12px 16px', borderRadius: T.r12, marginBottom: 14,
          background: T.accm, border: `1px solid ${T.accb}`,
          display: 'flex', gap: 11, alignItems: 'center',
        }}>
          <span style={{ color: T.acc, lineHeight: 0 }}><Ic.lightning /></span>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.acc }}>Atelier en cours</span>
        </div>
      )}

      {/* 2 colonnes */}
      <div className="xw-detail-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 288px', gap: 16, alignItems: 'start' }}>

        {/* Colonne principale */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>

          {w.description && (
            <Card title="Description" icon={<Ic.doc />} className="xw-s2">
              <p style={{ fontSize: 13, color: T.t2, lineHeight: 1.7, margin: 0 }}>{w.description}</p>
            </Card>
          )}

          {/* Programme */}
          <Card title="Programme" icon={<Ic.clock />} className="xw-s2">
            {w.programme.length === 0
              ? <p style={{ fontSize: 13, color: T.t3, fontStyle: 'italic', margin: 0 }}>Aucun programme défini.</p>
              : w.programme.map((p, i) => (
                <div key={i} className="xw-row-hover" style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  padding: '10px 8px', borderBottom: `1px solid ${T.bd0}`,
                  borderRadius: T.r6, transition: 'background .12s',
                  position: 'relative',
                }}>
                  {i < w.programme.length - 1 && (
                    <div style={{ position: 'absolute', left: 52, top: 28, bottom: -10, width: 1, background: T.bd0 }} />
                  )}
                  <span style={{ minWidth: 46, fontSize: 11, fontFamily: 'var(--font-mono)', color: T.acc, fontWeight: 600, paddingTop: 2 }}>{p.time}</span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.acc, flexShrink: 0, marginTop: 5, zIndex: 1 }} />
                  <p style={{ fontSize: 13, color: T.t2, flex: 1, lineHeight: 1.5, margin: 0 }}>{p.item}</p>
                </div>
              ))
            }
          </Card>

          {/* Documents */}
          <Card title={`Documents (${w.documents.length})`} icon={<Ic.doc />} className="xw-s3">
            {w.documents.length === 0
              ? <p style={{ fontSize: 13, color: T.t3, fontStyle: 'italic', margin: 0 }}>Aucun document joint.</p>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {w.documents.map((doc, i) => (
                    <div key={i}
                      onClick={() => addToast(`Ouverture de "${doc}"…`, 'info')}
                      className="xw-doc-dl"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', background: T.bg2,
                        border: `1px solid ${T.bd0}`, borderRadius: T.r8,
                        cursor: 'pointer', transition: 'all .13s',
                      }}>
                      <span style={{ lineHeight: 0, color: T.pur }}><Ic.doc /></span>
                      <span style={{ fontSize: 12, color: T.t2, flex: 1 }}>{doc}</span>
                      <span style={{ lineHeight: 0, color: T.t3 }}><Ic.download /></span>
                    </div>
                  ))}
                </div>
              )
            }
          </Card>
        </div>

        {/* Sidebar */}
        <div className="xw-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'sticky', top: 20 }}>

          {/* Infos */}
          <Card title="Informations" icon={<Ic.clock />} className="xw-s1">
            <SideMeta icon={<Ic.clock />}   label="Date & heure" value={`${w.date.split('-').reverse().join('/')} · ${w.time}`} mono />
            <SideMeta icon={<Ic.clock />}   label="Durée"        value={w.duration} />
            <SideMeta icon={<Ic.loc />}     label="Lieu"         value={w.location} />
            <SideMeta icon={<Ic.user />}    label="Formateur"    value={w.trainer} />
            <SideMeta icon={<Ic.lock />}    label="Visibilité"   value={w.visibility === 'direction' ? 'Direction uniquement' : 'Tous les membres'} />
          </Card>

          {/* Membres */}
          <Card title={`Membres (${w.registrations.length}/${w.maxParticipants})`} icon={<Ic.users />} className="xw-s2" noPad>
            {/* Barre de capacité */}
            <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${T.bd0}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: T.t1 }}>
                  {w.registrations.length} inscrit{w.registrations.length !== 1 ? 's' : ''} sur {w.maxParticipants}
                </span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: fillPct >= 100 ? T.dan : T.t3 }}>
                  {fillPct}%
                </span>
              </div>
              <div style={{ height: 4, background: T.bg3, borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(fillPct, 100)}%`,
                  background: fillPct >= 100 ? T.dan : fillPct > 75 ? 'var(--color-warning)' : 'var(--color-success)',
                  borderRadius: 99, transition: 'width .3s',
                }} />
              </div>
            </div>

            <div style={{ padding: '8px 10px 10px' }}>
              {w.registrations.length === 0
                ? <p style={{ fontSize: 12, color: T.t3, fontStyle: 'italic', padding: '6px 0', textAlign: 'center' }}>Aucun participant.</p>
                : w.registrations.map((name, i) => {
                  const m = (w.membres || []).find(mb => mb.nom === name);
                  return <ParticipantRow key={i} p={m || { nom: name }} index={i} />;
                })
              }
            </div>
          </Card>

          {/* Actions rapides */}
          {!isCancelled && (
            <Card title="Actions rapides" icon={<Ic.lightning />} className="xw-s3">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {!isDone && (
                  <SideBtn icon={<Ic.users />} label="Inscrire un participant" onClick={() => setRegModal(true)} />
                )}
                {w.registrations.length > 0 && (
                  <>
                    <SideBtn icon={<Ic.mail />} label="Envoyer les rappels" onClick={() => {
                      const nb = (w.membres || []).filter(m => m.email).length;
                      addToast(nb > 0 ? `📧 Rappels envoyés à ${nb} membre(s).` : 'Aucun email renseigné.', nb > 0 ? 'success' : 'warning');
                    }} />
                    <SideBtn icon={<Ic.download />} label="Exporter en CSV" onClick={handleExportCSV} />
                  </>
                )}
                {isDirection && (
                  <>
                    <div style={{ height: 1, background: T.bd0, margin: '2px 0' }} />
                    <SideBtn icon={<Ic.trash />} label="Supprimer l'atelier" onClick={() => { onDelete(w.id); onBack(); }} danger />
                  </>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal inscription */}
      <Modal open={regModal} onClose={() => { setRegModal(false); setRegName(''); setRegEmail(''); }} title="Inscrire un participant" width={440}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <FormLabel required>Nom complet</FormLabel>
            <Field value={regName} onChange={e => setRegName(e.target.value)} placeholder="Ex : Fatou Ndiaye" />
          </div>
          <div>
            <FormLabel hint="🔔 pour les rappels">Email</FormLabel>
            <Field type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="email@exemple.com" />
          </div>
          <ModalFooter onCancel={() => { setRegModal(false); setRegName(''); setRegEmail(''); }} onConfirm={handleRegister} confirmLabel="Inscrire" />
        </div>
      </Modal>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CREATE MODAL
   ════════════════════════════════════════════════════════════════ */
const FORM_RESET = {
  title: '', date: '', time: '09:00', nbJours: '1', location: '',
  maxParticipants: '', trainer: '', category: 'Interne', description: '',
  visibility: 'all',
  membres: [{ nom: '', email: '' }],
  programme: [{ time: '', item: '' }],
  documents: [],
};

function CreateWorkshopModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(FORM_RESET);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useNotif();

  const handleSubmit = useCallback(() => {
    if (submitting) return;
    if (!form.title || !form.date) { addToast('Titre et date requis.', 'error'); return; }
    setSubmitting(true);
    try {
      onCreate(form);
      setForm(FORM_RESET);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }, [form, submitting, onCreate, onClose, addToast]);

  const set = useCallback((key, val) => setForm(f => ({ ...f, [key]: val })), []);

  return (
    <Modal open={open} onClose={onClose} title="Organiser un atelier" width={580}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div>
          <FormLabel required>Titre</FormLabel>
          <Field value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex : Formation XAMIO équipe pilote" />
        </div>
        <div>
          <FormLabel>Description</FormLabel>
          <Field as="textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Objectifs et contenu…" rows={3} style={{ resize: 'vertical' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div><FormLabel required>Date</FormLabel><Field type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div><FormLabel>Heure</FormLabel><Field type="time" value={form.time} onChange={e => set('time', e.target.value)} /></div>
          <div><FormLabel>Nb de jours</FormLabel><Field type="number" min="1" value={form.nbJours} onChange={e => set('nbJours', e.target.value)} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><FormLabel>Lieu</FormLabel><Field value={form.location} onChange={e => set('location', e.target.value)} placeholder="Salle, visio…" /></div>
          <div><FormLabel>Formateur</FormLabel><Field value={form.trainer} onChange={e => set('trainer', e.target.value)} placeholder="Nom" /></div>
        </div>

        {/* Membres */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <FormLabel hint="email requis pour les rappels">Membres</FormLabel>
            <button type="button" onClick={() => set('membres', [...form.membres, { nom: '', email: '' }])}
              style={{ fontSize: 11, color: T.acc, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
              + Ajouter
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.membres.map((m, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'flex-end' }}>
                <div>
                  {i === 0 && <FormLabel>Nom</FormLabel>}
                  <Field value={m.nom} onChange={e => set('membres', form.membres.map((mb, idx) => idx === i ? { ...mb, nom: e.target.value } : mb))} placeholder="Nom complet" />
                </div>
                <div>
                  {i === 0 && <FormLabel hint="🔔 rappels">Email</FormLabel>}
                  <Field type="email" value={m.email} onChange={e => set('membres', form.membres.map((mb, idx) => idx === i ? { ...mb, email: e.target.value } : mb))} placeholder="email@exemple.com" />
                </div>
                {form.membres.length > 1
                  ? <button type="button" onClick={() => set('membres', form.membres.filter((_, idx) => idx !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dan, fontSize: 16, paddingBottom: 4, lineHeight: 1 }}>×</button>
                  : <div />
                }
              </div>
            ))}
          </div>
        </div>

        {/* Programme */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <FormLabel hint="heure + intitulé">Programme</FormLabel>
            <button type="button" onClick={() => set('programme', [...form.programme, { time: '', item: '' }])}
              style={{ fontSize: 11, color: T.acc, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
              + Ajouter
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.programme.map((p, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 8, alignItems: 'center' }}>
                <input type="time" value={p.time}
                  onChange={e => set('programme', form.programme.map((pt, idx) => idx === i ? { ...pt, time: e.target.value } : pt))}
                  style={{ background: T.bg3, border: `1px solid ${T.bd0}`, borderRadius: T.r8, padding: '8px 10px', color: T.t1, fontSize: 12, outline: 'none', fontFamily: 'var(--font-mono)', width: '100%' }}
                />
                <input type="text" value={p.item}
                  onChange={e => set('programme', form.programme.map((pt, idx) => idx === i ? { ...pt, item: e.target.value } : pt))}
                  placeholder={`Point ${i + 1}`}
                  style={{ background: T.bg3, border: `1px solid ${T.bd0}`, borderRadius: T.r8, padding: '8px 12px', color: T.t1, fontSize: 12, outline: 'none', fontFamily: 'var(--font-sans)', width: '100%' }}
                  onFocus={e => e.target.style.borderColor = T.accb}
                  onBlur={e => e.target.style.borderColor = T.bd0}
                />
                {form.programme.length > 1
                  ? <button type="button" onClick={() => set('programme', form.programme.filter((_, idx) => idx !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dan, fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
                  : <div />
                }
              </div>
            ))}
          </div>
        </div>

        <DocumentUploader documents={form.documents} onChange={docs => set('documents', docs)} />

        {/* Catégorie */}
        <div>
          <FormLabel>Catégorie</FormLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => {
              const active = form.category === cat;
              const c = CAT_COLORS[cat] || T.acc;
              return (
                <button key={cat} type="button" onClick={() => set('category', cat)} style={{
                  padding: '5px 12px', borderRadius: T.r20,
                  border: `1px solid ${active ? c : T.bd0}`,
                  fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  background: active ? `${c}20` : 'transparent',
                  color: active ? c : T.t3,
                  fontWeight: active ? 600 : 400, transition: 'all 0.15s',
                }}>{cat}</button>
              );
            })}
          </div>
        </div>

        {/* Visibilité */}
        <div>
          <FormLabel required>Visibilité</FormLabel>
          <VisibilitySelector value={form.visibility} onChange={v => set('visibility', v)} />
        </div>

        <ModalFooter
          onCancel={() => { onClose(); setForm(FORM_RESET); }}
          onConfirm={handleSubmit}
          confirmLabel={submitting ? 'Création…' : "Créer l'atelier"}
          disabled={submitting}
        />
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   WORKSHOPS PAGE — EXPORT DEFAULT
   ════════════════════════════════════════════════════════════════ */
export default function WorkshopsPage() {
  useGlobalStyle();
  const { addToast } = useNotif();
  const { user } = useAuth();
  const isDirection = DIRECTION_ROLES.includes(user?.role);

  const [workshops, setWorkshops] = useState(INITIAL_WORKSHOPS);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [createModal, setCreateModal] = useState(false);

  /* ── Visibilité + filtres ── */
  const visible = useMemo(() => {
    const afterVis = workshops.filter(w => !(w.visibility === 'direction' && !isDirection));
    const q = query.toLowerCase().trim();
    return afterVis.filter(w => {
      const matchQ = !q || w.title.toLowerCase().includes(q) || w.trainer.toLowerCase().includes(q) || w.category.toLowerCase().includes(q);
      const matchS = statusFilter === 'all' || w.status === statusFilter;
      const matchC = catFilter === 'all' || w.category === catFilter;
      return matchQ && matchS && matchC;
    });
  }, [workshops, isDirection, query, statusFilter, catFilter]);

  const selectedWorkshop = workshops.find(w => w.id === selected);

  /* ── Handlers ── */
  const handleCreate = useCallback(form => {
    const membresValides = form.membres.filter(m => m.nom.trim());
    const nw = {
      id: `w${Date.now()}`,
      title: form.title, date: form.date, time: form.time,
      duration: `${form.nbJours} jour${Number(form.nbJours) > 1 ? 's' : ''}`,
      location: form.location,
      participants: membresValides.length,
      maxParticipants: Number(form.maxParticipants) || Math.max(membresValides.length, 20),
      trainer: form.trainer, category: form.category,
      description: form.description, visibility: form.visibility,
      membres: membresValides, registrations: membresValides.map(m => m.nom),
      status: 'planned',
      programme: form.programme.filter(p => p.item.trim()),
      documents: form.documents.map(d => d.name || d),
    };
    setWorkshops(prev => [...prev, nw]);
    const nbEmails = membresValides.filter(m => m.email).length;
    addToast(`Atelier créé${nbEmails > 0 ? ` · Rappels prévus pour ${nbEmails} membre(s)` : ''} !`, 'success');
  }, [addToast]);

  const handleStatusChange = useCallback((id, newStatus) => {
    setWorkshops(prev => prev.map(w => w.id === id ? { ...w, status: newStatus } : w));
    const labels = { ongoing: 'démarré', done: 'terminé', cancelled: 'annulé' };
    addToast(`Atelier ${labels[newStatus] || 'mis à jour'}.`, newStatus === 'cancelled' ? 'warning' : 'success');
    if (newStatus === 'cancelled') setSelected(null);
  }, [addToast]);

  const handleDelete = useCallback(id => {
    setWorkshops(prev => prev.filter(w => w.id !== id));
    addToast('Atelier supprimé.', 'warning');
    setSelected(null);
  }, [addToast]);

  const handleRegister = useCallback((workshopId, nom, email, cb) => {
    let msg = '';
    setWorkshops(prev => prev.map(w => {
      if (w.id !== workshopId) return w;
      if (w.registrations.includes(nom)) { msg = 'already'; return w; }
      if (w.registrations.length >= w.maxParticipants) { msg = 'full'; return w; }
      return {
        ...w,
        registrations: [...w.registrations, nom],
        membres: [...(w.membres || []), { nom, email }],
      };
    }));
    cb(msg || 'ok');
  }, []);

  /* ── Vue détail ── */
  if (selectedWorkshop) {
    return (
      <WorkshopDetailView
        w={selectedWorkshop}
        onBack={() => setSelected(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onRegister={handleRegister}
        isDirection={isDirection}
        addToast={addToast}
      />
    );
  }

  /* ── Vue liste ── */
  return (
    <div className="xw-page xw-page-enter" style={{ padding: '0 2px', maxWidth: '100%', overflowX: 'hidden' }}>

      {/* Header */}
      <div className="xw-header-row" style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 16, marginBottom: 24, flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.t1, letterSpacing: '-.6px', marginBottom: 4, fontFamily: 'var(--font-sans)' }}>
            Ateliers
          </h1>
          <p style={{ fontSize: 13, color: T.t3, fontFamily: 'var(--font-sans)' }}>
            {visible.length} atelier{visible.length !== 1 ? 's' : ''} · {workshops.filter(w => w.status === 'planned' && (w.visibility !== 'direction' || isDirection)).length} planifiés
          </p>
        </div>
        <PrimaryBtn onClick={() => setCreateModal(true)}>
          <Ic.plus /> Organiser un atelier
        </PrimaryBtn>
      </div>

      <StatsHeader workshops={workshops.filter(w => w.visibility !== 'direction' || isDirection)} />

      <FiltersBar
        query={query} setQuery={setQuery}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        catFilter={catFilter} setCatFilter={setCatFilter}
        activeCount={visible.length}
      />

      {visible.length === 0
        ? (
          <EmptyState
            hasQuery={!!query || statusFilter !== 'all' || catFilter !== 'all'}
            onAction={() => setCreateModal(true)}
          />
        )
        : (
          <div className="xw-grid">
            {visible.map((w, i) => (
              <WorkshopCard
                key={w.id}
                w={w}
                index={i}
                isDirection={isDirection}
                onStart={() => handleStatusChange(w.id, 'ongoing')}
                onFinish={() => handleStatusChange(w.id, 'done')}
                onCancel={() => handleStatusChange(w.id, 'cancelled')}
                onDelete={() => handleDelete(w.id)}
                onClick={() => setSelected(w.id)}
              />
            ))}
          </div>
        )
      }

      <CreateWorkshopModal
        open={createModal}
        onClose={() => setCreateModal(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}