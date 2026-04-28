import React, {
  useState, useMemo, useRef, useEffect, useCallback, memo,
} from 'react';
import ReactDOM from 'react-dom';
import { Modal }          from '../../../components/ui/index';
import { useNotif }       from '../../../context/NotifContext';
import { useAuth }        from '../../../context/AuthContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { useRdvCreate }   from '../hooks/useRdvCreate';
import AppointmentForm, { FORM_INITIAL } from './AppointmentForm';
import AppointmentDetailModal            from './AppointmentDetailModal';

/* ─── Global CSS ──────────────────────────────────────────────── */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  .xm-page { font-family: var(--font-sans); }
  .xm-mono { font-family: var(--font-mono); }

  @media (max-width: 700px) {
    .xm-stats    { grid-template-columns: repeat(2, 1fr) !important; }
    .xm-header   { flex-direction: column; align-items: flex-start !important; }
    .xm-filters  { flex-direction: column; align-items: stretch !important; }
  }

  @keyframes xm-fade-up  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes xm-bar      { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  @keyframes xm-blink    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
  @keyframes xm-menu-pop { from{opacity:0;transform:scale(.96) translateY(-4px)} to{opacity:1;transform:none} }
  @keyframes xm-modal-bg { from{opacity:0} to{opacity:1} }
  @keyframes xm-modal-in { from{opacity:0;transform:translateY(12px) scale(.97)} to{opacity:1;transform:none} }

  .xm-enter      { animation: xm-fade-up .28s cubic-bezier(.22,1,.36,1) both; }
  .xm-card-enter { animation: xm-fade-up .28s cubic-bezier(.22,1,.36,1) both; }

  .xm-scrollbar::-webkit-scrollbar        { width:5px; height:5px; }
  .xm-scrollbar::-webkit-scrollbar-track  { background:transparent; }
  .xm-scrollbar::-webkit-scrollbar-thumb  { background:var(--color-background-hover); border-radius:99px; }
  .xm-scrollbar::-webkit-scrollbar-thumb:hover { background:var(--color-text-muted); }
`;

const API_BASE = process.env.REACT_APP_API_URL || '/api';

function authHeaders() {
  const token = localStorage.getItem('xamio_token');
  return {
    'Content-Type':  'application/json',
    'Accept':        'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

function useGlobalStyle() {
  useEffect(() => {
    const id = 'xm-appt-style';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = GLOBAL_CSS;
      document.head.appendChild(s);
    }
  }, []);
}

/* ─── Tokens ──────────────────────────────────────────────────── */
const T = {
  bg1:'var(--color-background-secondary)',
  bg2:'var(--color-background-tertiary)',
  bg3:'var(--color-background-elevated)',
  bd0:'var(--color-border)',
  bd1:'var(--color-border-medium)',
  bd2:'var(--color-border-strong)',
  t1:'var(--color-text-primary)',
  t2:'var(--color-text-secondary)',
  t3:'var(--color-text-muted)',

  // ✅ Orange Xamio — identique au Dashboard
  acc:  '#E8500A',
  acc2: '#C94108',
  accm: 'rgba(232, 80, 10, 0.08)',
  accb: 'rgba(232, 80, 10, 0.22)',

  r6:'var(--radius-medium)',
  r8:'var(--radius-large)',
  r10:'10px',
  r12:'var(--radius-xlarge)',
  r16:'16px',
  r20:'20px',
  sdrop:'var(--shadow-dropdown)',
  smod:'var(--shadow-modal)',
};
/* ─── Constants ───────────────────────────────────────────────── */
const DIRECTION_ROLES = ['Directeur', 'Assistant'];

const TYPE_META = {
  demo:        { label:'Démo',          color:'accent'   },
  partnership: { label:'Partenariat',   color:'purple'   },
  investment:  { label:'Investissement',color:'warning'  },
  commercial:  { label:'Commercial',    color:'success'  },
  hr:          { label:'RH',            color:'danger'   },
};

const TYPE_BLOCK = {
  accent:  { bg:'var(--color-accent-bg)',  border:'var(--color-accent-border)',  fg:'var(--color-accent)'  },
  purple:  { bg:'var(--color-purple-bg)',  border:'var(--color-purple-border)',  fg:'var(--color-purple)'  },
  warning: { bg:'var(--color-warning-bg)', border:'var(--color-warning-border)', fg:'var(--color-warning)' },
  success: { bg:'var(--color-success-bg)', border:'var(--color-success-border)', fg:'var(--color-success)' },
  danger:  { bg:'var(--color-danger-bg)',  border:'var(--color-danger-border)',  fg:'var(--color-danger)'  },
};

const STATUS_CFG = {
  confirmed: { label:'Confirmé',   fg:'var(--color-success)', bg:'var(--color-success-bg)', dot:'var(--color-success)', border:'var(--color-success-border)' },
  pending:   { label:'En attente', fg:'var(--color-warning)', bg:'var(--color-warning-bg)', dot:'var(--color-warning)', border:'var(--color-warning-border)' },
  cancelled: { label:'Annulé',     fg:'var(--color-danger)',  bg:'var(--color-danger-bg)',  dot:'var(--color-danger)',  border:'var(--color-danger-border)'  },
};

const STAT_CONFIG = [
  { key:'pending',   label:'En attente', color:'var(--color-warning)' },
  { key:'confirmed', label:'Confirmés',  color:'var(--color-success)' },
  { key:'cancelled', label:'Annulés',    color:'var(--color-danger)'  },
];

const TIME_FILTERS = [
  { v:'all',    l:'Toutes les périodes' },
  { v:'today',  l:"Aujourd'hui" },
  { v:'week',   l:'Cette semaine' },
  { v:'month',  l:'Ce mois' },
  { v:'custom', l:'Personnalisé' },
];

const TYPE_FILTERS = [
  { v:'all',         l:'Tous les types'    },
  { v:'demo',        l:'Démo'              },
  { v:'partnership', l:'Partenariat'       },
  { v:'investment',  l:'Investissement'    },
  { v:'commercial',  l:'Commercial'        },
  { v:'hr',          l:'RH'               },
];

const TAB_CFG = [
  { key:'all',       label:'Tous',       dot:null                    },
  { key:'pending',   label:'En attente', dot:'var(--color-warning)'  },
  { key:'confirmed', label:'Confirmés',  dot:'var(--color-success)'  },
  { key:'cancelled', label:'Annulés',    dot:'var(--color-danger)'   },
];

/* ─── Helpers ─────────────────────────────────────────────────── */
function toDate(s)         { return s ? new Date(s) : null; }
function startOfWeek(d)    { const r=new Date(d); const dy=r.getDay()||7; r.setDate(r.getDate()-dy+1); r.setHours(0,0,0,0); return r; }
function endOfWeek(d)      { const r=startOfWeek(d); r.setDate(r.getDate()+6); r.setHours(23,59,59,999); return r; }
function startOfMonth(d)   { return new Date(d.getFullYear(),d.getMonth(),1); }
function endOfMonth(d)     { return new Date(d.getFullYear(),d.getMonth()+1,0,23,59,59,999); }

function formatDateLong(s) {
  if (!s) return '—';
  return new Date(s + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday:'long', day:'numeric', month:'long',
  });
}

function formatContactLabel(a) {
  if (a.contactSociete && a.contactType === 'entreprise') return a.contactSociete;
  if (a.contactNom) return a.contactNom;
  if (a.with)       return a.with;
  return null;
}

function rappelLabel(r) {
  return r < 60 ? `${r}min` : r < 1440 ? `${r/60}h` : `${r/1440}j`;
}

/* ─── Normalisation API → format local ───────────────────────── */
function normalizeRdv(r) {
  const statusMap = { planifie:'pending', confirme:'confirmed', annule:'cancelled', termine:'cancelled' };
  return {
    id:             String(r.rdv_id),
    title:          r.rdv_titre              ?? '',
    date:           r.rdv_date?.slice(0, 10) ?? '',
    time:           r.rdv_heure?.slice(0, 5) ?? '',
    duration:       r.rdv_duree              ?? 60,
    type:           r.rdv_type               ?? 'demo',
    status:         statusMap[r.rdv_statut]  ?? 'pending',
    location:       r.rdv_lieu               ?? '',
    description:    r.rdv_description        ?? '',
    visibility:     r.rdv_visibilite === 'direction' ? 'direction' : 'all',
    rappels:        r.rdv_rappels            ?? [],
    contactType:    r.contactExterne?.contact_type    ?? 'personne',
    contactNom:     r.contactExterne?.contact_nom     ?? '',
    contactEmail:   r.contactExterne?.contact_email   ?? '',
    contactTel:     r.contactExterne?.contact_tel     ?? '',
    contactSociete: r.contactExterne?.contact_societe ?? '',
    with:           r.contactExterne?.contact_nom     ?? '',
    email:          r.contactExterne?.contact_email   ?? '',
    participants:   r.participants ?? [],
  };
}

/* ─── Micro-hooks ─────────────────────────────────────────────── */
function useHover() {
  const [h, set] = useState(false);
  return [h, { onMouseEnter:()=>set(true), onMouseLeave:()=>set(false) }];
}

function useOutsideClick(ref, cb) {
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [ref, cb]);
}

/* ─── Custom hooks ────────────────────────────────────────────── */
function useInsights(appts) {
  return useMemo(() => {
    const total     = appts.length;
    const totalMins = appts.reduce((s, a) => s + (parseInt(a.duration) || 0), 0);
    const h = Math.floor(totalMins / 60), m = totalMins % 60;
    const durationLabel = totalMins === 0 ? '0 min'
      : h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m} min`;
    const byStatus = Object.keys(STATUS_CFG).reduce((acc, k) => {
      acc[k] = appts.filter(a => a.status === k).length;
      return acc;
    }, {});
    const next = appts
      .filter(a => a.status === 'pending')
      .sort((a, b) => (a.date+' '+(a.time||'')).localeCompare(b.date+' '+(b.time||'')))[0] || null;
    return { total, durationLabel, byStatus, next };
  }, [appts]);
}

