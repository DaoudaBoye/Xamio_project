/**
 * Xamio — EventsPage v2
 * Design: inspiré de MeetingsPage — Refined Clarity (Linear × Arc)
 * Tokens CSS identiques, mêmes patterns d'architecture
 */

import React, {
  useState, useMemo, useRef, useEffect, useCallback, memo,
} from 'react';
import { useNotif } from '../../../context/NotifContext';

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
  @media (max-width: 700px) {
    .xm-grid-list   { grid-template-columns: 1fr !important; }
    .xm-filters-row { flex-direction: column; align-items: stretch !important; }
    .xm-stats-row   { grid-template-columns: repeat(2, 1fr) !important; }
    .xm-header-row  { flex-direction: column; align-items: flex-start !important; }
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
   DESIGN TOKENS
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

  type: {
    launch:     { label:'Lancement',   fg:'var(--color-accent)',  bg:'var(--color-accent-bg)',  dot:'var(--color-accent)',  border:'var(--color-accent-border)'  },
    conference: { label:'Conférence',  fg:'var(--color-purple)',  bg:'var(--color-purple-bg)',  dot:'var(--color-purple)',  border:'var(--color-purple-border)'  },
    internal:   { label:'Interne',     fg:'var(--color-success)', bg:'var(--color-success-bg)', dot:'var(--color-success)', border:'var(--color-success-border)' },
    webinar:    { label:'Webinar',     fg:'var(--color-warning)', bg:'var(--color-warning-bg)', dot:'var(--color-warning)', border:'var(--color-warning-border)' },
    workshop:   { label:'Workshop',    fg:'var(--color-danger)',  bg:'var(--color-danger-bg)',  dot:'var(--color-danger)',  border:'var(--color-danger-border)'  },
  },
  status: {
    confirmed: { label:'Confirmé',  fg:'var(--color-success)', bg:'var(--color-success-bg)', dot:'var(--color-success)', border:'var(--color-success-border)' },
    planned:   { label:'Planifié',  fg:'var(--color-accent)',  bg:'var(--color-accent-bg)',  dot:'var(--color-accent)',  border:'var(--color-accent-border)'  },
    cancelled: { label:'Annulé',    fg:'var(--color-danger)',  bg:'var(--color-danger-bg)',  dot:'var(--color-danger)',  border:'var(--color-danger-border)'  },
  },
  r6:'var(--radius-medium)', r8:'var(--radius-large)', r10:'10px',
  r12:'var(--radius-xlarge)', r14:'14px', r16:'16px', r20:'20px', r24:'24px',
  shadowDropdown:'var(--shadow-dropdown)', shadowModal:'var(--shadow-modal)',
};

const INITIAL_EVENTS = [
  { id:'ev1', title:'Lancement officiel XAMIO v1.0', date:'2025-04-15', time:'18:00', location:'Hôtel Terrou-Bi, Dakar', type:'launch', attendees:120, description:'Soirée de lancement de la plateforme XAMIO avec démos live, networking et cocktail.', status:'confirmed', cover:'🚀', organizer:'Moussa Diallo' },
  { id:'ev2', title:'Conférence Tech Africa 2025', date:'2025-05-08', time:'09:00', location:'CICAD, Dakar', type:'conference', attendees:450, description:"Participation au panel \"SaaS et Transformation digitale en Afrique de l'Ouest\".", status:'confirmed', cover:'🎤', organizer:'Fatou Ndiaye' },
  { id:'ev3', title:'Team Building Équipe XAMIO', date:'2025-04-22', time:'10:00', location:'Saly Portudal', type:'internal', attendees:18, description:"Journée de cohésion d'équipe : activités, retrospective et vision 2025.", status:'planned', cover:'🏖', organizer:'Ibrahima Sow' },
  { id:'ev4', title:'Webinar — Gestion de réunions avec l\'IA', date:'2025-04-03', time:'14:00', location:'En ligne (Zoom)', type:'webinar', attendees:80, description:'Démonstration des fonctionnalités IA de XAMIO pour les prospects.', status:'confirmed', cover:'💻', organizer:'Aïssatou Ba' },
];

