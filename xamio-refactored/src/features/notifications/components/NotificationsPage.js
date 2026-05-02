/**
 * Xamio — NotificationsPage v2
 * Architecture : calquée sur MeetingsPage (tokens T, Ic, patterns)
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
  @media (max-width: 700px) {
    .xm-notif-header { flex-direction: column; align-items: flex-start !important; }
    .xm-stats-row    { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @keyframes xm-fade-up   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes xm-bar       { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  @keyframes xm-menu-pop  { from{opacity:0;transform:scale(.96) translateY(-4px)} to{opacity:1;transform:none} }
  @keyframes xm-pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.7)} }
  @keyframes xm-modal-bg  { from{opacity:0} to{opacity:1} }
  @keyframes xm-modal-box { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:none} }
  .xm-notif-enter { animation: xm-fade-up .28s cubic-bezier(.22,1,.36,1) both; }
  .xm-page-enter  { animation: xm-fade-up .24s cubic-bezier(.22,1,.36,1); }
  .xm-scrollbar::-webkit-scrollbar          { width: 5px; }
  .xm-scrollbar::-webkit-scrollbar-track    { background: transparent; }
  .xm-scrollbar::-webkit-scrollbar-thumb    { background: var(--color-background-hover); border-radius: 99px; }
`;

function useGlobalStyle() {
  useEffect(() => {
    const id = 'xm-notif-global';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = GLOBAL_CSS;
      document.head.appendChild(s);
    }
  }, []);
}

/* ════════════════════════════════════════════════════════════════
   TOKENS
   ════════════════════════════════════════════════════════════════ */
const T = {
  bg1:'var(--color-background-secondary)',
  bg2:'var(--color-background-tertiary)',
  bg3:'var(--color-background-elevated)',
  bd0:'var(--color-border)', bd1:'var(--color-border-medium)', bd2:'var(--color-border-strong)',
  t1:'var(--color-text-primary)', t2:'var(--color-text-secondary)', t3:'var(--color-text-muted)',
  acc:  '#E8500A',
  acc2: '#C94108',
  accm: 'rgba(232,80,10,0.08)',
  accb: 'rgba(232,80,10,0.22)',
  r6:'var(--radius-medium)', r8:'var(--radius-large)', r10:'10px',
  r12:'var(--radius-xlarge)', r14:'14px', r16:'16px', r20:'20px',
  shadowDropdown:'var(--shadow-dropdown)', shadowModal:'var(--shadow-modal)',

  notifType: {
    reminder:    { label:'Rappel',       fg:'var(--color-warning)', bg:'var(--color-warning-bg)', dot:'var(--color-warning)', border:'var(--color-warning-border)' },
    document:    { label:'Document',     fg:'var(--color-accent)',  bg:'var(--color-accent-bg)',  dot:'var(--color-accent)',  border:'var(--color-accent-border)'  },
    task:        { label:'Tâche',        fg:'var(--color-success)', bg:'var(--color-success-bg)', dot:'var(--color-success)', border:'var(--color-success-border)' },
    appointment: { label:'Rendez-vous',  fg:'var(--color-purple)',  bg:'var(--color-purple-bg)',  dot:'var(--color-purple)',  border:'var(--color-purple-border)'  },
    ai:          { label:'IA',           fg:'var(--color-purple)',  bg:'var(--color-purple-bg)',  dot:'var(--color-purple)',  border:'var(--color-purple-border)'  },
    user:        { label:'Utilisateur',  fg:'var(--color-accent)',  bg:'var(--color-accent-bg)',  dot:'var(--color-accent)',  border:'var(--color-accent-border)'  },
    system:      { label:'Système',      fg:'var(--color-text-muted)', bg:'var(--color-background-tertiary)', dot:'var(--color-text-muted)', border:'var(--color-border)' },
  },
};

/* ════════════════════════════════════════════════════════════════
   DATA
   ════════════════════════════════════════════════════════════════ */