function useTimeFilter(appts, timeFilter, customRange) {
  return useMemo(() => {
    if (timeFilter === 'all') return appts;
    const now = new Date(); let lo, hi;
    if (timeFilter === 'today')  { lo=new Date(now); lo.setHours(0,0,0,0); hi=new Date(now); hi.setHours(23,59,59,999); }
    if (timeFilter === 'week')   { lo=startOfWeek(now); hi=endOfWeek(now); }
    if (timeFilter === 'month')  { lo=startOfMonth(now); hi=endOfMonth(now); }
    if (timeFilter === 'custom') { lo=customRange.from?new Date(customRange.from):null; hi=customRange.to?new Date(customRange.to):null; }
    return appts.filter(a => {
      const d = toDate(a.date); if (!d) return false;
      if (lo && d < lo) return false;
      if (hi && d > hi) return false;
      return true;
    });
  }, [appts, timeFilter, customRange]);
}

/* ─── SVG Icons ───────────────────────────────────────────────── */
const Ic = {
  plus:      () => <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  dots:      () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="1.4" fill="currentColor"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/><circle cx="13" cy="8" r="1.4" fill="currentColor"/></svg>,
  clk:       () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  loc:       () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a4.5 4.5 0 014.5 4.5c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 018 1.5z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  lock:      () => <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><rect x="3" y="7.5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 7.5V5a2.5 2.5 0 015 0v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  check:     () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trash:     () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M5 5l.5 8h5L11 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  warn:      () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2L14.5 13H1.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  search:    () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  close:     () => <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  chevDown:  () => <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevRight: () => <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  lightning: () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M9 1L3 9h5l-1 6 6-8H8l1-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  user:      () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  bell:      () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1.5A4.5 4.5 0 003.5 6v3.5L2 11h12l-1.5-1.5V6A4.5 4.5 0 008 1.5z" stroke="currentColor" strokeWidth="1.4"/><path d="M6.5 13a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  tag:       () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M2 2h6l6 6-6 6-6-6V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="5.5" cy="5.5" r="1" fill="currentColor"/></svg>,
  building:  () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.4"/><path d="M5 14V9h6v5M5 6h1M10 6h1M5 9h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  cal:       () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
};