const TYPE_FILTERS = [
  { v:'all', l:'Tous les types' }, { v:'launch', l:'Lancement' },
  { v:'conference', l:'Conférence' }, { v:'internal', l:'Interne' },
  { v:'webinar', l:'Webinar' }, { v:'workshop', l:'Workshop' },
];
const STATUS_FILTERS = [
  { v:'all', l:'Tous les statuts' }, { v:'confirmed', l:'Confirmé' },
  { v:'planned', l:'Planifié' }, { v:'cancelled', l:'Annulé' },
];
const STAT_CONFIG = [
  { key:'confirmed', label:'Confirmés',  dot:'var(--color-success)' },
  { key:'planned',   label:'Planifiés',  dot:'var(--color-accent)'  },
  { key:'cancelled', label:'Annulés',    dot:'var(--color-danger)'  },
];

/* ════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════ */
function formatDate(str) { if(!str) return '—'; const[y,m,d]=str.split('-'); return`${d}/${m}/${y}`; }
function initials(name='') { return name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase(); }
function hashColor(str='') {
  let h=0; for(let i=0;i<str.length;i++) h=(h*31+str.charCodeAt(i))&0xffffffff;
  return ['#2E70D9','#E07B2A','#3D9A6F','#7B60C8','#B0443A','#2A8FA8','#C85070','#4A8C4A'][Math.abs(h)%8];
}
function useHover() { const[h,set]=useState(false); return[h,{onMouseEnter:()=>set(true),onMouseLeave:()=>set(false)}]; }
function useOutsideClick(ref,cb) {
  useEffect(()=>{ const fn=e=>{if(ref.current&&!ref.current.contains(e.target))cb();}; document.addEventListener('mousedown',fn); return()=>document.removeEventListener('mousedown',fn); },[ref,cb]);
}

function useInsights(events) {
  return useMemo(()=>{
    const total=events.length;
    const totalAttendees=events.reduce((s,e)=>s+(parseInt(e.attendees)||0),0);
    const byStatus=STATUS_FILTERS.slice(1).reduce((acc,f)=>{acc[f.v]=events.filter(e=>e.status===f.v).length;return acc;},{});
    const next=events.filter(e=>e.status!=='cancelled').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0]||null;
    return{total,totalAttendees,byStatus,next};
  },[events]);
}

/* ════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════ */
const Ic = {
  plus:      ()=><svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  dots:      ()=><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="1.4" fill="currentColor"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/><circle cx="13" cy="8" r="1.4" fill="currentColor"/></svg>,
  cal:       ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  clk:       ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  loc:       ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a4.5 4.5 0 014.5 4.5c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 018 1.5z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  users:     ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="11.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M13.5 13c0-2-.9-3.76-2.26-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  check:     ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trash:     ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M5 5l.5 8h5L11 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  send:      ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M14 2L2 7l5 2 2 5 5-12z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  warn:      ()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2L14.5 13H1.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  search:    ()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  close:     ()=><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  lightning: ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M9 1L3 9h5l-1 6 6-8H8l1-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  chevDown:  ()=><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevRight: ()=><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  filter:    ()=><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M4 8h8M6 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  edit:      ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
};

/* ════════════════════════════════════════════════════════════════
   ATOMS
   ════════════════════════════════════════════════════════════════ */
function IconBtn({ children, onClick, active, danger, title, size=28 }) {
  const [h,hp]=useHover();
  return <button onClick={onClick} title={title} {...hp} style={{width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center',background:active?T.bg3:h?T.bg2:'transparent',border:`1px solid ${active||h?T.bd1:'transparent'}`,borderRadius:T.r6,cursor:'pointer',flexShrink:0,color:danger&&h?'var(--color-danger)':active?T.t1:h?T.t2:T.t3,transition:'all .13s'}}>{children}</button>;
}

function Avatar({ name='', size=22 }) {
  const color=hashColor(name); const bg=color+'22';
  return <span style={{width:size,height:size,borderRadius:'50%',background:bg,border:`1.5px solid ${color}44`,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:size*0.38,fontWeight:700,color,flexShrink:0,lineHeight:1,fontFamily:'var(--font-sans)'}}>{initials(name)}</span>;
}

function TypePill({ typeKey }) {
  const c=T.type[typeKey]||T.type.internal;
  return <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'2px 8px',borderRadius:T.r20,background:c.bg,fontSize:10,fontWeight:600,color:c.fg,border:`1px solid ${c.border}`,whiteSpace:'nowrap',letterSpacing:'.03em'}}><span style={{width:4,height:4,borderRadius:'50%',background:c.dot,flexShrink:0}}/>{c.label}</span>;
}

