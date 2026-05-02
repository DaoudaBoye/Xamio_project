/**
 * Xamio — AppointmentsPage v2
 * Design: inspiré de MeetingsPage (Linear × Arc)
 * Alignement total : tokens, patterns, composants, animations
 */

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

/* ════════════════════════════════════════════════════════════════
   GLOBAL CSS — identique MeetingsPage
   ════════════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  .xm-page   { font-family: var(--font-sans); }
  .xm-mono   { font-family: var(--font-mono); }
  .xm-grid-list {
    display: grid; gap: 10px;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
  }
  @media (max-width: 700px) {
    .xm-grid-list    { grid-template-columns: 1fr !important; }
    .xm-filters-row  { flex-direction: column; align-items: stretch !important; }
    .xm-stats-row    { grid-template-columns: repeat(2, 1fr) !important; }
    .xm-header-row   { flex-direction: column; align-items: flex-start !important; }
  }
  @keyframes xm-fade-up   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
  @keyframes xm-scale-in  { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
  @keyframes xm-bar       { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  @keyframes xm-pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.7)} }
  @keyframes xm-menu-pop  { from{opacity:0;transform:scale(.96) translateY(-4px)} to{opacity:1;transform:none} }
  @keyframes xm-modal-bg  { from{opacity:0} to{opacity:1} }
  @keyframes xm-modal-box { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:none} }
  .xm-card-enter { animation: xm-fade-up .32s cubic-bezier(.22,1,.36,1) both; }
  .xm-page-enter { animation: xm-fade-up .28s cubic-bezier(.22,1,.36,1); }
  .xm-scrollbar::-webkit-scrollbar          { width: 5px; height: 5px; }
  .xm-scrollbar::-webkit-scrollbar-track    { background: transparent; }
  .xm-scrollbar::-webkit-scrollbar-thumb    { background: var(--color-background-hover); border-radius: 99px; }
  .xm-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-text-muted); }
`;

function useGlobalStyle() {
  useEffect(() => {
    const id = 'xm-global-style';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = GLOBAL_CSS;
      document.head.appendChild(s);
    }
  }, []);
}

/* ════════════════════════════════════════════════════════════════
   TOKENS — identiques MeetingsPage
   ════════════════════════════════════════════════════════════════ */
const T = {
  bg0:'transparent', bg1:'var(--color-background-secondary)',
  bg2:'var(--color-background-tertiary)', bg3:'var(--color-background-elevated)',
  bd0:'var(--color-border)', bd1:'var(--color-border-medium)', bd2:'var(--color-border-strong)',
  t1:'var(--color-text-primary)', t2:'var(--color-text-secondary)', t3:'var(--color-text-muted)',
  acc:  '#E8500A',
  acc2: '#C94108',
  accm: 'rgba(232, 80, 10, 0.08)',
  accb: 'rgba(232, 80, 10, 0.22)',

  status: {
    pending:   { label:'En attente', fg:'var(--color-warning)', bg:'var(--color-warning-bg)', dot:'var(--color-warning)', border:'var(--color-warning-border)' },
    confirmed: { label:'Confirmé',   fg:'var(--color-success)', bg:'var(--color-success-bg)', dot:'var(--color-success)', border:'var(--color-success-border)' },
    cancelled: { label:'Annulé',     fg:'var(--color-danger)',  bg:'var(--color-danger-bg)',  dot:'var(--color-danger)',  border:'var(--color-danger-border)'  },
  },

  r6:'var(--radius-medium)', r8:'var(--radius-large)', r10:'10px',
  r12:'var(--radius-xlarge)', r14:'14px', r16:'16px', r20:'20px', r24:'24px',
  shadowDropdown:'var(--shadow-dropdown)', shadowModal:'var(--shadow-modal)',
};

/* ════════════════════════════════════════════════════════════════
   CONSTANTES
   ════════════════════════════════════════════════════════════════ */
const DIRECTION_ROLES = ['Directeur', 'Assistant'];

const TYPE_META = {
  demo:        { label:'Démo',          colorKey:'accent'   },
  partnership:  { label:'Partenariat',   colorKey:'purple'   },
  investment:   { label:'Investissement',colorKey:'warning'  },
  commercial:   { label:'Commercial',    colorKey:'success'  },
  hr:           { label:'RH',            colorKey:'danger'   },
};

const TYPE_COLOR = {
  accent:  { bg:'var(--color-accent-bg)',  border:'var(--color-accent-border)',  fg:'var(--color-accent)'  },
  purple:  { bg:'var(--color-purple-bg)',  border:'var(--color-purple-border)',  fg:'var(--color-purple)'  },
  warning: { bg:'var(--color-warning-bg)', border:'var(--color-warning-border)', fg:'var(--color-warning)' },
  success: { bg:'var(--color-success-bg)', border:'var(--color-success-border)', fg:'var(--color-success)' },
  danger:  { bg:'var(--color-danger-bg)',  border:'var(--color-danger-border)',  fg:'var(--color-danger)'  },
};

const STAT_CONFIG = [
  { key:'pending',   label:'En attente', dot:'var(--color-warning)' },
  { key:'confirmed', label:'Confirmés',  dot:'var(--color-success)' },
  { key:'cancelled', label:'Annulés',    dot:'var(--color-danger)'  },
];

const TIME_FILTERS = [
  { v:'all',    l:'Toutes les périodes' },
  { v:'today',  l:"Aujourd'hui"         },
  { v:'week',   l:'Cette semaine'       },
  { v:'month',  l:'Ce mois'             },
  { v:'custom', l:'Personnalisé'        },
];

const TYPE_FILTERS = [
  { v:'all',         l:'Tous les types'     },
  { v:'demo',        l:'Démo'               },
  { v:'partnership', l:'Partenariat'        },
  { v:'investment',  l:'Investissement'     },
  { v:'commercial',  l:'Commercial'         },
  { v:'hr',          l:'RH'                 },
];

const STATUS_FILTERS = [
  { v:'all',       l:'Tous les statuts' },
  { v:'pending',   l:'En attente'       },
  { v:'confirmed', l:'Confirmés'        },
  { v:'cancelled', l:'Annulés'          },
];