const INITIAL = [
  { id:'n1', read:false, type:'reminder',    title:'Rappel réunion',         body:'Sprint planning — Module IA dans 1 heure.',                      time:'il y a 30 min',  category:'reminder'   },
  { id:'n2', read:false, type:'document',    title:'Document partagé',       body:'F. Ndiaye a partagé "Roadmap 2025 — détaillée.xlsx" avec vous.',  time:'il y a 2h',      category:'document'   },
  { id:'n3', read:true,  type:'task',        title:'Tâche terminée',         body:'"Auth JWT + 2FA" marquée comme terminée par Backend dev.',         time:'il y a 4h',      category:'task'       },
  { id:'n4', read:true,  type:'appointment', title:'Nouveau rendez-vous',    body:'RDV "Démo produit — CBAO" ajouté le 26 mars à 11h00.',             time:'hier',           category:'appointment'},
  { id:'n5', read:false, type:'ai',          title:'Résumé IA disponible',   body:'Le résumé de la réunion "Réunion de board" est prêt à consulter.', time:'hier',           category:'ai'         },
  { id:'n6', read:true,  type:'user',        title:'Nouvel utilisateur',     body:"M. Sow a rejoint l'espace de travail XAMIO.",                      time:'avant-hier',     category:'user'       },
  { id:'n7', read:false, type:'reminder',    title:'Rappel rendez-vous',     body:'RDV "Réunion partenariat — Orange Money" demain à 15h30.',         time:'avant-hier',     category:'reminder'   },
  { id:'n8', read:true,  type:'system',      title:'Mise à jour système',    body:'XAMIO v1.0.2 déployé. Nouvelles fonctionnalités disponibles.',     time:'il y a 3 jours', category:'system'     },
];

const CATEGORIES = [
  { v:'all',         l:'Toutes'       },
  { v:'reminder',    l:'Rappels'      },
  { v:'document',    l:'Documents'    },
  { v:'task',        l:'Tâches'       },
  { v:'appointment', l:'Rendez-vous'  },
  { v:'ai',          l:'IA'           },
  { v:'user',        l:'Utilisateurs' },
  { v:'system',      l:'Système'      },
];

const STAT_CONFIG = [
  { key:'reminder',    label:'Rappels'     },
  { key:'document',    label:'Documents'   },
  { key:'task',        label:'Tâches'      },
  { key:'appointment', label:'RDV'         },
];

/* ════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════ */
const Ic = {
  check:   ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trash:   ()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M5 5l.5 8h5L11 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close:   ()=><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  search:  ()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  checkAll:()=><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M1 8l3.5 3.5L11 5M5 8l3.5 3.5L15 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  bell:    ()=><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a5 5 0 015 5v3l1 1.5H2L3 9.5v-3a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6.5 13.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.5"/></svg>,
  ai:      ()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2a6 6 0 100 12A6 6 0 008 2z" stroke="currentColor" strokeWidth="1.4"/><path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>,
  doc:     ()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 2h6l3 3v9H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 2v3h3M6 8h5M6 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  task:    ()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  cal:     ()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  user:    ()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  settings:()=><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  chevDown:()=><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  filter:  ()=><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M4 8h8M6 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
};

const TYPE_ICON = {
  reminder:    <Ic.bell/>,
  document:    <Ic.doc/>,
  task:        <Ic.task/>,
  appointment: <Ic.cal/>,
  ai:          <Ic.ai/>,
  user:        <Ic.user/>,
  system:      <Ic.settings/>,
};

/* ════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════ */
function useHover() { const[h,set]=useState(false); return[h,{onMouseEnter:()=>set(true),onMouseLeave:()=>set(false)}]; }
function useOutsideClick(ref,cb) {
  useEffect(()=>{ const fn=e=>{if(ref.current&&!ref.current.contains(e.target))cb();}; document.addEventListener('mousedown',fn); return()=>document.removeEventListener('mousedown',fn); },[ref,cb]);
}

function useInsights(notifs) {
  return useMemo(()=>{
    const total    = notifs.length;
    const unread   = notifs.filter(n=>!n.read).length;
    const byType   = STAT_CONFIG.reduce((acc,{key})=>{ acc[key]=notifs.filter(n=>n.type===key).length; return acc; },{});
    return { total, unread, byType };
  },[notifs]);
}

/* ════════════════════════════════════════════════════════════════
   ATOMS
   ════════════════════════════════════════════════════════════════ */