function StatusPill({ statusKey }) {
  const c=T.status[statusKey]||T.status.planned;
  return <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'2px 8px',borderRadius:T.r20,background:c.bg,fontSize:10,fontWeight:500,color:c.fg,border:`1px solid ${c.border}`,whiteSpace:'nowrap'}}><span style={{width:4,height:4,borderRadius:'50%',background:c.dot,flexShrink:0}}/>{c.label}</span>;
}

function Field({ as:As='input', style, ...props }) {
  const[f,sf]=useState(false);
  return <As {...props} style={{width:'100%',background:T.bg3,border:`1px solid ${f?T.bd2:T.bd0}`,borderRadius:T.r8,padding:As==='textarea'?'9px 13px':'0 13px',height:As==='textarea'?undefined:36,color:T.t1,fontSize:13,lineHeight:1.6,outline:'none',fontFamily:'var(--font-sans)',boxSizing:'border-box',transition:'border-color .15s, box-shadow .15s',boxShadow:f?`0 0 0 3px ${T.accm}`:'none',caretColor:'var(--color-warning)',...style}} onFocus={()=>sf(true)} onBlur={()=>sf(false)}/>;
}

function PrimaryBtn({ children, onClick, danger, small }) {
  const[h,hp]=useHover(); const bg=danger?(h?'var(--color-danger)':'var(--color-danger)'):(h?T.acc2:T.acc);
  return <button onClick={onClick} {...hp} style={{display:'inline-flex',alignItems:'center',gap:6,padding:small?'6px 14px':'9px 18px',borderRadius:T.r8,border:'none',background:bg,color:'#FFFFFF',fontSize:small?12:13,fontWeight:700,cursor:'pointer',fontFamily:'var(--font-sans)',transition:'all .15s',boxShadow:h?`0 4px 20px ${T.acc}55`:`0 2px 8px ${T.acc}33`,transform:h?'translateY(-1px)':'none',whiteSpace:'nowrap'}}>{children}</button>;
}

function GhostBtn({ children, onClick }) {
  const[h,hp]=useHover();
  return <button onClick={onClick} {...hp} style={{padding:'8px 16px',borderRadius:T.r8,border:`1px solid ${T.bd1}`,background:h?T.bg2:'transparent',fontSize:13,fontWeight:450,color:h?T.t1:T.t2,cursor:'pointer',fontFamily:'var(--font-sans)',transition:'all .15s',whiteSpace:'nowrap'}}>{children}</button>;
}

function FormLabel({ children, required }) {
  return <label style={{display:'block',fontSize:12,fontWeight:500,color:T.t2,marginBottom:5}}>{children}{required&&<span style={{color:'var(--color-danger)',marginLeft:3}}>*</span>}</label>;
}

/* ── Dropdown ── */
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

/* ── Action Menu ── */
function ActionMenu({ event, onDelete, onInvite, onConfirm, onCancel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, useCallback(() => setOpen(false), []));

  const items = [];
  if (event.status !== 'cancelled') {
    items.push({ icon:<Ic.send/>, label:'Envoyer les invitations', fn:onInvite });
    if (event.status === 'planned') items.push({ icon:<Ic.check/>, label:'Confirmer l\'événement', fn:onConfirm });
    if (event.status === 'confirmed') items.push({ icon:<Ic.edit/>, label:'Modifier', fn:() => {} });
    items.push({ sep:true });
    items.push({ icon:<Ic.trash/>, label:'Annuler l\'événement', fn:onCancel, danger:true });
  }
  items.push({ sep: items.length > 0 });
  items.push({ icon:<Ic.trash/>, label:'Supprimer', fn:onDelete, danger:true });

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

function ActionItem({ icon, label, danger, onClick }) {
  const[h,hp]=useHover(); const color=danger?'var(--color-danger)':T.t2;
  return <button onClick={onClick} {...hp} style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'7px 10px',borderRadius:T.r6,border:'none',background:h?(danger?'rgba(240,112,112,.07)':T.bg3):'transparent',cursor:'pointer',fontSize:12.5,fontWeight:450,color,fontFamily:'var(--font-sans)',textAlign:'left',transition:'all .1s'}}><span style={{lineHeight:0,opacity:.85,flexShrink:0}}>{icon}</span>{label}</button>;
}