/* ─── Atoms ───────────────────────────────────────────────────── */
function IconBtn({ children, onClick, active, danger, title, size=28 }) {
  const [h, hp] = useHover();
  return (
    <button onClick={onClick} title={title} {...hp} style={{
      width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center',
      background: active ? T.bg3 : h ? T.bg2 : 'transparent',
      border:`1px solid ${active||h ? T.bd1 : 'transparent'}`,
      borderRadius:T.r6, cursor:'pointer', flexShrink:0,
      color: danger && h ? 'var(--color-danger)' : active ? T.t1 : h ? T.t2 : T.t3,
      transition:'all .13s',
    }}>{children}</button>
  );
}

function StatusPill({ statusKey, compact=false }) {
  const c = STATUS_CFG[statusKey] || STATUS_CFG.pending;
  const live = statusKey === 'pending';
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding: compact ? '2px 7px' : '3px 10px',
      borderRadius:T.r20, background:c.bg,
      fontSize: compact ? 10 : 11, fontWeight:500, color:c.fg,
      border:`1px solid ${c.border}`, whiteSpace:'nowrap',
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:c.dot, flexShrink:0,
        animation: live ? 'xm-blink 1.8s ease infinite' : 'none' }}/>
      {c.label}
    </span>
  );
}

function TypeBlock({ type }) {
  const m = TYPE_META[type] || TYPE_META.demo;
  const s = TYPE_BLOCK[m.color] || TYPE_BLOCK.accent;
  return (
    <div style={{
      width:44, height:44, flexShrink:0, background:s.bg,
      border:`1px solid ${s.border}`, borderRadius:T.r10,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3,
    }}>
      <span style={{ color:s.fg, lineHeight:0 }}><Ic.tag /></span>
      <span style={{ fontSize:9, fontWeight:700, color:s.fg, letterSpacing:'.04em', textTransform:'uppercase' }}>
        {m.label.slice(0,4)}
      </span>
    </div>
  );
}

function PrivateBadge() {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'2px 7px', borderRadius:T.r20,
      background:'var(--color-accent-bg)', color:'var(--color-accent)',
      fontSize:10, fontWeight:500, border:'1px solid var(--color-accent-border)',
    }}>
      <Ic.lock /> Privé
    </span>
  );
}

function PrimaryBtn({ children, onClick, disabled, danger, small }) {
  const [h, hp] = useHover();
  const bg = danger ? 'var(--color-danger)' : disabled ? T.t3 : h ? T.acc2 : T.acc;
  return (
    <button onClick={onClick} disabled={disabled} {...hp} style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding: small ? '6px 14px' : '9px 18px',
      borderRadius:T.r8, border:'none', background:bg, color:'#fff',
      fontSize: small ? 12 : 13, fontWeight:700,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .6 : 1,
      fontFamily:'var(--font-sans)', transition:'all .15s',
      boxShadow: h && !disabled ? `0 4px 20px ${T.acc}55` : `0 2px 8px ${T.acc}33`,
      transform: h && !disabled ? 'translateY(-1px)' : 'none', whiteSpace:'nowrap',
    }}>{children}</button>
  );
}

function GhostBtn({ children, onClick, small }) {
  const [h, hp] = useHover();
  return (
    <button onClick={onClick} {...hp} style={{
      padding: small ? '5px 12px' : '8px 16px',
      borderRadius:T.r8, border:`1px solid ${T.bd1}`,
      background: h ? T.bg2 : 'transparent',
      fontSize: small ? 12 : 13, fontWeight:450,
      color: h ? T.t1 : T.t2, cursor:'pointer',
      fontFamily:'var(--font-sans)', transition:'all .15s', whiteSpace:'nowrap',
    }}>{children}</button>
  );
}

function Field({ as: As='input', style, ...props }) {
  const [f, sf] = useState(false);
  return (
    <As {...props} style={{
      width:'100%', background:T.bg3,
      border:`1px solid ${f ? T.bd2 : T.bd0}`,
      borderRadius:T.r8,
      padding: As==='textarea' ? '9px 13px' : '0 13px',
      height: As==='textarea' ? undefined : 36,
      color:T.t1, fontSize:13, lineHeight:1.6, outline:'none',
      fontFamily:'var(--font-sans)', boxSizing:'border-box',
      transition:'border-color .15s, box-shadow .15s',
      boxShadow: f ? `0 0 0 3px ${T.accm}` : 'none',
      caretColor:'var(--color-warning)', ...style,
    }}
    onFocus={()=>sf(true)} onBlur={()=>sf(false)}
    />
  );
}