const API_BASE = process.env.REACT_APP_API_URL || '/api';

/* ════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════ */
function authHeaders() {
  const token = localStorage.getItem('xamio_token');
  return {
    'Content-Type':  'application/json',
    'Accept':        'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

function toDate(s) { return s ? new Date(s) : null; }
function startOfWeek(d)  { const r=new Date(d); const dy=r.getDay()||7; r.setDate(r.getDate()-dy+1); r.setHours(0,0,0,0); return r; }
function endOfWeek(d)    { const r=startOfWeek(d); r.setDate(r.getDate()+6); r.setHours(23,59,59,999); return r; }
function startOfMonth(d) { return new Date(d.getFullYear(),d.getMonth(),1); }
function endOfMonth(d)   { return new Date(d.getFullYear(),d.getMonth()+1,0,23,59,59,999); }

function formatDate(str) {
  if (!str) return '—';
  const [y,m,d] = str.split('-');
  return `${d}/${m}/${y}`;
}
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
function hashColor(str='') {
  let h=0; for(let i=0;i<str.length;i++) h=(h*31+str.charCodeAt(i))&0xffffffff;
  return ['#2E70D9','#E07B2A','#3D9A6F','#7B60C8','#B0443A','#2A8FA8','#C85070','#4A8C4A'][Math.abs(h)%8];
}
function initials(name='') { return name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase(); }

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
    cancelReason:   r.raison_annulation ?? undefined,
  };
}

/* ════════════════════════════════════════════════════════════════
   MICRO-HOOKS
   ════════════════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════════════════
   CUSTOM HOOKS
   ════════════════════════════════════════════════════════════════ */
function useInsights(appts) {
  return useMemo(() => {
    const total = appts.length;
    const totalMins = appts.reduce((s,a) => s+(parseInt(a.duration)||0), 0);
    const h = Math.floor(totalMins/60), m = totalMins%60;
    const durationLabel = totalMins===0 ? '0 min'
      : h>0 ? `${h}h${m>0?` ${m}min`:''}` : `${m} min`;
    const byStatus = Object.keys(T.status).reduce((acc,k) => {
      acc[k] = appts.filter(a=>a.status===k).length; return acc;
    }, {});
    const next = appts
      .filter(a => a.status==='pending')
      .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time))[0] || null;
    return { total, durationLabel, byStatus, next };
  }, [appts]);
}

function useTimeFilter(appts, timeFilter, customRange) {
  return useMemo(() => {
    if (timeFilter==='all') return appts;
    const now=new Date(); let lo, hi;
    if (timeFilter==='today') { lo=new Date(now); lo.setHours(0,0,0,0); hi=new Date(now); hi.setHours(23,59,59,999); }
    if (timeFilter==='week')  { lo=startOfWeek(now); hi=endOfWeek(now); }
    if (timeFilter==='month') { lo=startOfMonth(now); hi=endOfMonth(now); }
    if (timeFilter==='custom') { lo=customRange.from?new Date(customRange.from):null; hi=customRange.to?new Date(customRange.to):null; }
    return appts.filter(a => {
      const d=toDate(a.date); if(!d) return false;
      if (lo && d<lo) return false;
      if (hi && d>hi) return false;
      return true;
    });
  }, [appts, timeFilter, customRange]);
}

/* ════════════════════════════════════════════════════════════════
   ICÔNES SVG — même style que MeetingsPage
   ════════════════════════════════════════════════════════════════ */
const Ic = {
  plus:      ()=><svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  dots:      ()=><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="1.4" fill="currentColor"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/><circle cx="13" cy="8" r="1.4" fill="currentColor"/></svg>,
  cal:       ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  clk:       ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  loc:       ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a4.5 4.5 0 014.5 4.5c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 018 1.5z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  lock:      ()=><svg width="10" height="10" viewBox="0 0 16 16" fill="none"><rect x="3" y="7.5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 7.5V5a2.5 2.5 0 015 0v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  check:     ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trash:     ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M5 5l.5 8h5L11 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  warn:      ()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2L14.5 13H1.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  search:    ()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  close:     ()=><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  chevDown:  ()=><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevRight: ()=><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  lightning: ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M9 1L3 9h5l-1 6 6-8H8l1-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  user:      ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  users:     ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="11.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M13.5 13c0-2-.9-3.76-2.26-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  bell:      ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1.5A4.5 4.5 0 003.5 6v3.5L2 11h12l-1.5-1.5V6A4.5 4.5 0 008 1.5z" stroke="currentColor" strokeWidth="1.4"/><path d="M6.5 13a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  tag:       ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M2 2h6l6 6-6 6-6-6V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="5.5" cy="5.5" r="1" fill="currentColor"/></svg>,
  building:  ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.4"/><path d="M5 14V9h6v5M5 6h1M10 6h1M5 9h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  filter:    ()=><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M4 8h8M6 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
};

/* ════════════════════════════════════════════════════════════════
   ATOMES — copie exacte des patterns MeetingsPage
   ════════════════════════════════════════════════════════════════ */
function IconBtn({ children, onClick, active, danger, title, size=28 }) {
  const [h,hp] = useHover();
  return <button onClick={onClick} title={title} {...hp} style={{width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center',background:active?T.bg3:h?T.bg2:'transparent',border:`1px solid ${active||h?T.bd1:'transparent'}`,borderRadius:T.r6,cursor:'pointer',flexShrink:0,color:danger&&h?'var(--color-danger)':active?T.t1:h?T.t2:T.t3,transition:'all .13s'}}>{children}</button>;
}

function Avatar({ name='', size=22 }) {
  const color=hashColor(name); const bg=color+'22';
  return <span style={{width:size,height:size,borderRadius:'50%',background:bg,border:`1.5px solid ${color}44`,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:size*0.38,fontWeight:700,color,flexShrink:0,lineHeight:1,fontFamily:'var(--font-sans)'}}>{initials(name)}</span>;
}

function Tag({ icon, children, color=T.t3, bg=T.bg3 }) {
  return <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:T.r20,background:bg,color,fontSize:11,fontWeight:500,border:`1px solid ${color}22`,whiteSpace:'nowrap'}}>{icon&&<span style={{lineHeight:0,opacity:.85}}>{icon}</span>}{children}</span>;
}

