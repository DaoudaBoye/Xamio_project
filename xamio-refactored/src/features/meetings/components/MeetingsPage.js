/**
 * Xamio — MeetingsPage v2
 * Design: Refined Clarity (Linear × Arc)
 * Font: Inter + JetBrains Mono (via app.css)
 * Author: Generated for Xamio SaaS
 */

import React, {
  useState, useMemo, useRef, useEffect, useCallback, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetings } from '../../../context/MeetingsContext';
import { useNotif }    from '../../../context/NotifContext';
import { useAuth }     from '../../../context/AuthContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { CreateMeetingModal } from './CreateMeetingModal';

/* ════════════════════════════════════════════════════════════════
   GLOBAL CSS
   ════════════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  .xm-page   { font-family: var(--font-sans); }
  .xm-mono   { font-family: var(--font-mono); }
  .xm-grid-list {
    display: grid; gap: 10px;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
  }
  .xm-grid-cal { display: grid; gap: 10px; grid-template-columns: repeat(7, 1fr); }
  @media (max-width: 700px) {
    .xm-grid-list    { grid-template-columns: 1fr !important; }
    .xm-filters-row  { flex-direction: column; align-items: stretch !important; }
    .xm-stats-row    { grid-template-columns: repeat(2, 1fr) !important; }
    .xm-header-row   { flex-direction: column; align-items: flex-start !important; }
    .xm-cal-header   { display: none !important; }
    .xm-grid-cal     { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @keyframes xm-fade-up   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
  @keyframes xm-scale-in  { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
  @keyframes xm-slide-in  { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
  @keyframes xm-bar       { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  @keyframes xm-pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.7)} }
  @keyframes xm-menu-pop  { from{opacity:0;transform:scale(.96) translateY(-4px)} to{opacity:1;transform:none} }
  @keyframes xm-modal-bg  { from{opacity:0} to{opacity:1} }
  @keyframes xm-modal-box { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:none} }
  @keyframes xm-shimmer   { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
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

const T = {
  bg0:'transparent', bg1:'var(--color-background-secondary)',
  bg2:'var(--color-background-tertiary)', bg3:'var(--color-background-elevated)',
  bd0:'var(--color-border)', bd1:'var(--color-border-medium)', bd2:'var(--color-border-strong)',
  t1:'var(--color-text-primary)', t2:'var(--color-text-secondary)', t3:'var(--color-text-muted)',

  // ✅ Orange Xamio — identique au bouton Dashboard
  acc:  '#E8500A',
  acc2: '#C94108',                    // hover (-15% luminosité)
  accm: 'rgba(232, 80, 10, 0.08)',   // fond léger (focus, chips actifs)
  accb: 'rgba(232, 80, 10, 0.22)',   // bordure

  status: {
    planifiee: { label:'À venir',   fg:'var(--color-accent)',  bg:'var(--color-accent-bg)',  dot:'var(--color-accent)',  border:'var(--color-accent-border)'  },
    imminente: { label:'Imminente', fg:'var(--color-warning)', bg:'var(--color-warning-bg)', dot:'var(--color-warning)', border:'var(--color-warning-border)' },
    en_cours:  { label:'En cours',  fg:'var(--color-warning)', bg:'var(--color-warning-bg)', dot:'var(--color-warning)', border:'var(--color-warning-border)' },
    terminee:  { label:'Terminée',  fg:'var(--color-success)', bg:'var(--color-success-bg)', dot:'var(--color-success)', border:'var(--color-success-border)' },
    annulee:   { label:'Annulée',   fg:'var(--color-danger)',  bg:'var(--color-danger-bg)',  dot:'var(--color-danger)',  border:'var(--color-danger-border)'  },
    reportee:  { label:'Reportée',  fg:'var(--color-purple)',  bg:'var(--color-purple-bg)',  dot:'var(--color-purple)',  border:'var(--color-purple-border)'  },
  },
  r6:'var(--radius-medium)', r8:'var(--radius-large)', r10:'10px',
  r12:'var(--radius-xlarge)', r14:'14px', r16:'16px', r20:'20px', r24:'24px',
  shadowDropdown:'var(--shadow-dropdown)', shadowModal:'var(--shadow-modal)',
};

const DIRECTION_ROLES = ['Directeur', 'Assistant'];
const STATUS_FILTERS = [
  { v:'all', l:'Tous les statuts' }, { v:'planifiee', l:'À venir' },
  { v:'en_cours', l:'En cours' }, { v:'reportee', l:'Reportées' },
  { v:'terminee', l:'Terminées' }, { v:'annulee', l:'Annulées' },
];
const TIME_FILTERS = [
  { v:'all', l:'Toutes les périodes' }, { v:'today', l:"Aujourd'hui" },
  { v:'week', l:'Cette semaine' }, { v:'month', l:'Ce mois' }, { v:'custom', l:'Personnalisé' },
];
const STAT_CONFIG = [
  { key:'planifiee', label:'À venir',   dot:'var(--color-accent)' },
  { key:'en_cours',  label:'En cours',  dot:'var(--color-warning)' },
  { key:'terminee',  label:'Terminées', dot:'var(--color-success)' },
  { key:'annulee',   label:'Annulées',  dot:'var(--color-danger)' },
];
const CAL_DAYS = ['L','M','M','J','V','S','D'];

function toDate(str) { return str ? new Date(str) : null; }
function startOfWeek(d) { const r=new Date(d); const day=r.getDay()||7; r.setDate(r.getDate()-day+1); r.setHours(0,0,0,0); return r; }
function endOfWeek(d)   { const r=startOfWeek(d); r.setDate(r.getDate()+6); r.setHours(23,59,59,999); return r; }
function startOfMonth(d) { return new Date(d.getFullYear(),d.getMonth(),1); }
function endOfMonth(d)   { return new Date(d.getFullYear(),d.getMonth()+1,0,23,59,59,999); }
function daysInMonth(year,month) { return new Date(year,month+1,0).getDate(); }
function firstDayOfMonth(year,month) { const d=new Date(year,month,1).getDay(); return d===0?6:d-1; }
function formatDate(str) { if(!str)return'—'; const[y,m,d]=str.split('-'); return`${d}/${m}/${y}`; }
function initials(name='') { return name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase(); }
function hashColor(str='') {
  let h=0; for(let i=0;i<str.length;i++) h=(h*31+str.charCodeAt(i))&0xffffffff;
  return ['#2E70D9','#E07B2A','#3D9A6F','#7B60C8','#B0443A','#2A8FA8','#C85070','#4A8C4A'][Math.abs(h)%8];
}

function useHover() { const[h,set]=useState(false); return[h,{onMouseEnter:()=>set(true),onMouseLeave:()=>set(false)}]; }
function useOutsideClick(ref,cb) {
  useEffect(()=>{ const fn=e=>{if(ref.current&&!ref.current.contains(e.target))cb();}; document.addEventListener('mousedown',fn); return()=>document.removeEventListener('mousedown',fn); },[ref,cb]);
}

function useInsights(meetings) {
  return useMemo(()=>{
    const total=meetings.length;
    const totalMins=meetings.reduce((s,m)=>s+(parseInt(m.duration)||0),0);
    const hours=Math.floor(totalMins/60); const mins=totalMins%60;
    const durationLabel=totalMins===0?'0 min':hours>0?`${hours}h${mins>0?` ${mins}min`:''}`:` ${mins} min`;
    const byStatus=STATUS_FILTERS.slice(1).reduce((acc,f)=>{acc[f.v]=meetings.filter(m=>m.status===f.v).length;return acc;},{});
    const next=meetings.filter(m=>m.status==='planifiee'||m.status==='en_cours').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0]||null;
    return{total,durationLabel,byStatus,next};
  },[meetings]);
}

function useTimeFilter(meetings,timeFilter,customRange) {
  return useMemo(()=>{
    if(timeFilter==='all')return meetings;
    const now=new Date(); let lo,hi;
    if(timeFilter==='today'){lo=new Date(now);lo.setHours(0,0,0,0);hi=new Date(now);hi.setHours(23,59,59,999);}
    if(timeFilter==='week'){lo=startOfWeek(now);hi=endOfWeek(now);}
    if(timeFilter==='month'){lo=startOfMonth(now);hi=endOfMonth(now);}
    if(timeFilter==='custom'){lo=customRange.from?new Date(customRange.from):null;hi=customRange.to?new Date(customRange.to):null;}
    return meetings.filter(m=>{const d=toDate(m.date);if(!d)return false;if(lo&&d<lo)return false;if(hi&&d>hi)return false;return true;});
  },[meetings,timeFilter,customRange]);
}

const Ic = {
  plus:     ()=><svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  dots:     ()=><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="1.4" fill="currentColor"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/><circle cx="13" cy="8" r="1.4" fill="currentColor"/></svg>,
  cal:      ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  clk:      ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  loc:      ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a4.5 4.5 0 014.5 4.5c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 018 1.5z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  lock:     ()=><svg width="10" height="10" viewBox="0 0 16 16" fill="none"><rect x="3" y="7.5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 7.5V5a2.5 2.5 0 015 0v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  doc:      ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4 2h6l3 3v9H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 2v3h3M6 8h5M6 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  check:    ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trash:    ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M5 5l.5 8h5L11 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  warn:     ()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2L14.5 13H1.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  search:   ()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  close:    ()=><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  list:     ()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  grid:     ()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/></svg>,
  chevDown: ()=><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevLeft: ()=><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevRight:()=><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  lightning:()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M9 1L3 9h5l-1 6 6-8H8l1-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  users:    ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="11.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M13.5 13c0-2-.9-3.76-2.26-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  ai:       ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2a6 6 0 100 12A6 6 0 008 2z" stroke="currentColor" strokeWidth="1.4"/><path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>,
  postpone: ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M11 1l2 2-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  filter:   ()=><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M4 8h8M6 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
};

function IconBtn({ children, onClick, active, danger, title, size=28 }) {
  const [h,hp]=useHover();
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
  const c=T.status[statusKey]||T.status.planifiee; const isLive=statusKey==='en_cours';
  return <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:compact?'2px 7px':'3px 10px',borderRadius:T.r20,background:c.bg,fontSize:compact?10:11,fontWeight:500,color:c.fg,border:`1px solid ${c.border}`,whiteSpace:'nowrap'}}><span style={{width:5,height:5,borderRadius:'50%',background:c.dot,flexShrink:0,animation:isLive?'xm-pulse-dot 1.8s ease infinite':'none'}}/>{c.label}</span>;
}

function Field({ as:As='input', style, ...props }) {
  const[f,sf]=useState(false);
  return <As {...props} style={{width:'100%',background:T.bg3,border:`1px solid ${f?T.bd2:T.bd0}`,borderRadius:T.r8,padding:As==='textarea'?'9px 13px':'0 13px',height:As==='textarea'?undefined:36,color:T.t1,fontSize:13,lineHeight:1.6,outline:'none',fontFamily:'var(--font-sans)',boxSizing:'border-box',transition:'border-color .15s, box-shadow .15s',boxShadow:f?`0 0 0 3px ${T.accm}`:'none',caretColor:'var(--color-warning)',...style}} onFocus={()=>sf(true)} onBlur={()=>sf(false)}/>;
}

function PrimaryBtn({ children, onClick, danger, small }) {
  const[h,hp]=useHover(); const bg=danger?(h?'var(--color-danger)':'var(--color-danger)'):(h?T.acc2:T.acc);
  return <button onClick={onClick} {...hp} style={{display:'inline-flex',alignItems:'center',gap:6,padding:small?'6px 14px':'9px 18px',borderRadius:T.r8,border:'none',background:bg,color:'#FFFFFF',fontSize:small?12:13,fontWeight:700,cursor:'pointer',fontFamily:'var(--font-sans)',transition:'all .15s',boxShadow:h?`0 4px 20px ${T.acc}55`:`0 2px 8px ${T.acc}33`,transform:h?'translateY(-1px)':'none',whiteSpace:'nowrap'}}>{children}</button>;
}

function GhostBtn({ children, onClick, small }) {
  const[h,hp]=useHover();
  return <button onClick={onClick} {...hp} style={{padding:small?'5px 12px':'8px 16px',borderRadius:T.r8,border:`1px solid ${T.bd1}`,background:h?T.bg2:'transparent',fontSize:small?12:13,fontWeight:450,color:h?T.t1:T.t2,cursor:'pointer',fontFamily:'var(--font-sans)',transition:'all .15s',whiteSpace:'nowrap'}}>{children}</button>;
}

function FormLabel({ children, required, hint }) {
  return <label style={{display:'block',fontSize:12,fontWeight:500,color:T.t2,marginBottom:5}}>{children}{required&&<span style={{color:'var(--color-danger)',marginLeft:3}}>*</span>}{hint&&<span style={{color:T.t3,fontWeight:400,marginLeft:6,fontSize:11}}>{hint}</span>}</label>;
}

function Dropdown({ label, options, value, onChange, icon }) {
  const[open,setOpen]=useState(false); const ref=useRef(null);
  useOutsideClick(ref,useCallback(()=>setOpen(false),[]));
  const current=options.find(o=>o.v===value); const[h,hp]=useHover();
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
  const[h,hp]=useHover();
  return <button onClick={onClick} {...hp} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:T.r6,border:'none',background:h?T.bg3:'transparent',color:selected?T.t1:T.t2,fontSize:12.5,fontWeight:selected?500:400,cursor:'pointer',fontFamily:'var(--font-sans)',textAlign:'left',transition:'all .1s'}}>{label}{selected&&<span style={{color:T.acc,lineHeight:0}}><Ic.check/></span>}</button>;
}

// Remplacer entièrement la fonction ActionMenu
function ActionMenu({ meeting, onCancel, onPostpone, onMarkDone, onAddMinutes, isAdmin }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, useCallback(() => setOpen(false), []));

  // Déjà annulée — aucune action possible
  if (meeting.status === 'annulee') return null;

  const { status } = meeting;
  const items = [];

  // Terminer — si en cours
  if (status === 'en_cours') {
    items.push({ icon:<Ic.check/>, label:'Terminer', fn:onMarkDone });
  }

  // CR — si terminée
  if (status === 'terminee') {
    items.push({ icon:<Ic.doc/>, label:meeting.minutes ? 'Modifier le CR' : 'Rédiger le CR', fn:onAddMinutes, accent:true });
  }

  // Reporter — si pas terminée
  if (status !== 'terminee') {
    items.push({ icon:<Ic.postpone/>, label:'Reporter', fn:onPostpone });
  }

  // Confirmer le créneau — si reportée
  if (status === 'reportee') {
    items.push({ icon:<Ic.check/>, label:'Confirmer le créneau', fn:onMarkDone });
  }

  // Marquer terminée — si pas encore terminée
  if (status !== 'terminee') {
    items.push({ icon:<Ic.check/>, label:'Marquer terminée', fn:onMarkDone });
  }

  // Annuler — toujours possible sauf terminée (sauf admin)
  const peutAnnuler = status !== 'terminee' || isAdmin;
  if (peutAnnuler) {
    items.push({ sep: true });
    items.push({ icon:<Ic.trash/>, label:'Annuler la réunion', fn:onCancel, danger:true });
  }

  if (!items.length) return null;

  return (
    <div ref={ref} style={{position:'relative',flexShrink:0}} onClick={e=>e.stopPropagation()}>
      <IconBtn onClick={()=>setOpen(o=>!o)} active={open}><Ic.dots/></IconBtn>
      {open && (
        <div style={{position:'absolute',right:0,top:34,zIndex:200,background:T.bg2,border:`1px solid ${T.bd1}`,borderRadius:T.r10,padding:5,minWidth:210,boxShadow:T.shadowDropdown,animation:'xm-menu-pop .14s cubic-bezier(.22,1,.36,1)'}}>
          {items.map((item,i) =>
            item.sep
              ? <div key={i} style={{height:1,background:T.bd0,margin:'4px 0'}}/>
              : <ActionItem key={i} {...item} onClick={()=>{setOpen(false);item.fn();}}/>
          )}
        </div>
      )}
    </div>
  );
}

function ActionItem({ icon, label, danger, accent, onClick }) {
  const[h,hp]=useHover(); const color=danger?'var(--color-danger)':accent?T.acc:T.t2;
  return <button onClick={onClick} {...hp} style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'7px 10px',borderRadius:T.r6,border:'none',background:h?(danger?'rgba(240,112,112,.07)':T.bg3):'transparent',cursor:'pointer',fontSize:12.5,fontWeight:450,color,fontFamily:'var(--font-sans)',textAlign:'left',transition:'all .1s'}}><span style={{lineHeight:0,opacity:.85,flexShrink:0}}>{icon}</span>{label}</button>;
}

function Modal({ open, onClose, title, width=520, children }) {
  useEffect(()=>{document.body.style.overflow=open?'hidden':'';return()=>{document.body.style.overflow='';};},[open]);
  if(!open)return null;
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

function StatsHeader({ meetings, insights }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))',gap:10,marginBottom:24}} className="xm-stats-row">
      <StatCard value={insights.total} unit="réunion" unitPlural="réunions" label="Période sélectionnée" accent={T.acc}
        sub={<><span style={{color:T.t3,fontSize:11}}><Ic.clk/></span><span style={{color:T.t3,fontSize:11,marginLeft:5,fontFamily:'var(--font-mono)'}}>{insights.durationLabel}</span><span style={{color:T.t3,fontSize:11,marginLeft:4}}>de réunion</span></>}/>
      {STAT_CONFIG.map(({key,label,dot})=>{const n=insights.byStatus[key]||0;const pct=insights.total>0?Math.round(n/insights.total*100):0;return<StatCard key={key} value={n} label={label} accent={dot} pct={pct}/>;})}
    </div>
  );
}

function StatCard({ value, label, accent, pct, sub, unit, unitPlural }) {
  const[h,hp]=useHover();
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

function NextMeetingBanner({ meeting, onClick }) {
  const[h,hp]=useHover(); if(!meeting)return null; const isLive=meeting.status==='en_cours';
  return (
    <div {...hp} onClick={onClick} style={{marginBottom:20,padding:'12px 16px',borderRadius:T.r12,cursor:'pointer',background:isLive?`linear-gradient(135deg, rgba(240,160,48,.14) 0%, rgba(240,160,48,.05) 100%)`:T.bg1,border:`1px solid ${isLive?T.accb:T.bd0}`,display:'flex',alignItems:'center',gap:14,transition:'all .15s',boxShadow:h?T.shadowDropdown:'none'}}>
      <div style={{width:36,height:36,borderRadius:T.r8,flexShrink:0,background:isLive?T.accm:T.bg3,border:`1px solid ${isLive?T.accb:T.bd1}`,display:'flex',alignItems:'center',justifyContent:'center',color:isLive?T.acc:T.t2}}>{isLive?<Ic.lightning/>:<Ic.cal/>}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}><span style={{fontSize:10.5,fontWeight:700,color:isLive?T.acc:T.t3,letterSpacing:'.08em',textTransform:'uppercase'}}>{isLive?'En cours maintenant':'Prochaine réunion'}</span><StatusPill statusKey={meeting.status} compact/></div>
        <div style={{fontSize:13,fontWeight:600,color:T.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{meeting.title}</div>
        <div style={{display:'flex',gap:12,fontSize:11,color:T.t3,marginTop:3,fontFamily:'var(--font-mono)'}}><span>{formatDate(meeting.date)}</span><span>{meeting.time||'—'}</span>{meeting.location&&<span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'var(--font-sans)'}}>{meeting.location}</span>}</div>
      </div>
      <span style={{color:T.t3,lineHeight:0,flexShrink:0}}><Ic.chevRight/></span>
    </div>
  );
}

function FiltersBar({ query,setQuery,statusFilter,setStatusFilter,timeFilter,setTimeFilter,customRange,setCustomRange,view,setView,activeCount }) {
  const[showCustom,setShowCustom]=useState(false);
  const handleTimeChange=(v)=>{setTimeFilter(v);if(v==='custom')setShowCustom(true);else setShowCustom(false);};
  const hasActiveFilters=statusFilter!=='all'||timeFilter!=='all'||query!=='';
  return (
    <div style={{marginBottom:20}}>
      <div className="xm-filters-row" style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:'1 1 200px',minWidth:0}}>
          <span style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:T.t3,pointerEvents:'none',lineHeight:0}}><Ic.search/></span>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher par titre, organisateur…"
            style={{width:'100%',background:T.bg1,border:`1px solid ${T.bd0}`,borderRadius:T.r8,padding:'0 13px 0 35px',height:34,color:T.t1,fontSize:12.5,lineHeight:1.6,outline:'none',fontFamily:'var(--font-sans)',boxSizing:'border-box',transition:'border-color .13s, box-shadow .13s',caretColor:'var(--color-warning)'}}
            onFocus={e=>{e.target.style.borderColor=T.bd2;e.target.style.boxShadow=`0 0 0 3px ${T.accm}`;}}
            onBlur={e=>{e.target.style.borderColor=T.bd0;e.target.style.boxShadow='none';}}/>
          {query&&<button onClick={()=>setQuery('')} style={{position:'absolute',right:9,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:T.t3,lineHeight:0,padding:2}}><Ic.close/></button>}
        </div>
        <Dropdown label="Statut" icon={<Ic.filter/>} options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter}/>
        <Dropdown label="Période" icon={<Ic.cal/>} options={TIME_FILTERS} value={timeFilter} onChange={handleTimeChange}/>
        <ViewSwitcher view={view} setView={setView}/>
        {hasActiveFilters&&<button onClick={()=>{setQuery('');setStatusFilter('all');setTimeFilter('all');setShowCustom(false);}} style={{display:'flex',alignItems:'center',gap:5,padding:'0 10px',height:34,borderRadius:T.r8,border:`1px solid ${T.bd0}`,background:'transparent',color:T.t3,fontSize:12,cursor:'pointer',fontFamily:'var(--font-sans)',transition:'all .13s',whiteSpace:'nowrap'}} onMouseEnter={e=>{e.currentTarget.style.color=T.t1;e.currentTarget.style.borderColor=T.bd1;}} onMouseLeave={e=>{e.currentTarget.style.color=T.t3;e.currentTarget.style.borderColor=T.bd0;}}><Ic.close/> Réinitialiser</button>}
      </div>
      {showCustom&&<div style={{marginTop:8,display:'flex',gap:10,alignItems:'center',padding:'10px 14px',background:T.bg1,borderRadius:T.r8,border:`1px solid ${T.bd0}`,animation:'xm-fade-up .15s ease'}}><span style={{fontSize:12,color:T.t3,flexShrink:0}}>Du</span><Field type="date" value={customRange.from} onChange={e=>setCustomRange(r=>({...r,from:e.target.value}))} style={{maxWidth:150,height:32,fontSize:12}}/><span style={{fontSize:12,color:T.t3,flexShrink:0}}>au</span><Field type="date" value={customRange.to} onChange={e=>setCustomRange(r=>({...r,to:e.target.value}))} style={{maxWidth:150,height:32,fontSize:12}}/></div>}
      {(statusFilter!=='all'||timeFilter!=='all')&&<div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
        {statusFilter!=='all'&&<ActiveChip label={STATUS_FILTERS.find(f=>f.v===statusFilter)?.l} onRemove={()=>setStatusFilter('all')}/>}
        {timeFilter!=='all'&&<ActiveChip label={TIME_FILTERS.find(f=>f.v===timeFilter)?.l} onRemove={()=>{setTimeFilter('all');setShowCustom(false);}}/>}
        <span style={{fontSize:11,color:T.t3,display:'flex',alignItems:'center',marginLeft:2}}>{activeCount} résultat{activeCount!==1?'s':''}</span>
      </div>}
    </div>
  );
}

function ActiveChip({ label, onRemove }) {
  return <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'2px 8px 2px 10px',borderRadius:T.r20,background:T.accm,border:`1px solid ${T.accb}`,fontSize:11,fontWeight:500,color:T.acc}}>{label}<button onClick={onRemove} style={{background:'none',border:'none',cursor:'pointer',color:T.acc,lineHeight:0,padding:1,opacity:.7,transition:'opacity .1s'}} onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='.7'}><Ic.close/></button></span>;
}

function ViewSwitcher({ view, setView }) {
  return <div style={{display:'flex',background:T.bg1,border:`1px solid ${T.bd0}`,borderRadius:T.r8,padding:3,gap:2,flexShrink:0}}>{[['list',<Ic.list/>,'Liste'],['calendar',<Ic.grid/>,'Calendrier']].map(([v,icon,label])=>{const active=view===v;return<button key={v} onClick={()=>setView(v)} title={label} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:T.r6,border:'none',background:active?T.bg3:'transparent',color:active?T.t1:T.t3,fontSize:12,fontWeight:active?500:400,cursor:'pointer',fontFamily:'var(--font-sans)',transition:'all .13s',whiteSpace:'nowrap'}}><span style={{lineHeight:0}}>{icon}</span></button>;})}</div>;
}

const MeetingCard = memo(function MeetingCard({ m, peutAgir, isAdmin, isHighlight, onCancel, onPostpone, onMarkDone, onAddMinutes, onClick, index, hideStatus }) {
  const[h,hp]=useHover(); const isAnn=m.status==='annulee'; const isLive=m.status==='en_cours'; const isRep=m.status==='reportee'; const hasCR=!!m.minutes;
  const participantCount=m.participants?.length??m.participant_reunions?.length??0;
  const borderColor=isHighlight&&isLive?T.acc:h&&!isAnn?T.bd2:isAnn?'rgba(240,112,112,.15)':isRep?'rgba(224,185,80,.15)':T.bd0;
  return (
    <article className="xm-card-enter" {...(isAnn?{}:hp)} onClick={isAnn?undefined:onClick}
      style={{background:h&&!isAnn?T.bg2:T.bg1,border:`1px solid ${borderColor}`,borderRadius:T.r12,padding:'15px 16px',cursor:isAnn?'default':'pointer',opacity:isAnn?.55:1,position:'relative',overflow:'hidden',transition:'border-color .18s, box-shadow .18s, background .18s',boxShadow:isHighlight&&isLive?`0 0 0 1px ${T.acc}33, 0 4px 20px rgba(240,160,48,.12)`:h&&!isAnn?T.shadowDropdown:'none',animationDelay:`${index*35}ms`,minWidth:0}}>
      {isLive&&<div style={{position:'absolute',left:0,top:0,width:2,height:'100%',background:T.acc,borderRadius:'0 1px 1px 0',animation:'xm-pulse-dot 2s ease infinite'}}/>}
      {isHighlight&&!isLive&&<div style={{position:'absolute',top:10,right:12,fontSize:10,fontWeight:700,color:T.acc,letterSpacing:'.07em',textTransform:'uppercase',opacity:.7,display:'flex',alignItems:'center',gap:4}}><Ic.lightning/> Prochaine</div>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:10}}>
        <div style={{flex:1,minWidth:0}}>
          <h3 style={{fontSize:13.5,fontWeight:600,lineHeight:1.4,marginBottom:8,color:isAnn?T.t3:T.t1,textDecoration:isAnn?'line-through':'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'var(--font-sans)'}}>{m.title||'—'}</h3>
          <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
            {!hideStatus&&<StatusPill statusKey={m.status} compact/>}
            {hasCR&&<Tag icon={<Ic.doc/>} color="var(--color-purple)" bg="rgba(155,127,232,.10)">CR disponible</Tag>}
            {m.visibility==='direction'&&<Tag icon={<Ic.lock/>} color="var(--color-accent)" bg="var(--color-accent-bg)">Privé</Tag>}
          </div>
        </div>
       {peutAgir && <ActionMenu meeting={m} onCancel={onCancel} onPostpone={onPostpone} onMarkDone={onMarkDone} onAddMinutes={onAddMinutes} isAdmin={isAdmin}/>}
      </div>
      <div style={{display:'flex',gap:10,fontSize:11,color:T.t3,flexWrap:'wrap',alignItems:'center',fontFamily:'var(--font-mono)'}}>
        <MetaItem icon={<Ic.cal/>}>{formatDate(m.date)}</MetaItem>
        <MetaItem icon={<Ic.clk/>}>{m.time||'—'}{m.duration&&<span style={{opacity:.6,fontFamily:'var(--font-sans)'}}> · {m.duration}min</span>}</MetaItem>
        {m.location&&<MetaItem icon={<Ic.loc/>} style={{fontFamily:'var(--font-sans)',flex:'1 1 0',minWidth:0}}><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}}>{m.location}</span></MetaItem>}
      </div>
      {(m.organizer||participantCount>0)&&<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:10,paddingTop:10,borderTop:`1px solid ${T.bd0}`}}>
        {m.organizer&&<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar name={m.organizer} size={18}/><span style={{fontSize:11,color:T.t3}}>{m.organizer}</span></div>}
        {participantCount>0&&<div style={{display:'flex',alignItems:'center',gap:4,color:T.t3,fontSize:11}}><Ic.users/><span>{participantCount}</span></div>}
      </div>}
      {isLive&&<div style={{marginTop:10,padding:'7px 10px',borderRadius:T.r8,background:'var(--color-warning-bg)',border:`1px solid var(--color-warning-border)`,display:'flex',alignItems:'center',gap:7}}><span style={{animation:'xm-pulse-dot 1.6s ease infinite',lineHeight:0,color:T.acc}}><Ic.lightning/></span><span style={{fontSize:11.5,fontWeight:600,color:T.acc}}>Réunion en cours</span></div>}
      {isRep&&m.postponedTo&&<div style={{marginTop:10,padding:'7px 10px',borderRadius:T.r8,background:'rgba(224,185,80,.08)',border:'1px solid rgba(224,185,80,.18)'}}><p style={{fontSize:11.5,fontWeight:600,color:'var(--color-purple)',margin:'0 0 2px',display:'flex',alignItems:'center',gap:6}}><Ic.postpone/> Reportée au {formatDate(m.postponedTo.date)} à {m.postponedTo.time||'—'}</p>{m.postponeReason&&<p style={{fontSize:11,color:T.t3,margin:0}}>{m.postponeReason}</p>}</div>}
      {isAnn&&m.cancelReason&&<div style={{marginTop:10,padding:'7px 10px',borderRadius:T.r8,background:'rgba(240,112,112,.07)',border:'1px solid rgba(240,112,112,.18)'}}><p style={{fontSize:11.5,fontWeight:600,color:'var(--color-danger)',margin:'0 0 2px',display:'flex',alignItems:'center',gap:6}}><Ic.warn/> Réunion annulée</p><p style={{fontSize:11,color:T.t3,margin:0}}>{m.cancelReason}</p></div>}
      {hasCR&&<div onClick={e=>{e.stopPropagation();onClick();}} style={{marginTop:10,padding:'9px 12px',cursor:'pointer',background:'var(--color-purple-bg)',border:`1px solid var(--color-purple-border)`,borderRadius:T.r8,transition:'background .13s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(155,127,232,.12)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(155,127,232,.07)'}><p style={{fontSize:9.5,fontWeight:700,color:'var(--color-purple)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:3}}>Aperçu compte rendu</p><p style={{fontSize:11.5,color:'var(--color-purple)',lineHeight:1.6,margin:0,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{m.minutes?.summary||m.summary}</p></div>}
    </article>
  );
});

function MetaItem({ icon, children, style }) {
  return <span style={{display:'flex',alignItems:'center',gap:4,...style}}><span style={{lineHeight:0,opacity:.6,flexShrink:0}}>{icon}</span>{children}</span>;
}

function CalendarView({ meetings, onCardClick, year, month, setYear, setMonth }) {
  const today=new Date(); const days=daysInMonth(year,month); const first=firstDayOfMonth(year,month);
  const monthNames=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const byDay=useMemo(()=>{const map={};meetings.forEach(m=>{if(!m.date)return;const[y,mo,d]=m.date.split('-').map(Number);if(y===year&&mo-1===month){if(!map[d])map[d]=[];map[d].push(m);}});return map;},[meetings,year,month]);
  const cells=[]; for(let i=0;i<first;i++)cells.push(null); for(let d=1;d<=days;d++)cells.push(d);
  const[selectedDay,setSelectedDay]=useState(null); const dayMeetings=selectedDay?(byDay[selectedDay]||[]):[];
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <h3 style={{fontSize:14,fontWeight:600,color:T.t1,margin:0,fontFamily:'var(--font-sans)'}}>{monthNames[month]} {year}</h3>
        <div style={{display:'flex',gap:4}}>
          <IconBtn onClick={()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);}}><Ic.chevLeft/></IconBtn>
          <button onClick={()=>{setMonth(today.getMonth());setYear(today.getFullYear());}} style={{padding:'0 10px',height:28,borderRadius:T.r6,border:`1px solid ${T.bd0}`,background:'transparent',color:T.t2,fontSize:11.5,cursor:'pointer',fontFamily:'var(--font-sans)'}}>Aujourd'hui</button>
          <IconBtn onClick={()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);}}><Ic.chevRight/></IconBtn>
        </div>
      </div>
      <div className="xm-cal-header" style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:4}}>{CAL_DAYS.map((d,i)=><div key={i} style={{textAlign:'center',fontSize:10.5,fontWeight:600,color:T.t3,padding:'4px 0',letterSpacing:'.05em'}}>{d}</div>)}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
        {cells.map((d,i)=>{if(d===null)return<div key={`e-${i}`}/>;const isToday=d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear();const mtgs=byDay[d]||[];const selected=selectedDay===d;const hasMtgs=mtgs.length>0;return<CalCell key={d} day={d} isToday={isToday} selected={selected} meetings={mtgs} hasMtgs={hasMtgs} onClick={()=>setSelectedDay(selected?null:d)}/>;})}
      </div>
      {selectedDay&&dayMeetings.length>0&&<div style={{marginTop:20,animation:'xm-fade-up .2s ease'}}><p style={{fontSize:12,color:T.t3,marginBottom:10}}>{dayMeetings.length} réunion{dayMeetings.length!==1?'s':''} le {selectedDay}/{month+1}/{year}</p><div style={{display:'flex',flexDirection:'column',gap:8}}>{dayMeetings.map(m=><DayMeetingRow key={m.id} m={m} onClick={()=>onCardClick(m.id)}/>)}</div></div>}
      {selectedDay&&dayMeetings.length===0&&<p style={{marginTop:12,fontSize:12,color:T.t3,textAlign:'center'}}>Aucune réunion ce jour.</p>}
    </div>
  );
}

function CalCell({ day, isToday, selected, meetings, hasMtgs, onClick }) {
  const[h,hp]=useHover(); const dots=meetings.slice(0,3);
  return <div {...hp} onClick={onClick} style={{padding:'8px 6px 6px',borderRadius:T.r8,border:`1px solid ${selected?T.bd2:isToday?T.accb:hasMtgs?T.bd1:T.bd0}`,background:selected?T.bg3:isToday?T.accm:h?T.bg2:T.bg1,cursor:hasMtgs?'pointer':'default',transition:'all .13s',minHeight:56,display:'flex',flexDirection:'column',alignItems:'center'}}><span style={{fontSize:12.5,fontWeight:isToday?700:400,color:isToday?T.acc:T.t2,lineHeight:1,marginBottom:5,fontFamily:'var(--font-mono)'}}>{day}</span><div style={{display:'flex',gap:2,flexWrap:'wrap',justifyContent:'center'}}>{dots.map((m,i)=>{const c=T.status[m.status]?.dot||T.acc;return<span key={i} style={{width:5,height:5,borderRadius:'50%',background:c}}/>;})}</div></div>;
}

function DayMeetingRow({ m, onClick }) {
  const[h,hp]=useHover(); const c=T.status[m.status]||T.status.planifiee;
  return <div {...hp} onClick={onClick} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:T.r8,cursor:'pointer',background:h?T.bg2:T.bg1,border:`1px solid ${h?T.bd1:T.bd0}`,transition:'all .13s'}}><span style={{width:3,alignSelf:'stretch',borderRadius:99,background:c.dot,flexShrink:0}}/><div style={{flex:1,minWidth:0}}><p style={{fontSize:12.5,fontWeight:600,color:T.t1,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.title}</p><p style={{fontSize:11,color:T.t3,margin:'2px 0 0',fontFamily:'var(--font-mono)'}}>{m.time||'—'}{m.duration?` · ${m.duration}min`:''}</p></div><StatusPill statusKey={m.status} compact/></div>;
}

function EmptyState({ hasQuery }) {
  return (
    <div style={{textAlign:'center',padding:'72px 24px',background:T.bg1,borderRadius:T.r16,border:`1px solid ${T.bd0}`}}>
      <div style={{width:52,height:52,borderRadius:14,background:T.accm,border:`1px solid ${T.accb}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px'}}>
        <svg width="24" height="24" viewBox="0 0 22 22" fill="none"><rect x="2" y="3" width="18" height="16" rx="2.5" stroke={T.acc} strokeWidth="1.6"/><path d="M7 1v3M15 1v3M2 9h18" stroke={T.acc} strokeWidth="1.6" strokeLinecap="round"/><path d="M7 13h3M12 13h3M7 16h2" stroke={T.acc} strokeWidth="1.4" strokeLinecap="round"/></svg>
      </div>
      <p style={{fontSize:14,fontWeight:600,color:T.t1,marginBottom:6,fontFamily:'var(--font-sans)'}}>{hasQuery?'Aucun résultat':'Aucune réunion'}</p>
      <p style={{fontSize:13,color:T.t3,maxWidth:300,margin:'0 auto',lineHeight:1.7}}>{hasQuery?'Modifiez vos filtres ou votre recherche.':'Planifiez votre première réunion.'}</p>
    </div>
  );
}

export function MinutesModal({ open, onClose, meeting, form, setForm, onSave }) {
  if(!open||!meeting)return null; const isEdit=!!meeting.minutes;
  const addDecision=()=>setForm(f=>({...f,decisions:[...f.decisions,'']}));
  const setDecision=(i,v)=>setForm(f=>({...f,decisions:f.decisions.map((d,j)=>j===i?v:d)}));
  const removeDecision=i=>setForm(f=>({...f,decisions:f.decisions.filter((_,j)=>j!==i)}));
  const addAction=()=>setForm(f=>({...f,actions:[...f.actions,{text:'',assignee:'',due:''}]}));
  const setAction=(i,k,v)=>setForm(f=>({...f,actions:f.actions.map((a,j)=>j===i?{...a,[k]:v}:a)}));
  const removeAction=i=>setForm(f=>({...f,actions:f.actions.filter((_,j)=>j!==i)}));
  function SectionHead({label,onAdd}){return<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}><span style={{fontSize:12,fontWeight:500,color:T.t2}}>{label}</span>{onAdd&&<button onClick={onAdd} style={{display:'flex',alignItems:'center',gap:5,fontSize:11.5,fontWeight:500,color:T.acc,background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font-sans)',padding:'3px 6px',borderRadius:T.r6,transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background=T.accm} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><Ic.plus/> Ajouter</button>}</div>;}
  return (
    <Modal open={open} onClose={onClose} title={isEdit?'Modifier le compte rendu':'Rédiger le compte rendu'} width={680}>
      <div style={{display:'flex',flexDirection:'column',gap:22}}>
        <div style={{padding:'11px 14px',background:T.bg2,border:`1px solid ${T.bd0}`,borderRadius:T.r10}}><p style={{fontSize:13,fontWeight:600,color:T.t1,marginBottom:6,fontFamily:'var(--font-sans)'}}>{meeting.title}</p><div style={{display:'flex',gap:14,fontSize:11,color:T.t3,flexWrap:'wrap',fontFamily:'var(--font-mono)'}}><span style={{display:'flex',gap:5,alignItems:'center'}}><Ic.cal/> {formatDate(meeting.date)}</span><span style={{display:'flex',gap:5,alignItems:'center'}}><Ic.clk/> {meeting.time}</span>{meeting.location&&<span style={{display:'flex',gap:5,alignItems:'center',fontFamily:'var(--font-sans)'}}><Ic.loc/> {meeting.location}</span>}</div></div>
        <div style={{padding:'10px 14px',borderRadius:T.r8,background:'var(--color-purple-bg)',border:`1px solid var(--color-purple-border)`,display:'flex',alignItems:'center',gap:10}}><span style={{color:'var(--color-purple)',lineHeight:0,flexShrink:0}}><Ic.ai/></span><span style={{fontSize:12,color:'var(--color-purple)'}}>Bientôt : résumé et décisions générés automatiquement par l'IA.</span></div>
        <div><FormLabel required>Résumé exécutif</FormLabel><Field as="textarea" value={form.summary} onChange={e=>setForm(f=>({...f,summary:e.target.value}))} placeholder="Points clés abordés…" rows={5} style={{resize:'vertical',lineHeight:1.7}}/></div>
        <div><SectionHead label="Décisions & arbitrages" onAdd={addDecision}/><div style={{display:'flex',flexDirection:'column',gap:8}}>{form.decisions.map((d,i)=><div key={i} style={{display:'flex',gap:8,alignItems:'center'}}><span style={{width:22,height:22,borderRadius:'50%',background:T.accm,border:`1px solid ${T.accb}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:T.acc,flexShrink:0}}>{i+1}</span><Field value={d} onChange={e=>setDecision(i,e.target.value)} placeholder={`Décision ${i+1}…`} style={{flex:1}}/>{form.decisions.length>1&&<IconBtn onClick={()=>removeDecision(i)} danger><Ic.trash/></IconBtn>}</div>)}</div></div>
        <div><SectionHead label="Plan d'actions" onAdd={addAction}/><div style={{display:'flex',flexDirection:'column',gap:8}}>{form.actions.map((a,i)=><div key={i} style={{display:'grid',gap:8,alignItems:'center',gridTemplateColumns:'minmax(0,1fr) 130px 110px 28px',padding:'8px 10px',background:T.bg2,borderRadius:T.r8,border:`1px solid ${T.bd0}`}}><Field value={a.text} onChange={e=>setAction(i,'text',e.target.value)} placeholder="Action" style={{fontSize:12}}/><Field value={a.assignee} onChange={e=>setAction(i,'assignee',e.target.value)} placeholder="Responsable" style={{fontSize:12}}/><Field type="date" value={a.due} onChange={e=>setAction(i,'due',e.target.value)} style={{fontSize:12,colorScheme:'light'}}/>{form.actions.length>1?<IconBtn onClick={()=>removeAction(i)} danger><Ic.trash/></IconBtn>:<div/>}</div>)}</div></div>
        <div><FormLabel hint="Visible uniquement par l'organisateur et la direction">Notes confidentielles</FormLabel><Field as="textarea" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Remarques internes…" rows={3} style={{resize:'vertical',lineHeight:1.6,background:'rgba(240,160,48,.04)',borderColor:T.accb}}/></div>
        <ModalFooter onCancel={onClose} onConfirm={onSave} cancelLabel="Fermer" confirmLabel={isEdit?'Mettre à jour':'Enregistrer le CR'}/>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   MEETINGS PAGE — MAIN EXPORT
   ════════════════════════════════════════════════════════════════ */