function FormLabel({ children, required, hint }) {
  return (
    <label style={{ display:'block', fontSize:12, fontWeight:500, color:T.t2, marginBottom:5 }}>
      {children}
      {required && <span style={{ color:'var(--color-danger)', marginLeft:3 }}>*</span>}
      {hint     && <span style={{ color:T.t3, fontWeight:400, marginLeft:6, fontSize:11 }}>{hint}</span>}
    </label>
  );
}

/* ─── Dropdown ────────────────────────────────────────────────── */
function Dropdown({ label, options, value, onChange, icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, useCallback(() => setOpen(false), []));
  const current = options.find(o => o.v === value);
  const [h, hp] = useHover();
  return (
    <div ref={ref} style={{ position:'relative', flexShrink:0 }}>
      <button onClick={() => setOpen(o => !o)} {...hp} style={{
        display:'flex', alignItems:'center', gap:7, padding:'0 12px', height:34,
        borderRadius:T.r8, border:`1px solid ${open||h ? T.bd2 : T.bd0}`,
        background: open||h ? T.bg2 : T.bg1,
        color:T.t1, fontSize:12.5, fontWeight:500, cursor:'pointer',
        fontFamily:'var(--font-sans)', transition:'all .13s', whiteSpace:'nowrap',
      }}>
        {icon && <span style={{ color:T.t3, lineHeight:0 }}>{icon}</span>}
        {current?.l || label}
        <span style={{
          color:T.t3, lineHeight:0, marginLeft:2,
          transform: open ? 'rotate(180deg)' : 'none', transition:'transform .15s',
        }}><Ic.chevDown /></span>
      </button>
      {open && (
        <div style={{
          position:'absolute', top:40, left:0, zIndex:300,
          background:T.bg2, border:`1px solid ${T.bd1}`,
          borderRadius:T.r10, padding:5, minWidth:200,
          boxShadow:T.sdrop, animation:'xm-menu-pop .14s cubic-bezier(.22,1,.36,1)',
        }}>
          {options.map(o => {
            const sel = o.v === value;
            return <DropItem key={o.v} label={o.l} selected={sel} onClick={() => { onChange(o.v); setOpen(false); }} />;
          })}
        </div>
      )}
    </div>
  );
}

function DropItem({ label, selected, onClick }) {
  const [h, hp] = useHover();
  return (
    <button onClick={onClick} {...hp} style={{
      width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'7px 10px', borderRadius:T.r6, border:'none',
      background: h ? T.bg3 : 'transparent',
      color: selected ? T.t1 : T.t2,
      fontSize:12.5, fontWeight: selected ? 500 : 400,
      cursor:'pointer', fontFamily:'var(--font-sans)', textAlign:'left', transition:'all .1s',
    }}>
      {label}
      {selected && <span style={{ color:T.acc, lineHeight:0 }}><Ic.check /></span>}
    </button>
  );
}

/* ─── ModalFooter ─────────────────────────────────────────────── */
function ModalFooter({ onCancel, onConfirm, cancelLabel='Annuler', confirmLabel='Confirmer', danger=false }) {
  return (
    <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:20, borderTop:`1px solid ${T.bd0}`, marginTop:4 }}>
      <GhostBtn onClick={onCancel}>{cancelLabel}</GhostBtn>
      <PrimaryBtn onClick={onConfirm} danger={danger}>{confirmLabel}</PrimaryBtn>
    </div>
  );
}

/* ─── Action menu ─────────────────────────────────────────────── */
function ActionMenu({ appt, onConfirm, onCancel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, useCallback(() => setOpen(false), []));
  if (appt.status === 'cancelled') return null;

  const items = [];
  if (appt.status === 'pending') items.push({ icon:<Ic.check />, label:'Confirmer le RDV', fn:onConfirm, accent:true });
  items.push({ sep:true });
  items.push({ icon:<Ic.trash />, label:'Annuler le RDV', fn:onCancel, danger:true });

  return (
    <div ref={ref} style={{ position:'relative', flexShrink:0 }} onClick={e => e.stopPropagation()}>
      <IconBtn onClick={() => setOpen(o => !o)} active={open}><Ic.dots /></IconBtn>
      {open && (
        <div style={{
          position:'absolute', right:0, top:34, zIndex:200,
          background:T.bg2, border:`1px solid ${T.bd1}`,
          borderRadius:T.r10, padding:5, minWidth:200,
          boxShadow:T.sdrop, animation:'xm-menu-pop .14s cubic-bezier(.22,1,.36,1)',
        }}>
          {items.map((item, i) => item.sep
            ? <div key={i} style={{ height:1, background:T.bd0, margin:'4px 0' }} />
            : <ActionItem key={i} {...item} onClick={() => { setOpen(false); item.fn(); }} />
          )}
        </div>
      )}
    </div>
  );
}

function ActionItem({ icon, label, danger, accent, onClick }) {
  const [h, hp] = useHover();
  const color = danger ? 'var(--color-danger)' : accent ? T.acc : T.t2;
  return (
    <button onClick={onClick} {...hp} style={{
      width:'100%', display:'flex', alignItems:'center', gap:9,
      padding:'7px 10px', borderRadius:T.r6, border:'none',
      background: h ? (danger ? 'rgba(240,112,112,.07)' : T.bg3) : 'transparent',
      cursor:'pointer', fontSize:12.5, fontWeight:450, color,
      fontFamily:'var(--font-sans)', textAlign:'left', transition:'all .1s',
    }}>
      <span style={{ lineHeight:0, opacity:.85, flexShrink:0 }}>{icon}</span>{label}
    </button>
  );
}