/* ── Modal ── */
function Modal({ open, onClose, title, width=520, children }) {
  useEffect(()=>{document.body.style.overflow=open?'hidden':'';return()=>{document.body.style.overflow='';};},[open]);
  if(!open) return null;
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
   STATS HEADER
   ════════════════════════════════════════════════════════════════ */
function StatsHeader({ events, insights }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))',gap:10,marginBottom:24}} className="xm-stats-row">
      <StatCard value={insights.total} label="Événements" accent={T.acc}
        sub={<><span style={{color:T.t3,fontSize:11,display:'flex',alignItems:'center',gap:4}}><Ic.users/><span style={{fontFamily:'var(--font-mono)'}}>{insights.totalAttendees}</span><span style={{marginLeft:2}}>participants au total</span></span></>}
      />
      {STAT_CONFIG.map(({key,label,dot})=>{
        const n=insights.byStatus[key]||0; const pct=insights.total>0?Math.round(n/insights.total*100):0;
        return <StatCard key={key} value={n} label={label} accent={dot} pct={pct}/>;
      })}
    </div>
  );
}

function StatCard({ value, label, accent, pct, sub }) {
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

/* ── Next Event Banner ── */
function NextEventBanner({ event, onClick }) {
  const[h,hp]=useHover(); if(!event) return null;
  return (
    <div {...hp} onClick={onClick} style={{marginBottom:20,padding:'12px 16px',borderRadius:T.r12,cursor:'pointer',background:T.bg1,border:`1px solid ${T.bd0}`,display:'flex',alignItems:'center',gap:14,transition:'all .15s',boxShadow:h?T.shadowDropdown:'none'}}>
      <div style={{width:38,height:38,borderRadius:T.r8,flexShrink:0,background:T.accm,border:`1px solid ${T.accb}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{event.cover}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}><span style={{fontSize:10.5,fontWeight:700,color:T.acc,letterSpacing:'.08em',textTransform:'uppercase',display:'flex',alignItems:'center',gap:4}}><Ic.lightning/>Prochain événement</span><TypePill typeKey={event.type}/></div>
        <div style={{fontSize:13,fontWeight:600,color:T.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{event.title}</div>
        <div style={{display:'flex',gap:12,fontSize:11,color:T.t3,marginTop:3,fontFamily:'var(--font-mono)'}}><span>{formatDate(event.date)}</span><span>{event.time||'—'}</span>{event.location&&<span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'var(--font-sans)'}}>{event.location}</span>}</div>
      </div>
      <span style={{color:T.t3,lineHeight:0,flexShrink:0}}><Ic.chevRight/></span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   FILTERS BAR
   ════════════════════════════════════════════════════════════════ */
function FiltersBar({ query, setQuery, typeFilter, setTypeFilter, statusFilter, setStatusFilter, activeCount }) {
  const hasActiveFilters = typeFilter!=='all' || statusFilter!=='all' || query!=='';
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
        <Dropdown label="Type" icon={<Ic.filter/>} options={TYPE_FILTERS} value={typeFilter} onChange={setTypeFilter}/>
        <Dropdown label="Statut" icon={<Ic.filter/>} options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter}/>
        {hasActiveFilters&&<button onClick={()=>{setQuery('');setTypeFilter('all');setStatusFilter('all');}} style={{display:'flex',alignItems:'center',gap:5,padding:'0 10px',height:34,borderRadius:T.r8,border:`1px solid ${T.bd0}`,background:'transparent',color:T.t3,fontSize:12,cursor:'pointer',fontFamily:'var(--font-sans)',transition:'all .13s',whiteSpace:'nowrap'}} onMouseEnter={e=>{e.currentTarget.style.color=T.t1;e.currentTarget.style.borderColor=T.bd1;}} onMouseLeave={e=>{e.currentTarget.style.color=T.t3;e.currentTarget.style.borderColor=T.bd0;}}><Ic.close/> Réinitialiser</button>}
      </div>
      {(typeFilter!=='all'||statusFilter!=='all')&&<div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
        {typeFilter!=='all'&&<ActiveChip label={TYPE_FILTERS.find(f=>f.v===typeFilter)?.l} onRemove={()=>setTypeFilter('all')}/>}
        {statusFilter!=='all'&&<ActiveChip label={STATUS_FILTERS.find(f=>f.v===statusFilter)?.l} onRemove={()=>setStatusFilter('all')}/>}
        <span style={{fontSize:11,color:T.t3,display:'flex',alignItems:'center',marginLeft:2}}>{activeCount} résultat{activeCount!==1?'s':''}</span>
      </div>}
    </div>
  );
}

function ActiveChip({ label, onRemove }) {
  return <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'2px 8px 2px 10px',borderRadius:T.r20,background:T.accm,border:`1px solid ${T.accb}`,fontSize:11,fontWeight:500,color:T.acc}}>{label}<button onClick={onRemove} style={{background:'none',border:'none',cursor:'pointer',color:T.acc,lineHeight:0,padding:1,opacity:.7,transition:'opacity .1s'}} onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='.7'}><Ic.close/></button></span>;
}

/* ════════════════════════════════════════════════════════════════
   EVENT CARD
   ════════════════════════════════════════════════════════════════ */
const EventCard = memo(function EventCard({ ev, isNext, index, onDelete, onInvite, onConfirm, onCancel, onClick }) {
  const[h,hp]=useHover(); const isCancelled=ev.status==='cancelled';
  const borderColor=isNext&&!isCancelled?T.acc:h&&!isCancelled?T.bd2:isCancelled?'rgba(240,112,112,.15)':T.bd0;
  return (
    <article className="xm-card-enter" {...(isCancelled?{}:hp)} onClick={isCancelled?undefined:onClick}
      style={{background:h&&!isCancelled?T.bg2:T.bg1,border:`1px solid ${borderColor}`,borderRadius:T.r12,padding:'15px 16px',cursor:isCancelled?'default':'pointer',opacity:isCancelled?.55:1,position:'relative',overflow:'hidden',transition:'border-color .18s, box-shadow .18s, background .18s',boxShadow:isNext&&!isCancelled?`0 0 0 1px ${T.acc}33, 0 4px 20px ${T.acc}12`:h&&!isCancelled?T.shadowDropdown:'none',animationDelay:`${index*35}ms`,minWidth:0}}>
      {isNext&&!isCancelled&&<div style={{position:'absolute',left:0,top:0,width:2,height:'100%',background:T.acc,borderRadius:'0 1px 1px 0'}}/>}

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0}}>
          <div style={{width:42,height:42,borderRadius:10,background:T.bg3,border:`1px solid ${T.bd0}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{ev.cover}</div>
          <div style={{minWidth:0}}>
            <h3 style={{fontSize:13.5,fontWeight:600,lineHeight:1.4,marginBottom:6,color:isCancelled?T.t3:T.t1,textDecoration:isCancelled?'line-through':'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'var(--font-sans)'}}>{ev.title}</h3>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
              <TypePill typeKey={ev.type}/>
              <StatusPill statusKey={ev.status}/>
              {isNext&&!isCancelled&&<span style={{fontSize:10,fontWeight:700,color:T.acc,letterSpacing:'.07em',textTransform:'uppercase',display:'flex',alignItems:'center',gap:3}}><Ic.lightning/>Prochain</span>}
            </div>
          </div>
        </div>
        {!isCancelled&&<ActionMenu event={ev} onDelete={onDelete} onInvite={onInvite} onConfirm={onConfirm} onCancel={onCancel}/>}
      </div>

      {/* Meta */}
      <div style={{display:'flex',gap:10,fontSize:11,color:T.t3,flexWrap:'wrap',alignItems:'center',fontFamily:'var(--font-mono)'}}>
        <MetaItem icon={<Ic.cal/>}>{formatDate(ev.date)}</MetaItem>
        <MetaItem icon={<Ic.clk/>}>{ev.time||'—'}</MetaItem>
        {ev.location&&<MetaItem icon={<Ic.loc/>} style={{fontFamily:'var(--font-sans)',flex:'1 1 0',minWidth:0}}><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}}>{ev.location}</span></MetaItem>}
      </div>

      {/* Organizer + attendees */}
      {(ev.organizer||ev.attendees>0)&&<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:10,paddingTop:10,borderTop:`1px solid ${T.bd0}`}}>
        {ev.organizer&&<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar name={ev.organizer} size={18}/><span style={{fontSize:11,color:T.t3}}>{ev.organizer}</span></div>}
        {ev.attendees>0&&<div style={{display:'flex',alignItems:'center',gap:5,background:T.bg3,border:`1px solid ${T.bd0}`,borderRadius:T.r20,padding:'2px 8px'}}><span style={{color:T.t3,lineHeight:0,fontSize:10}}><Ic.users/></span><span style={{fontSize:11,fontFamily:'var(--font-mono)',fontWeight:600,color:T.t2}}>{ev.attendees}</span></div>}
      </div>}

      {/* Annulé */}
      {isCancelled&&<div style={{marginTop:10,padding:'7px 10px',borderRadius:T.r8,background:'rgba(240,112,112,.07)',border:'1px solid rgba(240,112,112,.18)'}}><p style={{fontSize:11.5,fontWeight:600,color:'var(--color-danger)',margin:0,display:'flex',alignItems:'center',gap:6}}><Ic.warn/>Événement annulé</p></div>}
    </article>
  );
});