function IconBtn({ children, onClick, active, danger, title, size=28 }) {
  const[h,hp]=useHover();
  return <button onClick={onClick} title={title} {...hp} style={{width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center',background:active?T.bg3:h?T.bg2:'transparent',border:`1px solid ${active||h?T.bd1:'transparent'}`,borderRadius:T.r6,cursor:'pointer',flexShrink:0,color:danger&&h?'var(--color-danger)':active?T.t1:h?T.t2:T.t3,transition:'all .13s'}}>{children}</button>;
}

function PrimaryBtn({ children, onClick, danger }) {
  const[h,hp]=useHover(); const bg=danger?(h?'var(--color-danger)':'var(--color-danger)'):(h?T.acc2:T.acc);
  return <button onClick={onClick} {...hp} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:T.r8,border:'none',background:bg,color:'#FFF',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'var(--font-sans)',transition:'all .15s',whiteSpace:'nowrap'}}>{children}</button>;
}

function GhostBtn({ children, onClick, icon }) {
  const[h,hp]=useHover();
  return <button onClick={onClick} {...hp} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 12px',borderRadius:T.r8,border:`1px solid ${T.bd1}`,background:h?T.bg2:'transparent',fontSize:12,fontWeight:500,color:h?T.t1:T.t2,cursor:'pointer',fontFamily:'var(--font-sans)',transition:'all .15s',whiteSpace:'nowrap'}}>{icon&&<span style={{lineHeight:0,opacity:.7}}>{icon}</span>}{children}</button>;
}

function Toggle({ value, onChange }) {
  const[h,hp]=useHover();
  return (
    <button onClick={()=>onChange(!value)} {...hp} role="switch" aria-checked={value}
      style={{width:36,height:20,borderRadius:10,background:value?T.acc:T.bg3,border:`1px solid ${value?T.accb:T.bd1}`,cursor:'pointer',position:'relative',transition:'background .2s, border-color .2s',flexShrink:0,padding:0}}>
      <span style={{position:'absolute',top:2,left:value?18:2,width:14,height:14,borderRadius:'50%',background:'#FFF',transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.25)'}}/>
    </button>
  );
}

function TypeBadge({ typeKey }) {
  const c=T.notifType[typeKey]||T.notifType.system;
  return <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 7px',borderRadius:T.r20,background:c.bg,fontSize:10,fontWeight:600,color:c.fg,border:`1px solid ${c.border}`,whiteSpace:'nowrap',letterSpacing:'.03em'}}>{c.label}</span>;
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
      {open&&<div style={{position:'absolute',top:40,left:0,zIndex:300,background:T.bg2,border:`1px solid ${T.bd1}`,borderRadius:T.r10,padding:5,minWidth:180,boxShadow:T.shadowDropdown,animation:'xm-menu-pop .14s cubic-bezier(.22,1,.36,1)'}}>
        {options.map(o=>{const sel=o.v===value;return(
          <button key={o.v} onClick={()=>{onChange(o.v);setOpen(false);}}
            style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:T.r6,border:'none',background:'transparent',color:sel?T.t1:T.t2,fontSize:12.5,fontWeight:sel?500:400,cursor:'pointer',fontFamily:'var(--font-sans)',textAlign:'left',transition:'background .1s'}}
            onMouseEnter={e=>e.currentTarget.style.background=T.bg3}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            {o.l}{sel&&<span style={{color:T.acc,lineHeight:0}}><Ic.check/></span>}
          </button>
        );})}
      </div>}
    </div>
  );
}

function ActiveChip({ label, onRemove }) {
  return <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'2px 8px 2px 10px',borderRadius:T.r20,background:T.accm,border:`1px solid ${T.accb}`,fontSize:11,fontWeight:500,color:T.acc}}>
    {label}
    <button onClick={onRemove} style={{background:'none',border:'none',cursor:'pointer',color:T.acc,lineHeight:0,padding:1,opacity:.7}} onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='.7'}><Ic.close/></button>
  </span>;
}

/* ════════════════════════════════════════════════════════════════
   STATS HEADER
   ════════════════════════════════════════════════════════════════ */
function StatsHeader({ insights }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(130px,1fr))',gap:10,marginBottom:24}} className="xm-stats-row">
      <StatCard value={insights.total} label="Total" accent={T.acc}
        sub={insights.unread>0
          ? <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,color:T.acc,fontWeight:600}}><span style={{width:6,height:6,borderRadius:'50%',background:T.acc,animation:'xm-pulse-dot 1.8s ease infinite'}}/>{insights.unread} non lue{insights.unread>1?'s':''}</span>
          : <span style={{fontSize:11,color:T.t3}}>Tout est à jour</span>}
      />
      {STAT_CONFIG.map(({key,label})=>{
        const c=T.notifType[key]; const n=insights.byType[key]||0;
        const pct=insights.total>0?Math.round(n/insights.total*100):0;
        return <StatCard key={key} value={n} label={label} accent={c.dot} pct={pct}/>;
      })}
    </div>
  );
}