/* ─── Stats ───────────────────────────────────────────────────── */
function StatsRow({ insights }) {
  return (
    <div className="xm-stats" style={{
      display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))',
      gap:10, marginBottom:20,
    }}>
      {STAT_CONFIG.map(({ key, label, color }) => {
        const n   = insights.byStatus[key] || 0;
        const pct = insights.total > 0 ? Math.round(n / insights.total * 100) : 0;
        return <StatCard key={key} value={n} label={label} color={color} pct={pct} />;
      })}
    </div>
  );
}

function StatCard({ value, label, color, pct }) {
  const [h, hp] = useHover();
  return (
    <div {...hp} style={{
      background:T.bg1, border:`1px solid ${h ? T.bd1 : T.bd0}`,
      borderRadius:T.r12, padding:'14px 16px',
      transition:'border-color .15s, box-shadow .15s',
      boxShadow: h ? T.sdrop : 'none',
    }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ fontSize:26, fontWeight:700, color:T.t1, letterSpacing:'-1px', lineHeight:1 }}>{value}</span>
        <span style={{ fontSize:11, color:T.t3, fontFamily:'var(--font-mono)', marginBottom:2 }}>{pct}%</span>
      </div>
      <div style={{ height:2, background:T.bg3, borderRadius:99, marginBottom:8, overflow:'hidden' }}>
        <div style={{
          height:'100%', background:color, borderRadius:99, width:`${pct}%`,
          transformOrigin:'left', animation:'xm-bar .7s cubic-bezier(.22,1,.36,1)',
        }} />
      </div>
      <div style={{ fontSize:11.5, color:T.t3, fontWeight:500, display:'flex', alignItems:'center', gap:5 }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0 }} />
        {label}
      </div>
    </div>
  );
}

/* ─── Tab bar ─────────────────────────────────────────────────── */
function TabBar({ active, setActive, counts }) {
  const hasPending = counts.pending > 0 && active !== 'pending';
  return (
    <div style={{ display:'flex', gap:2, borderBottom:`1px solid ${T.bd0}`, marginBottom:20 }}>
      {TAB_CFG.map(({ key, label, dot }) => {
        const isActive = active === key;
        const n = counts[key] ?? 0;
        return (
          <button key={key} onClick={() => setActive(key)} style={{
            background:'none', border:'none', cursor:'pointer',
            padding:'9px 14px', fontSize:13,
            fontWeight: isActive ? 600 : 400,
            color: isActive ? T.t1 : T.t3,
            borderBottom: isActive ? `2px solid ${T.t1}` : '2px solid transparent',
            marginBottom:-1, display:'flex', alignItems:'center', gap:6,
            transition:'color .15s', fontFamily:'var(--font-sans)', whiteSpace:'nowrap',
          }}>
            {dot && (
              <span style={{
                width:5, height:5, borderRadius:'50%', background:dot, flexShrink:0,
                animation: key==='pending' && hasPending ? 'xm-blink 1.8s ease infinite' : 'none',
              }} />
            )}
            {label}
            <span style={{
              fontSize:11, fontWeight:600, padding:'1px 7px', borderRadius:T.r20,
              fontFamily:'var(--font-mono)',
              background: isActive ? T.bg3 : T.bg1,
              color: isActive ? T.t1 : T.t3,
              transition:'background .15s, color .15s',
            }}>{n}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Filters bar ─────────────────────────────────────────────── */
function FiltersBar({ query, setQuery, typeFilter, setTypeFilter, timeFilter, setTimeFilter, customRange, setCustomRange, activeCount }) {
  const [showCustom, setShowCustom] = useState(false);
  const handleTimeChange = v => { setTimeFilter(v); setShowCustom(v === 'custom'); };
  const hasActive = typeFilter !== 'all' || timeFilter !== 'all' || query !== '';

  return (
    <div style={{ marginBottom:20 }}>
      <div className="xm-filters" style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1 1 200px', minWidth:0 }}>
          <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:T.t3, lineHeight:0 }}><Ic.search /></span>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher par titre, contact, société…"
            style={{ width:'100%', background:T.bg1, border:`1px solid ${T.bd0}`, borderRadius:T.r8, padding:'0 34px 0 35px', height:34, color:T.t1, fontSize:12.5, outline:'none', fontFamily:'var(--font-sans)', boxSizing:'border-box', transition:'border-color .13s, box-shadow .13s', caretColor:'var(--color-warning)' }}
            onFocus={e => { e.target.style.borderColor = T.bd2; e.target.style.boxShadow = `0 0 0 3px ${T.accm}`; }}
            onBlur={e  => { e.target.style.borderColor = T.bd0; e.target.style.boxShadow = 'none'; }}
          />
          {query && <button onClick={() => setQuery('')} style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:T.t3, lineHeight:0, padding:2 }}><Ic.close /></button>}
        </div>
        <Dropdown label="Type"    icon={<Ic.tag />} options={TYPE_FILTERS} value={typeFilter} onChange={setTypeFilter} />
        <Dropdown label="Période" icon={<Ic.cal />} options={TIME_FILTERS} value={timeFilter} onChange={handleTimeChange} />
        {hasActive && (
          <button onClick={() => { setQuery(''); setTypeFilter('all'); setTimeFilter('all'); setShowCustom(false); }}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'0 10px', height:34, borderRadius:T.r8, border:`1px solid ${T.bd0}`, background:'transparent', color:T.t3, fontSize:12, cursor:'pointer', fontFamily:'var(--font-sans)', transition:'all .13s', whiteSpace:'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.color=T.t1; e.currentTarget.style.borderColor=T.bd1; }}
            onMouseLeave={e => { e.currentTarget.style.color=T.t3; e.currentTarget.style.borderColor=T.bd0; }}
          ><Ic.close /> Réinitialiser</button>
        )}
      </div>
      {showCustom && (
        <div style={{ marginTop:8, display:'flex', gap:10, alignItems:'center', padding:'10px 14px', background:T.bg1, borderRadius:T.r8, border:`1px solid ${T.bd0}`, animation:'xm-fade-up .15s ease' }}>
          <span style={{ fontSize:12, color:T.t3, flexShrink:0 }}>Du</span>
          <Field type="date" value={customRange.from} onChange={e => setCustomRange(r => ({...r, from:e.target.value}))} style={{ maxWidth:150, height:32, fontSize:12 }} />
          <span style={{ fontSize:12, color:T.t3, flexShrink:0 }}>au</span>
          <Field type="date" value={customRange.to}   onChange={e => setCustomRange(r => ({...r, to:e.target.value}))}   style={{ maxWidth:150, height:32, fontSize:12 }} />
        </div>
      )}
      {(typeFilter !== 'all' || timeFilter !== 'all') && (
        <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
          {typeFilter !== 'all' && <FilterChip label={TYPE_FILTERS.find(f=>f.v===typeFilter)?.l} onRemove={() => setTypeFilter('all')} />}
          {timeFilter !== 'all' && <FilterChip label={TIME_FILTERS.find(f=>f.v===timeFilter)?.l} onRemove={() => { setTimeFilter('all'); setShowCustom(false); }} />}
          <span style={{ fontSize:11, color:T.t3, display:'flex', alignItems:'center', marginLeft:2 }}>{activeCount} résultat{activeCount !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'2px 8px 2px 10px', borderRadius:T.r20, background:T.accm, border:`1px solid ${T.accb}`, fontSize:11, fontWeight:500, color:T.acc }}>
      {label}
      <button onClick={onRemove} style={{ background:'none', border:'none', cursor:'pointer', color:T.acc, lineHeight:0, padding:1, opacity:.7, transition:'opacity .1s' }}
        onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='.7'}
      ><Ic.close /></button>
    </span>
  );
}

/* ─── Date divider ────────────────────────────────────────────── */
function DateDivider({ date }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, marginTop:4 }}>
      <span style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:T.t3, fontFamily:'var(--font-mono)', whiteSpace:'nowrap' }}>
        {formatDateLong(date)}
      </span>
      <div style={{ flex:1, height:'1px', background:T.bd0 }} />
    </div>
  );
}