export default function MeetingsPage() {
  useGlobalStyle();
  const navigate = useNavigate();
  const { addToast }  = useNotif();
  const { user }      = useAuth();
  const { meetings, create, cancel, postpone, reschedule, addMinutes, markDone } = useMeetings();

  /* ── ✅ CORRECTION 1 : isAssistant + isDirecteur ── */
  const { isAdmin, isAssistant, isManager, isDirecteur } = usePermissions();

  const peutCreer   = isAdmin || isAssistant || isManager;
  const peutAgir    = isAdmin || isAssistant || isManager;
  const isDirection = isAdmin || isDirecteur || isAssistant;

  const [query,        setQuery]       = useState('');
  const [statusFilter, setStatusFilter]= useState('all');
  const [timeFilter,   setTimeFilter]  = useState('all');
  const [customRange,  setCustomRange] = useState({ from:'', to:'' });
  const [view,         setView]        = useState('list');
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [createModal,   setCreateModal]   = useState(false);
  const [cancelModal,   setCancelModal]   = useState(null);
  const [postponeModal, setPostponeModal] = useState(null);
  const [minutesModal,  setMinutesModal]  = useState(null);
  const [cancelForm,   setCancelForm]   = useState({ reason:'' });
  const [postponeForm, setPostponeForm] = useState({ date:'', time:'', reason:'' });
  const [minutesForm,  setMinutesForm]  = useState({ summary:'', decisions:[''], actions:[{text:'',assignee:'',due:''}], note:'' });

  /* ── ✅ CORRECTION 2 : filtre par rôle / département ── */
 const visible = useMemo(() => {
  const afterVisibility = meetings.filter(
    m => !(m.visibility === 'direction' && !isDirection)
  );

  let result;

  if (isAdmin || isDirecteur || isAssistant) {
    result = afterVisibility;
  } else if (isManager) {
    const userDeptId = user?.departement_id ?? user?.department_id ?? null;
    result = afterVisibility.filter(m =>
      (userDeptId && m.departement_id === userDeptId) ||
      m.organisateur_id === user?.id ||
      m.organizer       === user?.name ||
      m.participants?.some(p =>
        (p.email && p.email === user?.email) ||
        (p.id    && p.id    === user?.id)
      )
    );
  } else {
    result = afterVisibility.filter(m =>
      m.organisateur_id === user?.id ||
      m.organizer       === user?.name ||
      m.participants?.some(p =>
        (p.email && p.email === user?.email) ||
        (p.id    && p.id    === user?.id)
      )
    );
  }

  // ── Tri : En cours → À venir (croissant) → Reportées → Terminées → Annulées
const ORDER = { en_cours:0, imminente:1, planifiee:2, reportee:3, terminee:4, annulee:5 };

  return [...result].sort((a, b) => {
    const oa = ORDER[a.status] ?? 5;
    const ob = ORDER[b.status] ?? 5;
    if (oa !== ob) return oa - ob;
    // À même statut : trier par date + heure croissante
    const da = (a.date || '') + (a.time || '');
    const db = (b.date || '') + (b.time || '');
    return da.localeCompare(db);
  });

}, [meetings, isDirection, isAdmin, isDirecteur, isAssistant, isManager, user]);

  const timeFiltered = useTimeFilter(visible, timeFilter, customRange);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return timeFiltered.filter(m => {
      const matchQ = !q || (m.title+' '+(m.organizer||'')).toLowerCase().includes(q);
      const matchS = statusFilter==='all' || m.status===statusFilter;
      return matchQ && matchS;
    });
  }, [timeFiltered, query, statusFilter]);

  const insights = useInsights(filtered);