function StatCard({ value, label, accent, pct, sub }) {
  const[h,hp]=useHover();
  return (
    <div {...hp} style={{background:T.bg1,border:`1px solid ${h?T.bd1:T.bd0}`,borderRadius:T.r12,padding:'14px 16px',transition:'border-color .15s, box-shadow .15s',boxShadow:h?T.shadowDropdown:'none'}}>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:10}}>
        <span style={{fontSize:26,fontWeight:700,color:T.t1,letterSpacing:'-1px',lineHeight:1}}>{value}</span>
        {pct!==undefined&&<span style={{fontSize:11,color:T.t3,fontFamily:'var(--font-mono)',marginBottom:2}}>{pct}%</span>}
      </div>
      {pct!==undefined&&<div style={{height:2,background:T.bg3,borderRadius:99,marginBottom:8,overflow:'hidden'}}><div style={{height:'100%',background:accent,borderRadius:99,width:`${pct}%`,transformOrigin:'left',animation:'xm-bar .7s cubic-bezier(.22,1,.36,1)'}}/></div>}
      <div style={{fontSize:11.5,color:T.t3,fontWeight:500,display:'flex',alignItems:'center',gap:5}}>
        {pct!==undefined&&<span style={{width:6,height:6,borderRadius:'50%',background:accent,flexShrink:0}}/>}{label}
      </div>
      {sub&&<div style={{marginTop:6}}>{sub}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   FILTERS BAR
   ════════════════════════════════════════════════════════════════ */
function FiltersBar({ query, setQuery, catFilter, setCatFilter, onlyUnread, setOnlyUnread, activeCount }) {
  const hasFilters = catFilter!=='all' || query!=='' || onlyUnread;
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        {/* Search */}
        <div style={{position:'relative',flex:'1 1 200px',minWidth:0}}>
          <span style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:T.t3,pointerEvents:'none',lineHeight:0}}><Ic.search/></span>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher dans les notifications…"
            style={{width:'100%',background:T.bg1,border:`1px solid ${T.bd0}`,borderRadius:T.r8,padding:'0 13px 0 35px',height:34,color:T.t1,fontSize:12.5,outline:'none',fontFamily:'var(--font-sans)',boxSizing:'border-box',transition:'border-color .13s, box-shadow .13s',caretColor:'var(--color-warning)'}}
            onFocus={e=>{e.target.style.borderColor=T.bd2;e.target.style.boxShadow=`0 0 0 3px ${T.accm}`;}}
            onBlur={e=>{e.target.style.borderColor=T.bd0;e.target.style.boxShadow='none';}}/>
          {query&&<button onClick={()=>setQuery('')} style={{position:'absolute',right:9,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:T.t3,lineHeight:0,padding:2}}><Ic.close/></button>}
        </div>
        {/* Category */}
        <Dropdown label="Catégorie" icon={<Ic.filter/>} options={CATEGORIES} value={catFilter} onChange={setCatFilter}/>
        {/* Unread toggle */}
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'0 12px',height:34,borderRadius:T.r8,border:`1px solid ${onlyUnread?T.accb:T.bd0}`,background:onlyUnread?T.accm:T.bg1,transition:'all .15s',flexShrink:0}}>
          <span style={{fontSize:12,color:onlyUnread?T.acc:T.t2,fontWeight:onlyUnread?600:400,whiteSpace:'nowrap'}}>Non lues</span>
          <Toggle value={onlyUnread} onChange={setOnlyUnread}/>
        </div>
        {/* Reset */}
        {hasFilters&&<button onClick={()=>{setQuery('');setCatFilter('all');setOnlyUnread(false);}} style={{display:'flex',alignItems:'center',gap:5,padding:'0 10px',height:34,borderRadius:T.r8,border:`1px solid ${T.bd0}`,background:'transparent',color:T.t3,fontSize:12,cursor:'pointer',fontFamily:'var(--font-sans)',transition:'all .13s',whiteSpace:'nowrap'}} onMouseEnter={e=>{e.currentTarget.style.color=T.t1;e.currentTarget.style.borderColor=T.bd1;}} onMouseLeave={e=>{e.currentTarget.style.color=T.t3;e.currentTarget.style.borderColor=T.bd0;}}><Ic.close/> Réinitialiser</button>}
      </div>
      {/* Active chips */}
      {(catFilter!=='all'||onlyUnread)&&(
        <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap',alignItems:'center'}}>
          {catFilter!=='all'&&<ActiveChip label={CATEGORIES.find(c=>c.v===catFilter)?.l} onRemove={()=>setCatFilter('all')}/>}
          {onlyUnread&&<ActiveChip label="Non lues" onRemove={()=>setOnlyUnread(false)}/>}
          <span style={{fontSize:11,color:T.t3,marginLeft:2}}>{activeCount} résultat{activeCount!==1?'s':''}</span>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   NOTIF GROUP (groupement par date)
   ════════════════════════════════════════════════════════════════ */
const TIME_GROUPS = [
  { key:'recent', label:"Aujourd'hui & récentes", match: t => ['il y a 30 min','il y a 2h','il y a 4h'].includes(t) },
  { key:'yesterday', label:'Hier', match: t => t==='hier' },
  { key:'older', label:'Plus ancien', match: t => !['il y a 30 min','il y a 2h','il y a 4h','hier'].includes(t) },
];

function groupNotifs(notifs) {
  return TIME_GROUPS
    .map(g => ({ ...g, items: notifs.filter(n => g.match(n.time)) }))
    .filter(g => g.items.length > 0);
}

/* ════════════════════════════════════════════════════════════════
   NOTIF ROW
   ════════════════════════════════════════════════════════════════ */
const NotifRow = memo(function NotifRow({ n, onRead, onDelete, index }) {
  const[h,hp]=useHover(); const c=T.notifType[n.type]||T.notifType.system;
  return (
    <div className="xm-notif-enter" {...hp}
      style={{display:'flex',gap:14,padding:'14px 16px',background:h?T.bg2:n.read?T.bg1:'transparent',border:`1px solid ${!n.read?c.border:h?T.bd1:T.bd0}`,borderRadius:T.r12,alignItems:'flex-start',transition:'border-color .18s, background .18s, box-shadow .18s',boxShadow:h?T.shadowDropdown:'none',animationDelay:`${index*25}ms`,position:'relative',overflow:'hidden'}}>
      {/* Unread accent bar */}
      {!n.read&&<div style={{position:'absolute',left:0,top:0,width:2,height:'100%',background:c.dot,borderRadius:'0 1px 1px 0'}}/>}

      {/* Icon */}
      <div style={{width:38,height:38,borderRadius:T.r10,background:n.read?T.bg3:c.bg,border:`1px solid ${n.read?T.bd0:c.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:c.fg,transition:'background .18s, border-color .18s'}}>
        {TYPE_ICON[n.type]||<Ic.bell/>}
      </div>

      {/* Content */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,flexWrap:'wrap'}}>
          <span style={{fontSize:13,fontWeight:n.read?500:700,color:T.t1,fontFamily:'var(--font-sans)'}}>{n.title}</span>
          {!n.read&&<span style={{width:6,height:6,borderRadius:'50%',background:c.dot,flexShrink:0,animation:'xm-pulse-dot 2s ease infinite'}}/>}
          <TypeBadge typeKey={n.type}/>
        </div>
        <p style={{fontSize:12.5,color:T.t2,lineHeight:1.6,margin:'0 0 6px',fontFamily:'var(--font-sans)'}}>{n.body}</p>
        <span style={{fontSize:10.5,color:T.t3,fontFamily:'var(--font-mono)'}}>{n.time}</span>
      </div>

      {/* Actions */}
      <div style={{display:'flex',gap:4,flexShrink:0,alignItems:'center'}}>
        {!n.read&&<IconBtn onClick={()=>onRead(n.id)} title="Marquer comme lu"><Ic.check/></IconBtn>}
        <IconBtn onClick={()=>onDelete(n.id)} title="Supprimer" danger><Ic.trash/></IconBtn>
      </div>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════════
   EMPTY STATE
   ════════════════════════════════════════════════════════════════ */
function EmptyState({ hasFilters }) {
  return (
    <div style={{textAlign:'center',padding:'72px 24px',background:T.bg1,borderRadius:T.r16,border:`1px solid ${T.bd0}`}}>
      <div style={{width:52,height:52,borderRadius:14,background:T.accm,border:`1px solid ${T.accb}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',color:T.acc}}><Ic.bell/></div>
      <p style={{fontSize:14,fontWeight:600,color:T.t1,marginBottom:6}}>{hasFilters?'Aucun résultat':'Aucune notification'}</p>
      <p style={{fontSize:13,color:T.t3,maxWidth:280,margin:'0 auto',lineHeight:1.7}}>{hasFilters?'Modifiez vos filtres ou votre recherche.':'Vous êtes à jour. Revenez plus tard.'}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   NOTIFICATIONS PAGE — MAIN EXPORT
   ════════════════════════════════════════════════════════════════ */
export default function NotificationsPage() {
  useGlobalStyle();
  const { addToast } = useNotif();

  const [notifs,     setNotifs]     = useState(INITIAL);
  const [query,      setQuery]      = useState('');
  const [catFilter,  setCatFilter]  = useState('all');
  const [onlyUnread, setOnlyUnread] = useState(false);

  const insights = useInsights(notifs);

  const filtered = useMemo(()=>{
    const q=query.toLowerCase().trim();
    return notifs.filter(n=>{
      const matchQ=!q||(n.title+' '+n.body).toLowerCase().includes(q);
      const matchC=catFilter==='all'||n.category===catFilter;
      const matchR=!onlyUnread||!n.read;
      return matchQ&&matchC&&matchR;
    });
  },[notifs,query,catFilter,onlyUnread]);

  const groups = useMemo(()=>groupNotifs(filtered),[filtered]);

  const markRead    = useCallback(id=>setNotifs(p=>p.map(n=>n.id===id?{...n,read:true}:n)),[]);
  const deleteNotif = useCallback(id=>{ setNotifs(p=>p.filter(n=>n.id!==id)); addToast('Notification supprimée.','info'); },[addToast]);
  const markAllRead = useCallback(()=>{ setNotifs(p=>p.map(n=>({...n,read:true}))); addToast('Toutes marquées comme lues.','success'); },[addToast]);
  const clearAll    = useCallback(()=>{ setNotifs([]); addToast('Notifications effacées.','info'); },[addToast]);

  const hasFilters = catFilter!=='all'||query!==''||onlyUnread;

  return (
    <div className="xm-page xm-page-enter" style={{padding:'0 2px',maxWidth:'100%',overflowX:'hidden'}}>
      {/* ── Header ── */}
      <div className="xm-notif-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,marginBottom:24,flexWrap:'wrap'}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:T.t1,letterSpacing:'-.6px',marginBottom:4,fontFamily:'var(--font-sans)'}}>Notifications</h1>
          <p style={{fontSize:13,color:T.t3}}>
            {insights.unread>0
              ? <><span style={{color:T.acc,fontWeight:600}}>{insights.unread} non lue{insights.unread>1?'s':''}</span> · {insights.total} au total</>
              : `${insights.total} notification${insights.total!==1?'s':''} · tout est à jour`}
          </p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {insights.unread>0&&<GhostBtn onClick={markAllRead} icon={<Ic.checkAll/>}>Tout marquer lu</GhostBtn>}
          {notifs.length>0&&<GhostBtn onClick={clearAll} icon={<Ic.trash/>}>Tout effacer</GhostBtn>}
        </div>
      </div>

      {/* ── Stats ── */}
      <StatsHeader insights={insights}/>

      {/* ── Filters ── */}
      <FiltersBar query={query} setQuery={setQuery} catFilter={catFilter} setCatFilter={setCatFilter} onlyUnread={onlyUnread} setOnlyUnread={setOnlyUnread} activeCount={filtered.length}/>

      {/* ── List ── */}
      {filtered.length===0
        ? <EmptyState hasFilters={hasFilters}/>
        : <div style={{display:'flex',flexDirection:'column',gap:20}}>
            {groups.map(g=>(
              <div key={g.key}>
                {/* Group label */}
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <span style={{fontSize:11,fontWeight:700,color:T.t3,letterSpacing:'.08em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{g.label}</span>
                  <div style={{flex:1,height:'1px',background:T.bd0}}/>
                  <span style={{fontSize:11,color:T.t3,fontFamily:'var(--font-mono)',flexShrink:0}}>{g.items.length}</span>
                </div>
                {/* Rows */}
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {g.items.map((n,i)=>(
                    <NotifRow key={n.id} n={n} index={i} onRead={markRead} onDelete={deleteNotif}/>
                  ))}
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}