/* ─── Appointment card ────────────────────────────────────────── */
const ApptCard = memo(function ApptCard({ a, index, peutAgir, onConfirm, onCancel, isNext, onClick }) {
  const [h, hp] = useHover();
  const cancelled = a.status === 'cancelled';
  const contact   = formatContactLabel(a);
  const rappels   = a.rappels?.length || 0;
  const borderColor = cancelled ? 'rgba(240,112,112,.15)' : isNext ? T.acc : h ? T.bd2 : T.bd0;

  return (
    <article
      className="xm-card-enter"
      {...(cancelled ? {} : hp)}
      onClick={cancelled ? undefined : onClick}
      style={{
        background: cancelled ? T.bg1 : h ? T.bg2 : T.bg1,
        border: `1px solid ${borderColor}`,
        borderLeft: isNext ? `3px solid ${T.acc}` : undefined,
        borderRadius: T.r12, padding: '14px 16px', opacity: cancelled ? .52 : 1,
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'border-color .18s, box-shadow .18s, background .18s',
        boxShadow: isNext ? `0 0 0 3px ${T.accm}` : h && !cancelled ? T.sdrop : 'none',
        animationDelay: `${index * 28}ms`, position: 'relative', overflow: 'hidden',
        cursor: cancelled ? 'default' : 'pointer',
      }}
    >
      <TypeBlock type={a.type} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, flex:1, minWidth:0 }}>
            {isNext && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'1px 7px', borderRadius:T.r20, background:T.accm, border:`1px solid ${T.accb}`, fontSize:10, fontWeight:700, color:T.acc, whiteSpace:'nowrap', flexShrink:0 }}>
                <Ic.lightning /> Prochain
              </span>
            )}
            <h3 style={{ fontSize:13.5, fontWeight:600, lineHeight:1.35, color: cancelled ? T.t3 : T.t1, textDecoration: cancelled ? 'line-through' : 'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'var(--font-sans)', margin:0, minWidth:0 }}>
              {a.title || '—'}
            </h3>
          </div>
          <div style={{ display:'flex', gap:5, alignItems:'center', flexShrink:0 }}>
            <StatusPill statusKey={a.status} compact />
            {a.visibility === 'direction' && <PrivateBadge />}
          </div>
        </div>
        <div style={{ display:'flex', gap:10, fontSize:11, color:T.t3, flexWrap:'wrap', alignItems:'center', fontFamily:'var(--font-mono)' }}>
          {a.time && <MetaItem icon={<Ic.clk />}>{a.time}{a.duration && <span style={{ opacity:.6, fontFamily:'var(--font-sans)' }}> · {a.duration}min</span>}</MetaItem>}
          {a.location && <MetaItem icon={<Ic.loc />} style={{ fontFamily:'var(--font-sans)' }}><span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block', maxWidth:200 }}>{a.location}</span></MetaItem>}
          {contact && <MetaItem icon={a.contactType === 'entreprise' ? <Ic.building /> : <Ic.user />} style={{ fontFamily:'var(--font-sans)' }}>{contact}</MetaItem>}
          {rappels > 0 && <MetaItem icon={<Ic.bell />} style={{ fontFamily:'var(--font-sans)' }}>{rappels} rappel{rappels > 1 ? 's' : ''}</MetaItem>}
        </div>
        {a.description && <p style={{ fontSize:11.5, color:T.t3, marginTop:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.5 }}>{a.description}</p>}
      </div>

      {/* stopPropagation pour ne pas déclencher le clic carte */}
      {peutAgir && !cancelled && (
        <div
          style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, marginLeft:4 }}
          onClick={e => e.stopPropagation()}
        >
          <ActionMenu appt={a} onConfirm={onConfirm} onCancel={onCancel} />
        </div>
      )}

      {cancelled && a.cancelReason && (
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'6px 14px', background:'rgba(240,112,112,.07)', borderTop:'1px solid rgba(240,112,112,.12)', display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ color:'var(--color-danger)', lineHeight:0, flexShrink:0 }}><Ic.warn /></span>
          <span style={{ fontSize:11, color:'var(--color-danger)' }}>{a.cancelReason}</span>
        </div>
      )}
    </article>
  );
});