function StatusPill({ statusKey, compact=false }) {
  const c = T.status[statusKey] || T.status.pending;
  const isLive = statusKey==='pending';
  return <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:compact?'2px 7px':'3px 10px',borderRadius:T.r20,background:c.bg,fontSize:compact?10:11,fontWeight:500,color:c.fg,border:`1px solid ${c.border}`,whiteSpace:'nowrap'}}><span style={{width:5,height:5,borderRadius:'50%',background:c.dot,flexShrink:0,animation:isLive?'xm-pulse-dot 1.8s ease infinite':'none'}}/>{c.label}</span>;
}

function TypeBadge({ type }) {
  const m  = TYPE_META[type] || TYPE_META.demo;
  const co = TYPE_COLOR[m.colorKey] || TYPE_COLOR.accent;
  return <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:T.r20,background:co.bg,color:co.fg,fontSize:10,fontWeight:600,border:`1px solid ${co.border}`,whiteSpace:'nowrap',letterSpacing:'.02em'}}><span style={{lineHeight:0,opacity:.85}}><Ic.tag/></span>{m.label}</span>;
}

function Field({ as:As='input', style, ...props }) {
  const [f,sf] = useState(false);
  return <As {...props} style={{width:'100%',background:T.bg3,border:`1px solid ${f?T.bd2:T.bd0}`,borderRadius:T.r8,padding:As==='textarea'?'9px 13px':'0 13px',height:As==='textarea'?undefined:36,color:T.t1,fontSize:13,lineHeight:1.6,outline:'none',fontFamily:'var(--font-sans)',boxSizing:'border-box',transition:'border-color .15s, box-shadow .15s',boxShadow:f?`0 0 0 3px ${T.accm}`:'none',caretColor:'var(--color-warning)',...style}} onFocus={()=>sf(true)} onBlur={()=>sf(false)}/>;
}

function PrimaryBtn({ children, onClick, danger, small, disabled }) {
  const [h,hp] = useHover();
  const bg = danger?(h?'var(--color-danger)':'var(--color-danger)'):(h?T.acc2:T.acc);
  return <button onClick={onClick} disabled={disabled} {...hp} style={{display:'inline-flex',alignItems:'center',gap:6,padding:small?'6px 14px':'9px 18px',borderRadius:T.r8,border:'none',background:bg,color:'#FFFFFF',fontSize:small?12:13,fontWeight:700,cursor:disabled?'not-allowed':'pointer',opacity:disabled?.6:1,fontFamily:'var(--font-sans)',transition:'all .15s',boxShadow:h?`0 4px 20px ${T.acc}55`:`0 2px 8px ${T.acc}33`,transform:h&&!disabled?'translateY(-1px)':'none',whiteSpace:'nowrap'}}>{children}</button>;
}

function GhostBtn({ children, onClick, small }) {
  const [h,hp] = useHover();
  return <button onClick={onClick} {...hp} style={{padding:small?'5px 12px':'8px 16px',borderRadius:T.r8,border:`1px solid ${T.bd1}`,background:h?T.bg2:'transparent',fontSize:small?12:13,fontWeight:450,color:h?T.t1:T.t2,cursor:'pointer',fontFamily:'var(--font-sans)',transition:'all .15s',whiteSpace:'nowrap'}}>{children}</button>;
}

function FormLabel({ children, required, hint }) {
  return <label style={{display:'block',fontSize:12,fontWeight:500,color:T.t2,marginBottom:5}}>{children}{required&&<span style={{color:'var(--color-danger)',marginLeft:3}}>*</span>}{hint&&<span style={{color:T.t3,fontWeight:400,marginLeft:6,fontSize:11}}>{hint}</span>}</label>;
}

/* ════════════════════════════════════════════════════════════════
   DROPDOWN
   ════════════════════════════════════════════════════════════════ */
function Dropdown({ label, options, value, onChange, icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, useCallback(()=>setOpen(false),[]));
  const current = options.find(o=>o.v===value);
  const [h,hp] = useHover();
  return (
    <div ref={ref} style={{position:'relative',flexShrink:0}}>
      <button onClick={()=>setOpen(o=>!o)} {...hp} style={{display:'flex',alignItems:'center',gap:7,padding:'0 12px',height:34,borderRadius:T.r8,border:`1px solid ${open||h?T.bd2:T.bd0}`,background:open?T.bg2:h?T.bg2:T.bg1,color:T.t1,fontSize:12.5,fontWeight:500,cursor:'pointer',fontFamily:'var(--font-sans)',transition:'all .13s',whiteSpace:'nowrap'}}>
        {icon&&<span style={{color:T.t3,lineHeight:0}}>{icon}</span>}{current?.l||label}
        <span style={{color:T.t3,lineHeight:0,marginLeft:2,transform:open?'rotate(180deg)':'none',transition:'transform .15s'}}><Ic.chevDown/></span>
      </button>
      {open&&<div style={{position:'absolute',top:40,left:0,zIndex:300,background:T.bg2,border:`1px solid ${T.bd1}`,borderRadius:T.r10,padding:5,minWidth:200,boxShadow:T.shadowDropdown,animation:'xm-menu-pop .14s cubic-bezier(.22,1,.36,1)'}}>
        {options.map(o=>{const sel=o.v===value;return<DropItem key={o.v} label={o.l} selected={sel} onClick={()=>{onChange(o.v);setOpen(false);}}/>;})}</div>}
    </div>
  );
}

function DropItem({ label, selected, onClick }) {
  const [h,hp] = useHover();
  return <button onClick={onClick} {...hp} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:T.r6,border:'none',background:h?T.bg3:'transparent',color:selected?T.t1:T.t2,fontSize:12.5,fontWeight:selected?500:400,cursor:'pointer',fontFamily:'var(--font-sans)',textAlign:'left',transition:'all .1s'}}>{label}{selected&&<span style={{color:T.acc,lineHeight:0}}><Ic.check/></span>}</button>;
}