function MetaItem({ icon, children, style }) {
  return <span style={{display:'flex',alignItems:'center',gap:4,...style}}><span style={{lineHeight:0,opacity:.6,flexShrink:0}}>{icon}</span>{children}</span>;
}

/* ════════════════════════════════════════════════════════════════
   EMPTY STATE
   ════════════════════════════════════════════════════════════════ */
function EmptyState({ hasQuery, onAction }) {
  return (
    <div style={{textAlign:'center',padding:'72px 24px',background:T.bg1,borderRadius:T.r16,border:`1px solid ${T.bd0}`}}>
      <div style={{width:52,height:52,borderRadius:14,background:T.accm,border:`1px solid ${T.accb}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',fontSize:24}}>📅</div>
      <p style={{fontSize:14,fontWeight:600,color:T.t1,marginBottom:6,fontFamily:'var(--font-sans)'}}>{hasQuery?'Aucun résultat':'Aucun événement'}</p>
      <p style={{fontSize:13,color:T.t3,maxWidth:300,margin:'0 auto 20px',lineHeight:1.7}}>{hasQuery?'Modifiez vos filtres ou votre recherche.':'Créez votre premier événement interne ou externe.'}</p>
      {!hasQuery&&<PrimaryBtn onClick={onAction}><Ic.plus/> Créer un événement</PrimaryBtn>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CREATE MODAL
   ════════════════════════════════════════════════════════════════ */
const EMPTY_FORM = { title:'', date:'', time:'', location:'', type:'internal', attendees:'', description:'', organizer:'' };

function CreateEventModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const handleCreate = () => {
    if(!form.title||!form.date) return;
    onCreate(form);
    setForm(EMPTY_FORM);
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Créer un événement" width={560}>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div><FormLabel required>Titre</FormLabel><Field value={form.title} onChange={set('title')} placeholder="Nom de l'événement"/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div><FormLabel required>Date</FormLabel><Field type="date" value={form.date} onChange={set('date')} style={{colorScheme:'light'}}/></div>
          <div><FormLabel>Heure</FormLabel><Field type="time" value={form.time} onChange={set('time')} style={{colorScheme:'light'}}/></div>
        </div>
        <div><FormLabel>Lieu</FormLabel><Field value={form.location} onChange={set('location')} placeholder="Adresse ou lien de la réunion"/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div>
            <FormLabel>Type</FormLabel>
            <select value={form.type} onChange={set('type')} style={{width:'100%',background:T.bg3,border:`1px solid ${T.bd0}`,borderRadius:T.r8,padding:'0 13px',height:36,color:T.t1,fontSize:13,outline:'none',fontFamily:'var(--font-sans)'}}>
              <option value="internal">Interne</option>
              <option value="launch">Lancement</option>
              <option value="conference">Conférence</option>
              <option value="webinar">Webinar</option>
              <option value="workshop">Workshop</option>
            </select>
          </div>
          <div><FormLabel>Nb. participants</FormLabel><Field type="number" value={form.attendees} onChange={set('attendees')} placeholder="50"/></div>
        </div>
        <div><FormLabel>Organisateur</FormLabel><Field value={form.organizer} onChange={set('organizer')} placeholder="Nom de l'organisateur"/></div>
        <div>
          <FormLabel>Description</FormLabel>
          <Field as="textarea" value={form.description} onChange={set('description')} placeholder="Décrivez l'événement…" rows={4} style={{resize:'vertical',lineHeight:1.7}}/>
        </div>
        <ModalFooter onCancel={onClose} onConfirm={handleCreate} cancelLabel="Annuler" confirmLabel="Créer l'événement"/>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   EVENTS PAGE — MAIN EXPORT
   ════════════════════════════════════════════════════════════════ */
export default function EventsPage() {
  useGlobalStyle();

  const { addToast } = useNotif();

  const [events,      setEvents]      = useState(INITIAL_EVENTS);
  const [query,       setQuery]       = useState('');
  const [typeFilter,  setTypeFilter]  = useState('all');
  const [statusFilter,setStatusFilter]= useState('all');
  const [createModal, setCreateModal] = useState(false);

  const handleCreate = useCallback((form) => {
    const newEvent = {
      id: `ev${Date.now()}`,
      ...form,
      attendees: Number(form.attendees) || 0,
      status: 'planned',
      cover: { launch:'🚀', conference:'🎤', internal:'🏢', webinar:'💻', workshop:'🛠' }[form.type] || '📅',
    };
    setEvents(prev => [...prev, newEvent]);
    addToast('Événement créé !', 'success');
  }, [addToast]);

  const handleDelete = useCallback((id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    addToast('Événement supprimé.', 'warning');
  }, [addToast]);

  const handleInvite = useCallback(() => addToast('Invitations envoyées !', 'success'), [addToast]);

  const handleConfirm = useCallback((id) => {
    setEvents(prev => prev.map(e => e.id===id ? {...e, status:'confirmed'} : e));
    addToast('Événement confirmé.', 'success');
  }, [addToast]);

  const handleCancel = useCallback((id) => {
    setEvents(prev => prev.map(e => e.id===id ? {...e, status:'cancelled'} : e));
    addToast('Événement annulé.', 'warning');
  }, [addToast]);

  /* Tri : confirmed+planned par date → cancelled */
  const sorted = useMemo(() => {
    const ORDER = { confirmed:0, planned:1, cancelled:2 };
    return [...events].sort((a,b) => {
      const oa=ORDER[a.status]??2, ob=ORDER[b.status]??2;
      if(oa!==ob) return oa-ob;
      return (a.date+a.time).localeCompare(b.date+b.time);
    });
  }, [events]);

  const filtered = useMemo(() => {
    const q=query.toLowerCase().trim();
    return sorted.filter(e => {
      const matchQ=!q||(e.title+' '+(e.organizer||'')).toLowerCase().includes(q);
      const matchT=typeFilter==='all'||e.type===typeFilter;
      const matchS=statusFilter==='all'||e.status===statusFilter;
      return matchQ&&matchT&&matchS;
    });
  }, [sorted, query, typeFilter, statusFilter]);

  const insights = useInsights(filtered);
  const nextId = insights.next?.id;

  return (
    <div className="xm-page xm-page-enter" style={{padding:'0 2px',maxWidth:'100%',overflowX:'hidden'}}>
      {/* ── Header ── */}
      <div className="xm-header-row" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,marginBottom:24,flexWrap:'wrap'}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:T.t1,letterSpacing:'-.6px',marginBottom:4,fontFamily:'var(--font-sans)'}}>Événements</h1>
          <p style={{fontSize:13,color:T.t3,fontFamily:'var(--font-sans)'}}>{events.length} événement{events.length!==1?'s':''} au total{(typeFilter!=='all'||statusFilter!=='all'||query)&&` · ${filtered.length} affiché${filtered.length!==1?'s':''}`}</p>
        </div>
        <PrimaryBtn onClick={()=>setCreateModal(true)}><Ic.plus/> Créer un événement</PrimaryBtn>
      </div>

      {/* ── Stats ── */}
      <StatsHeader events={filtered} insights={insights}/>

      {/* ── Next event banner ── */}
      {insights.next&&<NextEventBanner event={insights.next} onClick={()=>{}}/>}

      {/* ── Filters ── */}
      <FiltersBar query={query} setQuery={setQuery} typeFilter={typeFilter} setTypeFilter={setTypeFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} activeCount={filtered.length}/>

      {/* ── List ── */}
      {filtered.length===0
        ? <EmptyState hasQuery={!!query||typeFilter!=='all'||statusFilter!=='all'} onAction={()=>setCreateModal(true)}/>
        : <div className="xm-grid-list">
            {filtered.map((ev,i)=>(
              <EventCard key={ev.id} ev={ev} index={i} isNext={ev.id===nextId}
                onDelete={()=>handleDelete(ev.id)}
                onInvite={()=>handleInvite()}
                onConfirm={()=>handleConfirm(ev.id)}
                onCancel={()=>handleCancel(ev.id)}
                onClick={()=>{}}
              />
            ))}
          </div>
      }

      {/* ── Create Modal ── */}
      <CreateEventModal open={createModal} onClose={()=>setCreateModal(false)} onCreate={handleCreate}/>
    </div>
  );
}