function MetaItem({ icon, children, style }) {
  return (
    <span style={{ display:'flex', alignItems:'center', gap:4, ...style }}>
      <span style={{ lineHeight:0, opacity:.6, flexShrink:0 }}>{icon}</span>
      {children}
    </span>
  );
}

/* ─── Empty state ─────────────────────────────────────────────── */
function EmptyState({ hasFilters }) {
  return (
    <div style={{ textAlign:'center', padding:'72px 24px', background:T.bg1, borderRadius:T.r16, border:`1px solid ${T.bd0}` }}>
      <div style={{ width:52, height:52, borderRadius:14, background:T.accm, border:`1px solid ${T.accb}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
        <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
          <rect x="1" y="4" width="20" height="16" rx="2.5" stroke={T.acc} strokeWidth="1.6"/>
          <path d="M7 1v4M15 1v4M1 10h20" stroke={T.acc} strokeWidth="1.6" strokeLinecap="round"/>
          <circle cx="7" cy="15" r="1.5" fill={T.acc}/><circle cx="11" cy="15" r="1.5" fill={T.acc}/><circle cx="15" cy="15" r="1.5" fill={T.acc}/>
        </svg>
      </div>
      <p style={{ fontSize:14, fontWeight:600, color:T.t1, marginBottom:6 }}>{hasFilters ? 'Aucun résultat' : 'Aucun rendez-vous'}</p>
      <p style={{ fontSize:13, color:T.t3, maxWidth:300, margin:'0 auto', lineHeight:1.7 }}>{hasFilters ? 'Modifiez vos filtres ou votre recherche.' : 'Planifiez votre premier rendez-vous.'}</p>
    </div>
  );
}

/* ─── Cancel modal ────────────────────────────────────────────── */
function CancelModal({ open, onClose, appt, onConfirm }) {
  const [reason, setReason] = useState('');
  useEffect(() => { if (open) setReason(''); }, [open]);
  if (!open || !appt) return null;

  return ReactDOM.createPortal(
    <Modal open={open} onClose={onClose} title="Annuler le rendez-vous" width={460}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ padding:'12px 14px', borderRadius:T.r10, background:'rgba(240,112,112,.07)', border:'1px solid rgba(240,112,112,.18)' }}>
          <p style={{ fontSize:13, fontWeight:600, color:'var(--color-danger)', marginBottom:5, display:'flex', alignItems:'center', gap:8 }}><Ic.warn />{appt.title}</p>
          <p style={{ fontSize:12, color:T.t3, lineHeight:1.6, margin:0 }}>Le rendez-vous sera marqué comme annulé.</p>
        </div>
        <div>
          <FormLabel>Motif d'annulation</FormLabel>
          <Field as="textarea" value={reason} onChange={e => setReason(e.target.value)} placeholder="Raison (facultatif)…" rows={3} style={{ resize:'vertical', lineHeight:1.6 }} />
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:20, borderTop:`1px solid ${T.bd0}`, marginTop:4 }}>
          <GhostBtn onClick={onClose}>Conserver</GhostBtn>
          <PrimaryBtn onClick={() => onConfirm(reason)} danger>Annuler le RDV</PrimaryBtn>
        </div>
      </div>
    </Modal>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ═══════════════════════════════════════════════════════════════ */
export default function AppointmentsPage() {
  useGlobalStyle();
  const { addToast }                          = useNotif();
  const { user }                              = useAuth();
  const { isAdmin, isAssistant, isDirecteur } = usePermissions();

  const { create: createRdv, loading: creating } = useRdvCreate();

  const [appts,        setAppts]        = useState([]);
  const [createModal,  setCreateModal]  = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [detailAppt,   setDetailAppt]   = useState(null); // ← NOUVEAU
  const [form,         setForm]         = useState(FORM_INITIAL);
  const [activeTab,    setActiveTab]    = useState('all');
  const [query,        setQuery]        = useState('');
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [timeFilter,   setTimeFilter]   = useState('all');
  const [customRange,  setCustomRange]  = useState({ from:'', to:'' });

  useEffect(() => {
    fetch(`${API_BASE}/rendez-vous`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { if (data.success) setAppts((data.data || []).map(normalizeRdv)); })
      .catch(err => console.error('[AppointmentsPage] chargement RDVs :', err.message));
  }, []);

  const isDirection = isAdmin || isDirecteur || isAssistant || DIRECTION_ROLES.includes(user?.role);
  const peutAgir    = isAdmin || isAssistant || isDirection;

  const visible = useMemo(() =>
    appts.filter(a => !(a.visibility === 'direction' && !isDirection)),
  [appts, isDirection]);

  const counts = useMemo(() => ({
    all:       visible.length,
    pending:   visible.filter(a => a.status === 'pending').length,
    confirmed: visible.filter(a => a.status === 'confirmed').length,
    cancelled: visible.filter(a => a.status === 'cancelled').length,
  }), [visible]);

  const tabFiltered  = useMemo(() => activeTab === 'all' ? visible : visible.filter(a => a.status === activeTab), [visible, activeTab]);
  const timeFiltered = useTimeFilter(tabFiltered, timeFilter, customRange);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return timeFiltered.filter(a => {
      const contact = formatContactLabel(a) || '';
      const matchQ  = !q || (a.title + ' ' + contact + ' ' + (a.location||'')).toLowerCase().includes(q);
      const matchT  = typeFilter === 'all' || a.type === typeFilter;
      return matchQ && matchT;
    });
  }, [timeFiltered, query, typeFilter]);

  const insights = useInsights(filtered);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(a => { (map[a.date] = map[a.date] || []).push(a); });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const handleCreate = useCallback(async () => {
    if (!form.title || !form.date) { addToast('Titre et date requis.', 'error'); return; }
    try {
      const response = await createRdv(form);
      if (response?.data) setAppts(prev => [...prev, normalizeRdv(response.data)]);
      const rappelStr = (form.rappels || []).sort((a, b) => a - b).map(rappelLabel).join(', ');
      addToast(`RDV créé${rappelStr ? ` · 🔔 ${rappelStr}` : ''}`, 'success');
      setCreateModal(false);
      setForm(FORM_INITIAL);
    } catch (err) {
      addToast(err.message || 'Erreur lors de la création.', 'error');
    }
  }, [form, createRdv, addToast]);

  const handleConfirm = useCallback(async (id) => {
    try {
      await fetch(`${API_BASE}/rendez-vous/${id}/statut`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ rdv_statut: 'confirme' }),
      });
      setAppts(prev => prev.map(a => a.id === id ? { ...a, status:'confirmed' } : a));
      // Mettre à jour detailAppt si c'est le même RDV
      setDetailAppt(prev => prev?.id === id ? { ...prev, status:'confirmed' } : prev);
      addToast('Rendez-vous confirmé !', 'success');
    } catch {
      addToast('Erreur lors de la confirmation.', 'error');
    }
  }, [addToast]);

  const handleCancel = useCallback(async (id, reason) => {
    try {
      await fetch(`${API_BASE}/rendez-vous/${id}/annuler`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ raison: reason || null }),
      });
      setAppts(prev => prev.map(a =>
        a.id === id ? { ...a, status:'cancelled', cancelReason: reason || undefined } : a
      ));
      addToast('Rendez-vous annulé.', 'warning');
    } catch {
      addToast("Erreur lors de l'annulation.", 'error');
    } finally {
      setCancelTarget(null);
    }
  }, [addToast]);

  const hasFilters = !!query || typeFilter !== 'all' || timeFilter !== 'all';

  /* ── Render ── */
  return (
    <div className="xm-page xm-enter" style={{ padding:'0 2px', maxWidth:'100%', overflowX:'hidden' }}>

      <div className="xm-header" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:24, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:T.t1, letterSpacing:'-.6px', marginBottom:4, fontFamily:'var(--font-sans)' }}>Rendez-vous</h1>
          <p style={{ fontSize:13, color:T.t3, fontFamily:'var(--font-sans)', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><Ic.clk />{insights.durationLabel} de RDV</span>
            {timeFilter !== 'all' && <span style={{ color:T.t3, opacity:.6 }}>· {filtered.length} sur la période</span>}
          </p>
        </div>
        <PrimaryBtn onClick={() => setCreateModal(true)}><Ic.plus /> Nouveau RDV</PrimaryBtn>
      </div>

      <StatsRow insights={insights} />
      <TabBar active={activeTab} setActive={setActiveTab} counts={counts} />
      <FiltersBar
        query={query} setQuery={setQuery}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        timeFilter={timeFilter} setTimeFilter={setTimeFilter}
        customRange={customRange} setCustomRange={setCustomRange}
        activeCount={filtered.length}
      />

      {filtered.length === 0
        ? <EmptyState hasFilters={hasFilters} />
        : (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            {grouped.map(([date, items]) => (
              <div key={date}>
                <DateDivider date={date} />
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {items.map((a, i) => (
                    <ApptCard
                      key={a.id}
                      a={a}
                      index={i}
                      peutAgir={peutAgir}
                      isNext={insights.next?.id === a.id}
                      onConfirm={() => handleConfirm(a.id)}
                      onCancel={() => setCancelTarget(a)}
                      onClick={() => setDetailAppt(a)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* ── Modal Détail RDV ── */}
      <AppointmentDetailModal
        open={!!detailAppt}
        appt={detailAppt
          ? { ...detailAppt, isNext: insights.next?.id === detailAppt?.id }
          : null
        }
        onClose={() => setDetailAppt(null)}
        onConfirm={(id) => {
          handleConfirm(id);
          setDetailAppt(null);
        }}
        onCancel={(appt) => {
          setDetailAppt(null);
          setCancelTarget(appt);
        }}
      />

      {/* ── Modal Création RDV ── */}
      {ReactDOM.createPortal(
        <Modal
          open={createModal}
          onClose={() => { if (!creating) { setCreateModal(false); setForm(FORM_INITIAL); } }}
          title="Nouveau rendez-vous"
          width={700}
        >
          {createModal && (
            <AppointmentForm
              form={form} setForm={setForm}
              onSubmit={handleCreate}
              onCancel={() => { setCreateModal(false); setForm(FORM_INITIAL); }}
              loading={creating}
            />
          )}
        </Modal>,
        document.body
      )}

      {/* ── Modal Annulation ── */}
      <CancelModal
        open={!!cancelTarget} appt={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={reason => handleCancel(cancelTarget?.id, reason)}
      />

    </div>
  );
}