/* ════════════════════════════════════════════════════════════════
   ACTION MENU — même pattern que MeetingsPage
   ════════════════════════════════════════════════════════════════ */
function ActionMenu({ appt, onConfirm, onCancel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, useCallback(()=>setOpen(false),[]));

  if (appt.status==='cancelled') return null;

  const items = [];
  if (appt.status==='pending') {
    items.push({ icon:<Ic.check/>, label:'Confirmer le RDV', fn:onConfirm, accent:true });
  }
  items.push({ sep:true });
  items.push({ icon:<Ic.trash/>, label:'Annuler le RDV', fn:onCancel, danger:true });

  return (
    <div ref={ref} style={{position:'relative',flexShrink:0}} onClick={e=>e.stopPropagation()}>
      <IconBtn onClick={()=>setOpen(o=>!o)} active={open}><Ic.dots/></IconBtn>
      {open&&(
        <div style={{position:'absolute',right:0,top:34,zIndex:200,background:T.bg2,border:`1px solid ${T.bd1}`,borderRadius:T.r10,padding:5,minWidth:200,boxShadow:T.shadowDropdown,animation:'xm-menu-pop .14s cubic-bezier(.22,1,.36,1)'}}>
          {items.map((item,i)=>item.sep
            ?<div key={i} style={{height:1,background:T.bd0,margin:'4px 0'}}/>
            :<ActionItem key={i} {...item} onClick={()=>{setOpen(false);item.fn();}}/>
          )}
        </div>
      )}
    </div>
  );
}

function ActionItem({ icon, label, danger, accent, onClick }) {
  const [h,hp] = useHover();
  const color = danger?'var(--color-danger)':accent?T.acc:T.t2;
  return <button onClick={onClick} {...hp} style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'7px 10px',borderRadius:T.r6,border:'none',background:h?(danger?'rgba(240,112,112,.07)':T.bg3):'transparent',cursor:'pointer',fontSize:12.5,fontWeight:450,color,fontFamily:'var(--font-sans)',textAlign:'left',transition:'all .1s'}}><span style={{lineHeight:0,opacity:.85,flexShrink:0}}>{icon}</span>{label}</button>;
}

/* ════════════════════════════════════════════════════════════════
   MODAL — même que MeetingsPage
   ════════════════════════════════════════════════════════════════ */
function XModal({ open, onClose, title, width=520, children }) {
  useEffect(()=>{document.body.style.overflow=open?'hidden':'';return()=>{document.body.style.overflow='';};},[open]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,backdropFilter:'blur(6px)',animation:'xm-modal-bg .16s ease'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.bg1,border:`1px solid ${T.bd1}`,borderRadius:T.r16,width:'100%',maxWidth:width,maxHeight:'calc(100dvh - 32px)',display:'flex',flexDirection:'column',boxShadow:T.shadowModal,animation:'xm-modal-box .2s cubic-bezier(.22,1,.36,1)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:`1px solid ${T.bd0}`,flexShrink:0}}>
          <h2 style={{fontSize:14,fontWeight:600,color:T.t1,margin:0,fontFamily:'var(--font-sans)'}}>{title}</h2>
          <IconBtn onClick={onClose}><Ic.close/></IconBtn>
        </div>
        <div className="xm-scrollbar" style={{padding:20,overflowY:'auto',flex:1}}>{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onCancel, onConfirm, cancelLabel='Annuler', confirmLabel='Confirmer', danger=false }) {
  return <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:20,borderTop:`1px solid ${T.bd0}`,marginTop:4}}><GhostBtn onClick={onCancel}>{cancelLabel}</GhostBtn><PrimaryBtn onClick={onConfirm} danger={danger}>{confirmLabel}</PrimaryBtn></div>;
}

/* ════════════════════════════════════════════════════════════════
   STATS HEADER — même pattern que MeetingsPage
   ════════════════════════════════════════════════════════════════ */
function StatsHeader({ insights }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))',gap:10,marginBottom:24}} className="xm-stats-row">
      <StatCard
        value={insights.total}
        label="Période sélectionnée"
        accent={T.acc}
        sub={
          <><span style={{color:T.t3,fontSize:11}}><Ic.clk/></span>
          <span style={{color:T.t3,fontSize:11,marginLeft:5,fontFamily:'var(--font-mono)'}}>{insights.durationLabel}</span>
          <span style={{color:T.t3,fontSize:11,marginLeft:4}}>de RDV</span></>
        }
      />
      {STAT_CONFIG.map(({key,label,dot})=>{
        const n=insights.byStatus[key]||0;
        const pct=insights.total>0?Math.round(n/insights.total*100):0;
        return <StatCard key={key} value={n} label={label} accent={dot} pct={pct}/>;
      })}
    </div>
  );
}