const handleCreate = useCallback(async (payload) => {
    try {
        await create(payload);
        const nb  = payload?.reunion?.participant_reunions?.length ?? payload?.participants?.length ?? 0;
        const vis = payload?.reunion?.reun_visibilite || payload?.reun_visibilite || '';
        addToast(`Réunion planifiée · ${vis === 'direction' ? 'Directeur & Assistant' : 'Tous'}${nb > 0 ? ` · ${nb} participant(s)` : ''}`, 'success');
    } catch (e) {
        addToast(e?.message || 'Erreur lors de la création.', 'error');
    }
}, [create, addToast]);

const handleMarkDone = useCallback(async (id) => {
    const m = meetings.find(x => x.id === id);
    try {
        if (m?.status === 'reportee') {
            await reschedule(id);
            addToast('Créneau confirmé.', 'success');
        } else {
            await markDone(id);
            addToast('Réunion terminée.', 'success');
        }
    } catch (e) {
        addToast(e?.message || 'Erreur.', 'error');
    }
}, [meetings, reschedule, markDone, addToast]);

const handleCancel = useCallback(async () => {
    try {
        await cancel(cancelModal, cancelForm.reason);
        addToast('Réunion annulée.', 'warning');
    } catch (e) {
        addToast(e?.message || 'Erreur lors de l\'annulation.', 'error');
    } finally {
        setCancelModal(null);
        setCancelForm({ reason: '' });
    }
}, [cancel, cancelModal, cancelForm, addToast]);