function StatCard({ value, label, accent, pct, sub }) {
  const [h,hp] = useHover();
  return (
    <div {...hp} style={{background:T.bg1,border:`1px solid ${h?T.bd1:T.bd0}`,borderRadius:T.r12,padding:'14px 16px',transition:'border-color .15s, box-shadow .15s',boxShadow:h?T.shadowDropdown:'none'}}>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:10}}>
        <span style={{fontSize:26,fontWeight:700,color:T.t1,letterSpacing:'-1px',fontFamily:'var(--font-sans)',lineHeight:1}}>{value}</span>
        {pct!==undefined&&<span style={{fontSize:11,color:T.t3,fontFamily:'var(--font-mono)',marginBottom:2}}>{pct}%</span>}
      </div>
      {pct!==undefined&&<div style={{height:2,background:T.bg3,borderRadius:99,marginBottom:8,overflow:'hidden'}}><div style={{height:'100%',background:accent,borderRadius:99,width:`${pct}%`,transformOrigin:'left',animation:'xm-bar .7s cubic-bezier(.22,1,.36,1)'}}/></div>}
      <div style={{fontSize:11.5,color:T.t3,fontWeight:500,display:'flex',alignItems:'center',gap:5}}>
        {pct!==undefined&&<span style={{width:6,height:6,borderRadius:'50%',background:accent,flexShrink:0}}/>}{label}
      </div>
      {sub&&<div style={{marginTop:6,display:'flex',alignItems:'center'}}>{sub}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   NEXT APPOINTMENT BANNER — adapté du NextMeetingBanner
   ════════════════════════════════════════════════════════════════ */
function NextApptBanner({ appt, onClick }) {
  const [h,hp] = useHover();
  if (!appt) return null;
  return (
    <div {...hp} onClick={onClick} style={{marginBottom:20,padding:'12px 16px',borderRadius:T.r12,cursor:'pointer',background:T.bg1,border:`1px solid ${T.bd0}`,display:'flex',alignItems:'center',gap:14,transition:'all .15s',boxShadow:h?T.shadowDropdown:'none'}}>
      <div style={{width:36,height:36,borderRadius:T.r8,flexShrink:0,background:T.bg3,border:`1px solid ${T.bd1}`,display:'flex',alignItems:'center',justifyContent:'center',color:T.t2}}><Ic.cal/></div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
          <span style={{fontSize:10.5,fontWeight:700,color:T.t3,letterSpacing:'.08em',textTransform:'uppercase'}}>Prochain rendez-vous</span>
          <StatusPill statusKey={appt.status} compact/>
          <TypeBadge type={appt.type}/>
        </div>
        <div style={{fontSize:13,fontWeight:600,color:T.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{appt.title}</div>
        <div style={{display:'flex',gap:12,fontSize:11,color:T.t3,marginTop:3,fontFamily:'var(--font-mono)'}}><span>{formatDate(appt.date)}</span><span>{appt.time||'—'}</span>{appt.location&&<span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'var(--font-sans)'}}>{appt.location}</span>}</div>
      </div>
      <span style={{color:T.t3,lineHeight:0,flexShrink:0}}><Ic.chevRight/></span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   FILTERS BAR — même structure que MeetingsPage
   ════════════════════════════════════════════════════════════════ */
function FiltersBar({ query, setQuery, statusFilter, setStatusFilter, typeFilter, setTypeFilter, timeFilter, setTimeFilter, customRange, setCustomRange, activeCount }) {
  const [showCustom, setShowCustom] = useState(false);
  const handleTimeChange = v => { setTimeFilter(v); setShowCustom(v==='custom'); };
  const hasActive = statusFilter!=='all' || typeFilter!=='all' || timeFilter!=='all' || query!=='';

  return (
    <div style={{marginBottom:20}}>
      <div className="xm-filters-row" style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:'1 1 200px',minWidth:0}}>
          <span style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:T.t3,pointerEvents:'none',lineHeight:0}}><Ic.search/></span>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher par titre, contact, société…"
            style={{width:'100%',background:T.bg1,border:`1px solid ${T.bd0}`,borderRadius:T.r8,padding:'0 13px 0 35px',height:34,color:T.t1,fontSize:12.5,lineHeight:1.6,outline:'none',fontFamily:'var(--font-sans)',boxSizing:'border-box',transition:'border-color .13s, box-shadow .13s',caretColor:'var(--color-warning)'}}
            onFocus={e=>{e.target.style.borderColor=T.bd2;e.target.style.boxShadow=`0 0 0 3px ${T.accm}`;}}
            onBlur={e=>{e.target.style.borderColor=T.bd0;e.target.style.boxShadow='none';}}/>
          {query&&<button onClick={()=>setQuery('')} style={{position:'absolute',right:9,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:T.t3,lineHeight:0,padding:2}}><Ic.close/></button>}
        </div>
        <Dropdown label="Statut" icon={<Ic.filter/>} options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter}/>
        <Dropdown label="Type"   icon={<Ic.tag/>}    options={TYPE_FILTERS}   value={typeFilter}   onChange={setTypeFilter}/>
        <Dropdown label="Période" icon={<Ic.cal/>}   options={TIME_FILTERS}   value={timeFilter}   onChange={handleTimeChange}/>
        {hasActive&&<button onClick={()=>{setQuery('');setStatusFilter('all');setTypeFilter('all');setTimeFilter('all');setShowCustom(false);}} style={{display:'flex',alignItems:'center',gap:5,padding:'0 10px',height:34,borderRadius:T.r8,border:`1px solid ${T.bd0}`,background:'transparent',color:T.t3,fontSize:12,cursor:'pointer',fontFamily:'var(--font-sans)',transition:'all .13s',whiteSpace:'nowrap'}} onMouseEnter={e=>{e.currentTarget.style.color=T.t1;e.currentTarget.style.borderColor=T.bd1;}} onMouseLeave={e=>{e.currentTarget.style.color=T.t3;e.currentTarget.style.borderColor=T.bd0;}}><Ic.close/> Réinitialiser</button>}
      </div>
      {showCustom&&<div style={{marginTop:8,display:'flex',gap:10,alignItems:'center',padding:'10px 14px',background:T.bg1,borderRadius:T.r8,border:`1px solid ${T.bd0}`,animation:'xm-fade-up .15s ease'}}><span style={{fontSize:12,color:T.t3,flexShrink:0}}>Du</span><Field type="date" value={customRange.from} onChange={e=>setCustomRange(r=>({...r,from:e.target.value}))} style={{maxWidth:150,height:32,fontSize:12}}/><span style={{fontSize:12,color:T.t3,flexShrink:0}}>au</span><Field type="date" value={customRange.to} onChange={e=>setCustomRange(r=>({...r,to:e.target.value}))} style={{maxWidth:150,height:32,fontSize:12}}/></div>}
      {(statusFilter!=='all'||typeFilter!=='all'||timeFilter!=='all')&&<div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
        {statusFilter!=='all'&&<ActiveChip label={STATUS_FILTERS.find(f=>f.v===statusFilter)?.l} onRemove={()=>setStatusFilter('all')}/>}
        {typeFilter!=='all'&&<ActiveChip label={TYPE_FILTERS.find(f=>f.v===typeFilter)?.l} onRemove={()=>setTypeFilter('all')}/>}
        {timeFilter!=='all'&&<ActiveChip label={TIME_FILTERS.find(f=>f.v===timeFilter)?.l} onRemove={()=>{setTimeFilter('all');setShowCustom(false);}}/>}
        <span style={{fontSize:11,color:T.t3,display:'flex',alignItems:'center',marginLeft:2}}>{activeCount} résultat{activeCount!==1?'s':''}</span>
      </div>}
    </div>
  );
}

function ActiveChip({ label, onRemove }) {
  return <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'2px 8px 2px 10px',borderRadius:T.r20,background:T.accm,border:`1px solid ${T.accb}`,fontSize:11,fontWeight:500,color:T.acc}}>{label}<button onClick={onRemove} style={{background:'none',border:'none',cursor:'pointer',color:T.acc,lineHeight:0,padding:1,opacity:.7,transition:'opacity .1s'}} onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='.7'}><Ic.close/></button></span>;
}

/* ════════════════════════════════════════════════════════════════
   DATE DIVIDER
   ════════════════════════════════════════════════════════════════ */
function DateDivider({ date }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,marginTop:4}}>
      <span style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',color:T.t3,fontFamily:'var(--font-mono)',whiteSpace:'nowrap'}}>
        {formatDateLong(date)}
      </span>
      <div style={{flex:1,height:'1px',background:T.bd0}}/>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   APPOINTMENT CARD — même structure que MeetingCard
   ════════════════════════════════════════════════════════════════ */
const ApptCard = memo(function ApptCard({ a, index, peutAgir, isNext, onConfirm, onCancel, onClick }) {
  const [h,hp] = useHover();
  const isCancelled = a.status==='cancelled';
  const contact = formatContactLabel(a);
  const rappels = a.rappels?.length || 0;
  const participantCount = a.participants?.length || 0;
  const typeMeta = TYPE_META[a.type] || TYPE_META.demo;
  const typeColor = TYPE_COLOR[typeMeta.colorKey] || TYPE_COLOR.accent;

  const borderColor = isNext&&!isCancelled?T.acc:h&&!isCancelled?T.bd2:isCancelled?'rgba(240,112,112,.15)':T.bd0;

  return (
    <article
      className="xm-card-enter"
      {...(isCancelled?{}:hp)}
      onClick={isCancelled?undefined:onClick}
      style={{
        background:h&&!isCancelled?T.bg2:T.bg1,
        border:`1px solid ${borderColor}`,
        borderRadius:T.r12,padding:'15px 16px',
        cursor:isCancelled?'default':'pointer',
        opacity:isCancelled?.55:1,
        position:'relative',overflow:'hidden',
        transition:'border-color .18s, box-shadow .18s, background .18s',
        boxShadow:isNext&&!isCancelled?`0 0 0 1px ${T.acc}33, 0 4px 20px ${T.accm}`:h&&!isCancelled?T.shadowDropdown:'none',
        animationDelay:`${index*35}ms`,minWidth:0,
      }}
    >
      {/* Barre latérale "prochain" */}
      {isNext&&!isCancelled&&<div style={{position:'absolute',left:0,top:0,width:2,height:'100%',background:T.acc,borderRadius:'0 1px 1px 0'}}/>}

      {/* Header : titre + statut + actions */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:10}}>
        <div style={{flex:1,minWidth:0}}>
          {/* Indicateur prochain */}
          {isNext&&!isCancelled&&(
            <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:6}}>
              <span style={{fontSize:10,fontWeight:700,color:T.acc,letterSpacing:'.08em',textTransform:'uppercase',display:'flex',alignItems:'center',gap:4}}><Ic.lightning/> Prochain RDV</span>
            </div>
          )}
          <h3 style={{fontSize:13.5,fontWeight:600,lineHeight:1.4,marginBottom:8,color:isCancelled?T.t3:T.t1,textDecoration:isCancelled?'line-through':'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'var(--font-sans)'}}>{a.title||'—'}</h3>
          <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
            <StatusPill statusKey={a.status} compact/>
            <TypeBadge type={a.type}/>
            {a.visibility==='direction'&&<Tag icon={<Ic.lock/>} color="var(--color-accent)" bg="var(--color-accent-bg)">Privé</Tag>}
          </div>
        </div>
        {peutAgir&&<ActionMenu appt={a} onConfirm={onConfirm} onCancel={onCancel}/>}
      </div>

      {/* Méta : date, heure, lieu */}
      <div style={{display:'flex',gap:10,fontSize:11,color:T.t3,flexWrap:'wrap',alignItems:'center',fontFamily:'var(--font-mono)'}}>
        <MetaItem icon={<Ic.cal/>}>{formatDate(a.date)}</MetaItem>
        <MetaItem icon={<Ic.clk/>}>{a.time||'—'}{a.duration&&<span style={{opacity:.6,fontFamily:'var(--font-sans)'}}> · {a.duration}min</span>}</MetaItem>
        {a.location&&<MetaItem icon={<Ic.loc/>} style={{fontFamily:'var(--font-sans)',flex:'1 1 0',minWidth:0}}><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}}>{a.location}</span></MetaItem>}
      </div>

      {/* Contact + participants */}
      {(contact||participantCount>0||rappels>0)&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:10,paddingTop:10,borderTop:`1px solid ${T.bd0}`}}>
          <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
            {contact&&(
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:18,height:18,borderRadius:'50%',background:typeColor.bg,border:`1px solid ${typeColor.border}`,display:'flex',alignItems:'center',justifyContent:'center',color:typeColor.fg,flexShrink:0}}><span style={{lineHeight:0,transform:'scale(.75)'}}>{a.contactType==='entreprise'?<Ic.building/>:<Ic.user/>}</span></div>
                <span style={{fontSize:11,color:T.t3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{contact}</span>
              </div>
            )}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,color:T.t3,fontSize:11,flexShrink:0}}>
            {rappels>0&&<MetaItem icon={<Ic.bell/>}>{rappels}</MetaItem>}
            {participantCount>0&&<MetaItem icon={<Ic.users/>}>{participantCount}</MetaItem>}
          </div>
        </div>
      )}

      {/* Description */}
      {a.description&&!isCancelled&&(
        <p style={{fontSize:11.5,color:T.t3,marginTop:8,lineHeight:1.6,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{a.description}</p>
      )}

      {/* Raison annulation */}
      {isCancelled&&a.cancelReason&&(
        <div style={{marginTop:10,padding:'7px 10px',borderRadius:T.r8,background:'rgba(240,112,112,.07)',border:'1px solid rgba(240,112,112,.18)'}}>
          <p style={{fontSize:11.5,fontWeight:600,color:'var(--color-danger)',margin:'0 0 2px',display:'flex',alignItems:'center',gap:6}}><Ic.warn/> RDV annulé</p>
          <p style={{fontSize:11,color:T.t3,margin:0}}>{a.cancelReason}</p>
        </div>
      )}
    </article>
  );
});