const handlePostpone = useCallback(async () => {
    if (!postponeForm.date) { addToast('Nouvelle date requise.', 'error'); return; }
    try {
        await postpone(postponeModal, postponeForm.date, postponeForm.time, postponeForm.reason);
        addToast('Réunion reportée.', 'info');
    } catch (e) {
        addToast(e?.message || 'Erreur lors du report.', 'error');
    } finally {
        setPostponeModal(null);
        setPostponeForm({ date: '', time: '', reason: '' });
    }
}, [postpone, postponeModal, postponeForm, addToast]);

const handleSaveMinutes = useCallback(async () => {
    const m = meetings.find(x => x.id === minutesModal);
    if (!minutesForm.summary.trim()) { addToast('Le résumé est requis.', 'error'); return; }
    try {
        await addMinutes(minutesModal, {
            summary:   minutesForm.summary,
            decisions: minutesForm.decisions.filter(d => d.trim()),
            actions:   minutesForm.actions.filter(a => a.text.trim()),
            note:      minutesForm.note,
            addedAt:   new Date().toISOString(),
        });
        addToast(m?.minutes ? 'CR mis à jour.' : 'CR enregistré.', 'success');
        setMinutesModal(null);
        setMinutesForm({ summary:'', decisions:[''], actions:[{text:'',assignee:'',due:''}], note:'' });
    } catch (e) {
        addToast(e?.message || 'Erreur lors de l\'enregistrement.', 'error');
    }
}, [meetings, minutesModal, minutesForm, addMinutes, addToast]);

  const nextId = insights.next?.id;
  const hideStatus = statusFilter !== 'all';

  return (
    <div className="xm-page xm-page-enter" style={{padding:'0 2px',maxWidth:'100%',overflowX:'hidden'}}>
      <div className="xm-header-row" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,marginBottom:24,flexWrap:'wrap'}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:T.t1,letterSpacing:'-.6px',marginBottom:4,fontFamily:'var(--font-sans)'}}>Réunions</h1>
          <p style={{fontSize:13,color:T.t3,fontFamily:'var(--font-sans)'}}>{visible.length} réunion{visible.length!==1?'s':''} au total{timeFilter!=='all'&&` · ${filtered.length} sur la période`}</p>
        </div>
        {peutCreer&&<PrimaryBtn onClick={()=>setCreateModal(true)}><Ic.plus/> Planifier une réunion</PrimaryBtn>}
      </div>

      <StatsHeader meetings={filtered} insights={insights}/>

      {insights.next&&<NextMeetingBanner meeting={insights.next} onClick={()=>navigate(`/meetings/${insights.next.id}`)}/>}

      <FiltersBar query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} timeFilter={timeFilter} setTimeFilter={setTimeFilter} customRange={customRange} setCustomRange={setCustomRange} view={view} setView={setView} activeCount={filtered.length}/>

      {filtered.length===0?(
        <EmptyState hasQuery={!!query||statusFilter!=='all'||timeFilter!=='all'}/>
      ):view==='calendar'?(
        <div style={{background:T.bg1,border:`1px solid ${T.bd0}`,borderRadius:T.r14,padding:'20px 20px 24px'}}>
          <CalendarView meetings={filtered} onCardClick={id=>navigate(`/meetings/${id}`)} year={calYear} month={calMonth} setYear={setCalYear} setMonth={setCalMonth}/>
        </div>
      ):(
        <div className="xm-grid-list">
          {filtered.map((m,i)=>(
           <MeetingCard key={m.id} m={m} index={i} peutAgir={peutAgir} isAdmin={isAdmin} isHighlight={m.id===nextId} hideStatus={hideStatus}
              onCancel={()=>setCancelModal(m.id)} onPostpone={()=>setPostponeModal(m.id)}
              onMarkDone={()=>handleMarkDone(m.id)} onAddMinutes={()=>navigate(`/meetings/${m.id}`)}
              onClick={()=>navigate(`/meetings/${m.id}`)}/>
          ))}
        </div>
      )}

      {peutCreer&&<CreateMeetingModal open={createModal} onClose={()=>setCreateModal(false)} onCreate={handleCreate}/>}

      <Modal open={!!cancelModal} onClose={()=>setCancelModal(null)} title="Annuler la réunion" width={460}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{padding:'12px 14px',background:'rgba(240,112,112,.07)',border:'1px solid rgba(240,112,112,.18)',borderRadius:T.r10}}>
            <p style={{fontSize:13,fontWeight:600,color:'var(--color-danger)',marginBottom:5,display:'flex',alignItems:'center',gap:8,fontFamily:'var(--font-sans)'}}><Ic.warn/> {meetings.find(m=>m.id===cancelModal)?.title}</p>
            <p style={{fontSize:12,color:T.t3,lineHeight:1.6,margin:0}}>Action irréversible. Un email sera envoyé à tous les participants.</p>
          </div>
          <div><FormLabel>Motif d'annulation</FormLabel><Field as="textarea" value={cancelForm.reason} onChange={e=>setCancelForm(f=>({...f,reason:e.target.value}))} placeholder="Raison (facultatif)…" rows={3} style={{resize:'vertical',lineHeight:1.6}}/></div>
          <ModalFooter onCancel={()=>setCancelModal(null)} onConfirm={handleCancel} cancelLabel="Conserver" confirmLabel="Annuler la réunion" danger/>
        </div>
      </Modal>

      <Modal open={!!postponeModal} onClose={()=>setPostponeModal(null)} title="Reporter la réunion" width={480}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{padding:'12px 14px',background:T.accm,border:`1px solid ${T.accb}`,borderRadius:T.r10}}><p style={{fontSize:13,fontWeight:600,color:T.acc,margin:0,fontFamily:'var(--font-sans)'}}>{meetings.find(m=>m.id===postponeModal)?.title}</p></div>
          <p style={{fontSize:13,color:T.t2,lineHeight:1.7,margin:0}}>Proposez un nouveau créneau. Le statut passera à <strong style={{color:T.t1}}>"Reportée"</strong> en attendant confirmation.</p>
          <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:12}}>
            <div><FormLabel required>Nouvelle date</FormLabel><Field type="date" value={postponeForm.date} onChange={e=>setPostponeForm(f=>({...f,date:e.target.value}))} style={{colorScheme:'light'}}/></div>
            <div><FormLabel>Nouvel horaire</FormLabel><Field type="time" value={postponeForm.time} onChange={e=>setPostponeForm(f=>({...f,time:e.target.value}))} style={{colorScheme:'light'}}/></div>
          </div>
          <div><FormLabel>Motif du report</FormLabel><Field as="textarea" value={postponeForm.reason} onChange={e=>setPostponeForm(f=>({...f,reason:e.target.value}))} placeholder="Raison (facultatif)…" rows={2} style={{resize:'vertical'}}/></div>
          <ModalFooter onCancel={()=>setPostponeModal(null)} onConfirm={handlePostpone} cancelLabel="Annuler" confirmLabel="Valider le report"/>
        </div>
      </Modal>

      <MinutesModal open={!!minutesModal} onClose={()=>setMinutesModal(null)} meeting={meetings.find(m=>m.id===minutesModal)} form={minutesForm} setForm={setMinutesForm} onSave={handleSaveMinutes}/>
    </div>
  );
}