function MetaItem({ icon, children, style }) {
  return <span style={{display:'flex',alignItems:'center',gap:4,...style}}><span style={{lineHeight:0,opacity:.6,flexShrink:0}}>{icon}</span>{children}</span>;
}

/* ════════════════════════════════════════════════════════════════
   EMPTY STATE — même que MeetingsPage
   ════════════════════════════════════════════════════════════════ */
function EmptyState({ hasQuery }) {
  return (
    <div style={{textAlign:'center',padding:'72px 24px',background:T.bg1,borderRadius:T.r16,border:`1px solid ${T.bd0}`}}>
      <div style={{width:52,height:52,borderRadius:14,background:T.accm,border:`1px solid ${T.accb}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px'}}>
        <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
          <rect x="1" y="4" width="20" height="16" rx="2.5" stroke={T.acc} strokeWidth="1.6"/>
          <path d="M7 1v4M15 1v4M1 10h20" stroke={T.acc} strokeWidth="1.6" strokeLinecap="round"/>
          <circle cx="7" cy="15" r="1.5" fill={T.acc}/>
          <circle cx="11" cy="15" r="1.5" fill={T.acc}/>
          <circle cx="15" cy="15" r="1.5" fill={T.acc}/>
        </svg>
      </div>
      <p style={{fontSize:14,fontWeight:600,color:T.t1,marginBottom:6,fontFamily:'var(--font-sans)'}}>{hasQuery?'Aucun résultat':'Aucun rendez-vous'}</p>
      <p style={{fontSize:13,color:T.t3,maxWidth:300,margin:'0 auto',lineHeight:1.7}}>{hasQuery?'Modifiez vos filtres ou votre recherche.':'Planifiez votre premier rendez-vous.'}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CANCEL MODAL — même pattern que MeetingsPage
   ════════════════════════════════════════════════════════════════ */
function CancelModal({ open, onClose, appt, onConfirm }) {
  const [reason, setReason] = useState('');
  useEffect(()=>{ if(open) setReason(''); },[open]);
  if (!open||!appt) return null;
  return ReactDOM.createPortal(
    <XModal open={open} onClose={onClose} title="Annuler le rendez-vous" width={460}>
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div style={{padding:'12px 14px',background:'rgba(240,112,112,.07)',border:'1px solid rgba(240,112,112,.18)',borderRadius:T.r10}}>
          <p style={{fontSize:13,fontWeight:600,color:'var(--color-danger)',marginBottom:5,display:'flex',alignItems:'center',gap:8,fontFamily:'var(--font-sans)'}}><Ic.warn/>{appt.title}</p>
          <p style={{fontSize:12,color:T.t3,lineHeight:1.6,margin:0}}>Le rendez-vous sera marqué comme annulé.</p>
        </div>
        <div><FormLabel>Motif d'annulation</FormLabel><Field as="textarea" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Raison (facultatif)…" rows={3} style={{resize:'vertical',lineHeight:1.6}}/></div>
        <ModalFooter onCancel={onClose} onConfirm={()=>onConfirm(reason)} cancelLabel="Conserver" confirmLabel="Annuler le RDV" danger/>
      </div>
    </XModal>,
    document.body
  );
}

/* ════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ════════════════════════════════════════════════════════════════ */
export default function AppointmentsPage() {
  useGlobalStyle();
  const { addToast }                              = useNotif();
  const { user }                                  = useAuth();
  const { isAdmin, isAssistant, isDirecteur }     = usePermissions();
  const { create: createRdv, loading: creating }  = useRdvCreate();

  const [appts,        setAppts]        = useState([]);
  const [createModal,  setCreateModal]  = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [detailAppt,   setDetailAppt]   = useState(null);
  const [form,         setForm]         = useState(FORM_INITIAL);

  const [query,        setQuery]        = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [timeFilter,   setTimeFilter]   = useState('all');
  const [customRange,  setCustomRange]  = useState({ from:'', to:'' });

  /* ── Chargement ── */
  useEffect(() => {
    fetch(`${API_BASE}/rendez-vous`, { headers: authHeaders() })
      .then(r=>r.json())
      .then(data=>{ if(data.success) setAppts((data.data||[]).map(normalizeRdv)); })
      .catch(err=>console.error('[AppointmentsPage]', err.message));
  }, []);

  /* ── Permissions ── */
  const isDirection = isAdmin || isDirecteur || isAssistant || DIRECTION_ROLES.includes(user?.role);
  const peutAgir    = isAdmin || isAssistant || isDirection;

  /* ── Visibilité ── */
  const visible = useMemo(()=>
    appts.filter(a => !(a.visibility==='direction' && !isDirection)),
  [appts, isDirection]);

  /* ── Tri identique MeetingsPage : pending → confirmed → cancelled ── */
  const sorted = useMemo(() => {
    const ORDER = { pending:0, confirmed:1, cancelled:2 };
    return [...visible].sort((a,b) => {
      const oa=ORDER[a.status]??2, ob=ORDER[b.status]??2;
      if (oa!==ob) return oa-ob;
      return (a.date+a.time).localeCompare(b.date+b.time);
    });
  }, [visible]);

  const timeFiltered = useTimeFilter(sorted, timeFilter, customRange);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return timeFiltered.filter(a => {
      const contact = formatContactLabel(a)||'';
      const matchQ = !q || (a.title+' '+contact+' '+(a.location||'')).toLowerCase().includes(q);
      const matchS = statusFilter==='all' || a.status===statusFilter;
      const matchT = typeFilter==='all'   || a.type===typeFilter;
      return matchQ && matchS && matchT;
    });
  }, [timeFiltered, query, statusFilter, typeFilter]);

  const insights = useInsights(filtered);



  /* ── Handlers ── */
  const handleCreate = useCallback(async () => {
    if (!form.title||!form.date) { addToast('Titre et date requis.','error'); return; }
    try {
      const response = await createRdv(form);
      if (response?.data) setAppts(prev=>[...prev, normalizeRdv(response.data)]);
      const rappelStr = (form.rappels||[]).sort((a,b)=>a-b).map(rappelLabel).join(', ');
      addToast(`RDV créé${rappelStr?` · 🔔 ${rappelStr}`:''}`, 'success');
      setCreateModal(false); setForm(FORM_INITIAL);
    } catch(err) { addToast(err.message||'Erreur lors de la création.','error'); }
  }, [form, createRdv, addToast]);

  const handleConfirm = useCallback(async (id) => {
    try {
      await fetch(`${API_BASE}/rendez-vous/${id}/statut`, {
        method:'PATCH', headers:authHeaders(),
        body: JSON.stringify({ rdv_statut:'confirme' }),
      });
      setAppts(prev=>prev.map(a=>a.id===id?{...a,status:'confirmed'}:a));
      setDetailAppt(prev=>prev?.id===id?{...prev,status:'confirmed'}:prev);
      addToast('Rendez-vous confirmé !','success');
    } catch { addToast('Erreur lors de la confirmation.','error'); }
  }, [addToast]);

  const handleCancel = useCallback(async (id, reason) => {
    try {
      await fetch(`${API_BASE}/rendez-vous/${id}/annuler`, {
        method:'PATCH', headers:authHeaders(),
        body: JSON.stringify({ raison: reason||null }),
      });
      setAppts(prev=>prev.map(a=>a.id===id?{...a,status:'cancelled',cancelReason:reason||undefined}:a));
      addToast('Rendez-vous annulé.','warning');
    } catch { addToast("Erreur lors de l'annulation.",'error'); }
    finally { setCancelTarget(null); }
  }, [addToast]);

  const hasFilters = !!query || statusFilter!=='all' || typeFilter!=='all' || timeFilter!=='all';

  /* ── Render ── */
  return (
    <div className="xm-page xm-page-enter" style={{padding:'0 2px',maxWidth:'100%',overflowX:'hidden'}}>

      {/* ── HEADER ── */}
      <div className="xm-header-row" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,marginBottom:24,flexWrap:'wrap'}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:T.t1,letterSpacing:'-.6px',marginBottom:4,fontFamily:'var(--font-sans)'}}>Rendez-vous</h1>
          <p style={{fontSize:13,color:T.t3,fontFamily:'var(--font-sans)'}}>
            {visible.length} rendez-vous au total{timeFilter!=='all'&&` · ${filtered.length} sur la période`}
          </p>
        </div>
        <PrimaryBtn onClick={()=>setCreateModal(true)}><Ic.plus/> Nouveau RDV</PrimaryBtn>
      </div>

      {/* ── STATS ── */}
      <StatsHeader insights={insights}/>

      {/* ── PROCHAIN RDV BANNER ── */}
      {insights.next&&<NextApptBanner appt={insights.next} onClick={()=>setDetailAppt(insights.next)}/>}

      {/* ── FILTRES ── */}
      <FiltersBar
        query={query} setQuery={setQuery}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        timeFilter={timeFilter} setTimeFilter={setTimeFilter}
        customRange={customRange} setCustomRange={setCustomRange}
        activeCount={filtered.length}
      />

      {/* ── LISTE ── */}
      {filtered.length===0
        ? <EmptyState hasQuery={hasFilters}/>
        : (
          <div className="xm-grid-list">
            {filtered.map((a,i)=>(
              <ApptCard
                key={a.id}
                a={a}
                index={i}
                peutAgir={peutAgir}
                isNext={insights.next?.id===a.id}
                onConfirm={()=>handleConfirm(a.id)}
                onCancel={()=>setCancelTarget(a)}
                onClick={()=>setDetailAppt(a)}
              />
            ))}
          </div>
        )
      }

      {/* ── MODAL DÉTAIL ── */}
      <AppointmentDetailModal
        open={!!detailAppt}
        appt={detailAppt?{...detailAppt,isNext:insights.next?.id===detailAppt?.id}:null}
        onClose={()=>setDetailAppt(null)}
        onConfirm={(id)=>{ handleConfirm(id); setDetailAppt(null); }}
        onCancel={(appt)=>{ setDetailAppt(null); setCancelTarget(appt); }}
      />

      {/* ── MODAL CRÉATION ── */}
      {ReactDOM.createPortal(
        <Modal
          open={createModal}
          onClose={()=>{ if(!creating){setCreateModal(false);setForm(FORM_INITIAL);} }}
          title="Nouveau rendez-vous"
          width={700}
        >
          {createModal&&(
            <AppointmentForm
              form={form} setForm={setForm}
              onSubmit={handleCreate}
              onCancel={()=>{setCreateModal(false);setForm(FORM_INITIAL);}}
              loading={creating}
            />
          )}
        </Modal>,
        document.body
      )}

      {/* ── MODAL ANNULATION ── */}
      <CancelModal
        open={!!cancelTarget}
        appt={cancelTarget}
        onClose={()=>setCancelTarget(null)}
        onConfirm={reason=>handleCancel(cancelTarget?.id, reason)}
      />
    </div>
  );
}