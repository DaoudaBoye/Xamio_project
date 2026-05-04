/**
 * Xamio — TasksPage v2.2
 * Icônes artisanales, code optimisé
 */

import React, {
  useState, useMemo, useRef, useEffect, useCallback, memo,
} from 'react';
import ReactDOM from 'react-dom';
import { Modal, Input, Button } from '../../../components/ui/index';
import { useNotif }       from '../../../context/NotifContext';
import { useAuth }        from '../../../context/AuthContext';
import CreateTacheModal   from './CreateTacheModal';

/* ════════════════════════════════════════════════════════════
   GLOBAL CSS
   ════════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  .xm-tasks { font-family: var(--font-sans); }

  @keyframes xm-fade-up  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes xm-bar      { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  @keyframes xm-menu-pop { from{opacity:0;transform:scale(.96) translateY(-4px)} to{opacity:1;transform:none} }
  @keyframes sk-pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }

  .xm-enter      { animation: xm-fade-up .28s cubic-bezier(.22,1,.36,1) both; }
  .xm-card-enter { animation: xm-fade-up .28s cubic-bezier(.22,1,.36,1) both; }

  .kanban-container {
    display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:24px;
  }
  @media(max-width:1024px){ .kanban-container{ grid-template-columns:repeat(2,1fr); } }
  @media(max-width:640px) { .kanban-container{ grid-template-columns:1fr; gap:12px; margin-top:12px; } }

  .kanban-col {
    background:var(--color-background-secondary);
    border:1px solid var(--color-border);
    border-radius:16px; padding:16px; min-height:70vh;
    transition:background .15s,border-color .15s,border-width .15s;
  }
  @media(max-width:640px){ .kanban-col{ min-height:unset; padding:12px; border-radius:12px; } }
  .kanban-col.over { background:var(--color-background-tertiary); border-color:#E8500A; border-width:2px; }

  .task-card {
    background:var(--color-background-primary);
    border:1px solid var(--color-border);
    border-radius:12px; padding:16px; margin-bottom:10px;
    transition:all .2s; box-shadow:0 2px 4px rgba(0,0,0,.02);
    position:relative; overflow:hidden;
    animation: xm-card-enter .25s cubic-bezier(.22,1,.36,1) both;
  }
  .task-card.interactive { cursor:pointer; }
  .task-card.interactive:hover {
    border-color:#E8500A; transform:translateY(-2px);
    box-shadow:0 8px 20px rgba(232,80,10,.1);
  }
  @media(hover:none){ .task-card.interactive:hover{ transform:none; } }
  .task-card.dragging  { opacity:.4; transform:scale(.97); }
  .task-card.overdue   { border-left:3px solid #E24B4A; }
  .task-card.due-soon  { border-left:3px solid #BA7517; }
  .task-card.is-next   { border-left:3px solid #E8500A; box-shadow:0 0 0 3px rgba(232,80,10,.08); }
  @media(max-width:640px){ .task-card{ padding:12px; margin-bottom:8px; } }

  .due-badge {
    font-size:9px; font-weight:800; padding:2px 7px;
    border-radius:4px; text-transform:uppercase; letter-spacing:.3px;
  }
  .due-badge.overdue  { background:#FCEBEB; color:#A32D2D; }
  .due-badge.due-soon { background:#FAEEDA; color:#854F0B; }
  .due-badge.on-track { background:#EAF3DE; color:#3B6D11; }

  .src-badge {
    display:inline-flex; align-items:center; gap:4px;
    font-size:9px; font-weight:700; padding:2px 7px;
    border-radius:4px; text-transform:uppercase;
  }
  .src-badge.cr    { background:#FFF0E8; color:#E8500A; border:1px solid #FDBA8C; }
  .src-badge.tache { background:var(--color-background-secondary); color:var(--color-text-muted); }

  .col-tabs { display:none; }
  @media(max-width:640px){
    .col-tabs {
      display:flex; gap:6px; overflow-x:auto; scrollbar-width:none;
      -webkit-overflow-scrolling:touch; margin-bottom:12px;
    }
    .col-tabs::-webkit-scrollbar{ display:none; }
    .col-tab {
      flex-shrink:0; padding:6px 14px; border-radius:20px;
      border:1px solid var(--color-border); background:transparent;
      color:var(--color-text-muted); font-size:12px; font-weight:700;
      cursor:pointer; display:flex; align-items:center; gap:6px; transition:.2s;
    }
    .col-tab.active{ background:#E8500A; color:#fff; border-color:#E8500A; }
    .col-count{
      background:rgba(255,255,255,.25); border-radius:10px;
      padding:1px 6px; font-size:10px; font-weight:800;
    }
    .col-tab:not(.active) .col-count{
      background:var(--color-background-tertiary); color:var(--color-text-muted);
    }
  }

  .tasks-table-wrap {
    background:var(--color-background-secondary);
    border-radius:16px; border:1px solid var(--color-border); overflow:hidden;
  }
  @media(max-width:768px){
    .tasks-table-wrap table,.tasks-table-wrap thead,.tasks-table-wrap tbody,
    .tasks-table-wrap th,.tasks-table-wrap td,.tasks-table-wrap tr{ display:block; }
    .tasks-table-wrap thead{ display:none; }
    .tasks-table-wrap tbody tr{
      border-top:1px solid var(--color-border); padding:14px 16px;
      display:flex; flex-direction:column; gap:8px;
    }
    .tasks-table-wrap tbody td{ padding:0 !important; }
    .tasks-table-wrap tbody td:first-child{ font-size:14px; font-weight:600; }
    .td-meta{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  }

  .modal-grid{ display:grid; grid-template-columns:2fr 1fr; gap:24px; min-height:320px; }
  @media(max-width:640px){ .modal-grid{ grid-template-columns:1fr; gap:0; min-height:unset; } }
  .modal-main{ min-width:0; display:flex; flex-direction:column; gap:20px; }
  .modal-sidebar{
    border-left:1px solid var(--color-border); padding-left:24px;
    display:flex; flex-direction:column; gap:16px;
  }
  @media(max-width:640px){
    .modal-sidebar{
      border-left:none; border-top:1px solid var(--color-border);
      padding-left:0; padding-top:20px; margin-top:4px;
    }
  }
  .modal-sidebar-actions{ margin-top:auto; display:flex; flex-direction:column; gap:8px; }
  @media(max-width:640px){
    .modal-sidebar-actions{ flex-direction:row; margin-top:8px; }
    .modal-sidebar-actions > *{ flex:1; }
  }
  .modal-label{
    font-size:10px; font-weight:800; color:var(--color-text-muted);
    text-transform:uppercase; display:block; margin-bottom:4px;
  }

  .toast-undo-btn{
    margin-left:14px; padding:4px 14px; border-radius:6px;
    border:2px solid currentColor; background:rgba(255,255,255,.15);
    color:inherit; font-size:12px; font-weight:800; cursor:pointer;
    letter-spacing:.3px; transition:background .15s;
  }
  .toast-undo-btn:hover{ background:rgba(255,255,255,.3); }

  .skeleton{ background:var(--color-border); border-radius:8px; animation:sk-pulse 1.4s ease-in-out infinite; }

  @media(max-width:768px){
    .tasks-toolbar{ flex-direction:column; align-items:stretch !important; gap:10px; }
    .tasks-toolbar > * { width:100%; }
    .toolbar-search{ max-width:100% !important; }
    .toolbar-filters{ overflow-x:auto; flex-wrap:nowrap !important; padding-bottom:2px; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
    .toolbar-filters::-webkit-scrollbar{ display:none; }
    .toolbar-filters button{ flex-shrink:0; }
    .toolbar-right{ justify-content:space-between; }
  }
`;

function useGlobalStyle() {
  useEffect(() => {
    const id = 'xm-tasks-style';
    if (!document.getElementById(id)) {
      const s = Object.assign(document.createElement('style'), { id, textContent: GLOBAL_CSS });
      document.head.appendChild(s);
    }
  }, []);
}

/* ════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════ */
const T = {
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
  accm: 'rgba(232,80,10,.08)',
  accb: 'rgba(232,80,10,.22)',
  r6:  'var(--radius-medium)',
  r8:  'var(--radius-large)',
  r12: 'var(--radius-xlarge)',
  r20: '20px',
  sdrop: 'var(--shadow-dropdown)',
};

/* ════════════════════════════════════════════════════════════
   CONSTANTES
   ════════════════════════════════════════════════════════════ */
const PRIORITIES = [
  { val:'high',   label:'Haute',   dot:'#E24B4A' },
  { val:'medium', label:'Normale', dot:'#BA7517' },
  { val:'low',    label:'Basse',   dot:'#378ADD' },
];

const COL_CFG = {
  todo:       { label:'À faire',  dot:'var(--color-text-muted)' },
  inprogress: { label:'En cours', dot:'var(--color-warning)'    },
  done:       { label:'Terminé',  dot:'var(--color-success)'    },
};

const COL_ORDER = { todo:0, inprogress:1, done:2 };

const STATUT_TO_COL = {
  todo:'todo', inprogress:'inprogress', done:'done',
  a_faire:'todo', en_cours:'inprogress', en_revision:'inprogress',
  termine:'done', annule:'todo',
};

const COL_TO_STATUT_TACHE  = { todo:'todo',    inprogress:'inprogress', done:'done'    };
const COL_TO_STATUT_ACTION = { todo:'a_faire', inprogress:'en_cours',   done:'termine' };

const TAB_CFG = [
  { key:'all',        label:'Toutes',    dot:null                         },
  { key:'todo',       label:'À faire',   dot:'var(--color-text-muted)'    },
  { key:'inprogress', label:'En cours',  dot:'var(--color-warning)'       },
  { key:'done',       label:'Terminées', dot:'var(--color-success)'       },
];

const STAT_CFG = [
  { key:'todo',       label:'À faire',   color:'var(--color-text-muted)' },
  { key:'inprogress', label:'En cours',  color:'var(--color-warning)'    },
  { key:'done',       label:'Terminées', color:'var(--color-success)'    },
];

const ROLES_ADMIN       = ['Super Admin','Admin Entreprise','super_admin','admin'];
const ROLES_MANAGER     = ['Manager','manager'];
const ROLES_DIRECTEUR   = ['Directeur','directeur'];
const ROLES_SUPERVISEUR = [...ROLES_ADMIN,...ROLES_MANAGER,'Assistant','Assistante','assistant','assistante'];

/* ════════════════════════════════════════════════════════════
   ICÔNES ARTISANALES
   ════════════════════════════════════════════════════════════ */
const Ic = {
  plus: () => (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path d="M8 2V14" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
      <path d="M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
      <path d="M6.5 2H9.5M6.5 14H9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="butt"/>
    </svg>
  ),
  search: () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4.8 5C5.2 4.2 6 3.7 7 3.8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity=".45"/>
      <path d="M10 10.2L14.2 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  ),
  close: () => (
    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
      <path d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  check: () => (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 8.5L6.5 12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity=".3"/>
    </svg>
  ),
  list: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M3 4H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 12H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="1.5" cy="4"  r="0.9" fill="currentColor"/>
      <circle cx="1.5" cy="8"  r="0.9" fill="currentColor"/>
      <circle cx="1.5" cy="12" r="0.9" fill="currentColor"/>
    </svg>
  ),
  kanban: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1"  width="4" height="13" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="6" y="1"  width="4" height="8"  rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="11" y="1" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M3 4H3.5M8 4H8.5M13 4H13.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity=".4"/>
    </svg>
  ),
  cal: () => (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3" width="13" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M1.5 7.5H14.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 1.5V4.5M11 1.5V4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <rect x="4" y="9.5" width="2.5" height="2" rx="0.4" fill="currentColor"/>
      <rect x="9.5" y="9.5" width="2.5" height="2" rx="0.4" fill="currentColor"/>
    </svg>
  ),
  user: () => (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M4.5 5C4.8 3.5 6.2 2.5 8 2.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity=".35"/>
      <path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  cr: () => (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="1" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M2.5 3.5L3.5 2.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity=".4"/>
    </svg>
  ),
  lock: () => (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="8" cy="11" r="1.2" fill="currentColor"/>
    </svg>
  ),
  lightning: () => (
    <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 1.5L10.5 10.5H6L7 14.5L13.5 5.5H9L10.5 1.5L2.5 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
};

/* ════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════ */
function getDueStatus(dueDateStr, isDone) {
  if (isDone || !dueDateStr) return null;
  let due;
  if (/^\d{4}-\d{2}-\d{2}/.test(dueDateStr)) {
    due = new Date(dueDateStr);
  } else {
    const months = { janvier:0,février:1,mars:2,avril:3,mai:4,juin:5,juillet:6,août:7,septembre:8,octobre:9,novembre:10,décembre:11 };
    const [d, m, y] = dueDateStr.toLowerCase().split(' ');
    due = new Date(+y, months[m], +d);
  }
  if (isNaN(due)) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const diff  = Math.ceil((due - today) / 86400000);
  if (diff < 0)  return { status:'overdue',  days: Math.abs(diff) };
  if (diff <= 3) return { status:'due-soon', days: diff };
  return               { status:'on-track',  days: diff };
}

const normalizeTache = t => ({
  id:          `tache_${t.tache_id ?? t.id}`,
  title:       t.tache_titre    ?? '',
  assignee:    t.user ? `${t.user.util_prenom} ${t.user.util_nom}`.trim() : '',
  user_id:     t.user_id   != null ? Number(t.user_id)  : null,
  dept_id:     t.dept_id   != null ? Number(t.dept_id)  : null,
  due:         t.tache_echeance ?? '',
  priority:    t.tache_priorite ?? 'medium',
  source:      'tache',
  colKey:      STATUT_TO_COL[t.tache_colonne] ?? 'todo',
  description: t.description ?? '',
});

const normalizeAction = a => ({
  id:          `action_${a.action_id ?? a.id}`,
  title:       a.action_texte    ?? '',
  assignee:    a.assignee        ?? '',
  user_id:     a.user_id != null ? Number(a.user_id) : null,
  due:         a.action_echeance ?? '',
  priority:    'medium',
  source:      'action',
  reunion:     a.reunion ?? null,
  description: a.reunion ? `Action issue de la réunion : ${a.reunion}` : '',
  colKey:      STATUT_TO_COL[a.action_statut] ?? 'todo',
});

const repartir = items => ({
  todo:       items.filter(t => t.colKey === 'todo'),
  inprogress: items.filter(t => t.colKey === 'inprogress'),
  done:       items.filter(t => t.colKey === 'done'),
});

const useHover = () => {
  const [h, set] = useState(false);
  return [h, { onMouseEnter:()=>set(true), onMouseLeave:()=>set(false) }];
};

function useInsights(tasks) {
  return useMemo(() => {
    const all = [...tasks.todo, ...tasks.inprogress, ...tasks.done];
    return {
      total:    all.length,
      byCol:    { todo: tasks.todo.length, inprogress: tasks.inprogress.length, done: tasks.done.length },
      overdue:  all.filter(t => getDueStatus(t.due, t.colKey === 'done')?.status === 'overdue').length,
      dueSoon:  all.filter(t => getDueStatus(t.due, t.colKey === 'done')?.status === 'due-soon').length,
      nextDue:  [...tasks.todo, ...tasks.inprogress].filter(t => t.due).sort((a,b) => a.due.localeCompare(b.due))[0] || null,
    };
  }, [tasks]);
}

/* ════════════════════════════════════════════════════════════
   ATOMS
   ════════════════════════════════════════════════════════════ */
function PrimaryBtn({ children, onClick, disabled, small, loading }) {
  const [h, hp] = useHover();
  return (
    <button onClick={onClick} disabled={disabled || loading} {...hp} style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding: small ? '6px 14px' : '9px 18px',
      borderRadius:T.r8, border:'none',
      background: disabled || loading ? T.t3 : h ? T.acc2 : T.acc,
      color:'#fff', fontSize: small ? 12 : 13, fontWeight:700,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled ? .6 : 1,
      fontFamily:'var(--font-sans)', transition:'all .15s',
      boxShadow: h && !disabled ? `0 4px 20px ${T.acc}55` : `0 2px 8px ${T.acc}33`,
      transform: h && !disabled ? 'translateY(-1px)' : 'none',
      whiteSpace:'nowrap',
    }}>{children}</button>
  );
}

function GhostBtn({ children, onClick, small, disabled }) {
  const [h, hp] = useHover();
  return (
    <button onClick={onClick} disabled={disabled} {...hp} style={{
      padding: small ? '5px 12px' : '8px 16px',
      borderRadius:T.r8, border:`1px solid ${T.bd1}`,
      background: h ? T.bg2 : 'transparent',
      fontSize: small ? 12 : 13, fontWeight:450,
      color: h ? T.t1 : T.t2, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily:'var(--font-sans)', transition:'all .15s',
      opacity: disabled ? .5 : 1, whiteSpace:'nowrap',
    }}>{children}</button>
  );
}

/* ════════════════════════════════════════════════════════════
   STATS ROW
   ════════════════════════════════════════════════════════════ */
function StatsRow({ insights }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10, marginBottom:20 }}>
      {STAT_CFG.map(({ key, label, color }) => {
        const n   = insights.byCol[key] || 0;
        const pct = insights.total > 0 ? Math.round(n / insights.total * 100) : 0;
        return <StatCard key={key} value={n} label={label} color={color} pct={pct}/>;
      })}
    </div>
  );
}

function StatCard({ value, label, color, pct }) {
  const [h, hp] = useHover();
  return (
    <div {...hp} style={{ background:T.bg1, border:`1px solid ${h ? T.bd1 : T.bd0}`, borderRadius:T.r12, padding:'14px 16px', transition:'border-color .15s, box-shadow .15s', boxShadow:h?T.sdrop:'none' }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ fontSize:26, fontWeight:700, color:T.t1, letterSpacing:'-1px', lineHeight:1 }}>{value}</span>
        <span style={{ fontSize:11, color:T.t3, fontFamily:'var(--font-mono)', marginBottom:2 }}>{pct}%</span>
      </div>
      <div style={{ height:2, background:T.bg3, borderRadius:99, marginBottom:8, overflow:'hidden' }}>
        <div style={{ height:'100%', background:color, borderRadius:99, width:`${pct}%`, transformOrigin:'left', animation:'xm-bar .7s cubic-bezier(.22,1,.36,1)' }}/>
      </div>
      <div style={{ fontSize:11.5, color:T.t3, fontWeight:500, display:'flex', alignItems:'center', gap:5 }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0 }}/>
        {label}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB BAR
   ════════════════════════════════════════════════════════════ */
function TabBar({ active, setActive, counts }) {
  return (
    <div style={{ display:'flex', gap:2, borderBottom:`1px solid ${T.bd0}`, marginBottom:20 }}>
      {TAB_CFG.map(({ key, label, dot }) => {
        const isActive = active === key;
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
            {dot && <span style={{ width:5, height:5, borderRadius:'50%', background:dot, flexShrink:0 }}/>}
            {label}
            <span style={{
              fontSize:11, fontWeight:600, padding:'1px 7px', borderRadius:T.r20,
              fontFamily:'var(--font-mono)',
              background: isActive ? T.bg3 : T.bg1,
              color: isActive ? T.t1 : T.t3,
              transition:'background .15s',
            }}>{counts[key] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   FILTERS BAR
   ════════════════════════════════════════════════════════════ */
function FiltersBar({ query, setQuery, priorityFilter, setPriority, activeCount }) {
  const hasActive = query !== '' || priorityFilter !== null;
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1 1 200px', minWidth:0 }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:T.t3, lineHeight:0 }}>
            <Ic.search/>
          </span>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher une tâche…"
            style={{ width:'100%', background:T.bg1, border:`1px solid ${T.bd0}`, borderRadius:T.r8, padding:'0 32px', height:34, color:T.t1, fontSize:12.5, outline:'none', fontFamily:'var(--font-sans)', boxSizing:'border-box', transition:'border-color .13s, box-shadow .13s' }}
            onFocus={e => { e.target.style.borderColor=T.bd2; e.target.style.boxShadow=`0 0 0 3px ${T.accm}`; }}
            onBlur={e  => { e.target.style.borderColor=T.bd0; e.target.style.boxShadow='none'; }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:T.t3, lineHeight:0, padding:2 }}>
              <Ic.close/>
            </button>
          )}
        </div>
        <div style={{ display:'flex', gap:6, flexShrink:0, flexWrap:'wrap' }}>
          <PillFilter active={!priorityFilter} label="Toutes" color={T.acc} onClick={() => setPriority(null)}/>
          {PRIORITIES.map(p => (
            <PillFilter key={p.val} active={priorityFilter === p.val} label={p.label} color={p.dot} onClick={() => setPriority(priorityFilter === p.val ? null : p.val)}/>
          ))}
        </div>
        {hasActive && (
          <button
            onClick={() => { setQuery(''); setPriority(null); }}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'0 10px', height:34, borderRadius:T.r8, border:`1px solid ${T.bd0}`, background:'transparent', color:T.t3, fontSize:12, cursor:'pointer', fontFamily:'var(--font-sans)', transition:'all .13s', whiteSpace:'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.color=T.t1; e.currentTarget.style.borderColor=T.bd1; }}
            onMouseLeave={e => { e.currentTarget.style.color=T.t3; e.currentTarget.style.borderColor=T.bd0; }}
          >
            <Ic.close/> Réinitialiser
          </button>
        )}
      </div>
      {hasActive && (
        <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap', alignItems:'center' }}>
          {priorityFilter && <FilterChip label={PRIORITIES.find(p => p.val === priorityFilter)?.label} onRemove={() => setPriority(null)}/>}
          {query          && <FilterChip label={`"${query}"`} onRemove={() => setQuery('')}/>}
          <span style={{ fontSize:11, color:T.t3 }}>{activeCount} résultat{activeCount !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}

function PillFilter({ active, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer',
      border:`1px solid ${active ? color : T.bd0}`,
      background: active ? color + '22' : 'transparent',
      color: active ? color : T.t3,
    }}>{label}</button>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'2px 8px 2px 10px', borderRadius:T.r20, background:T.accm, border:`1px solid ${T.accb}`, fontSize:11, fontWeight:500, color:T.acc }}>
      {label}
      <button onClick={onRemove} style={{ background:'none', border:'none', cursor:'pointer', color:T.acc, lineHeight:0, padding:1, opacity:.7, transition:'opacity .1s' }}
        onMouseEnter={e => e.currentTarget.style.opacity='1'}
        onMouseLeave={e => e.currentTarget.style.opacity='.7'}>
        <Ic.close/>
      </button>
    </span>
  );
}

/* ════════════════════════════════════════════════════════════
   EMPTY STATE / SKELETON
   ════════════════════════════════════════════════════════════ */
function EmptyState({ hasFilters }) {
  return (
    <div style={{ textAlign:'center', padding:'72px 24px', background:T.bg1, borderRadius:16, border:`1px solid ${T.bd0}` }}>
      <div style={{ width:52, height:52, borderRadius:14, background:T.accm, border:`1px solid ${T.accb}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
        <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
          <rect x="1" y="2" width="20" height="18" rx="3" stroke={T.acc} strokeWidth="1.6"/>
          <path d="M6 7h10M6 11h10M6 15h5" stroke={T.acc} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p style={{ fontSize:14, fontWeight:600, color:T.t1, marginBottom:6 }}>{hasFilters ? 'Aucun résultat' : 'Aucune tâche'}</p>
      <p style={{ fontSize:13, color:T.t3, maxWidth:300, margin:'0 auto', lineHeight:1.7 }}>
        {hasFilters ? 'Modifiez vos filtres ou votre recherche.' : 'Créez votre première tâche.'}
      </p>
    </div>
  );
}

const SkeletonCard = () => (
  <div style={{ background:T.bg1, border:`1px solid ${T.bd0}`, borderRadius:12, padding:16, marginBottom:10 }}>
    <div className="skeleton" style={{ height:10, width:'55%', marginBottom:12 }}/>
    <div className="skeleton" style={{ height:14, width:'85%', marginBottom:8 }}/>
    <div className="skeleton" style={{ height:10, width:'35%' }}/>
  </div>
);

const DueBadge = ({ due }) => {
  if (!due) return null;
  const label = due.status === 'overdue'  ? `${due.days}j de retard`
              : due.status === 'due-soon' ? (due.days === 0 ? "Aujourd'hui" : `Dans ${due.days}j`)
              : 'À jour';
  return <span className={`due-badge ${due.status}`}>{label}</span>;
};

function ViewSwitcher({ view, setView }) {
  return (
    <div style={{ display:'flex', gap:2, background:T.bg1, padding:3, borderRadius:10, border:`1px solid ${T.bd0}`, flexShrink:0 }}>
      {[{ key:'Kanban', icon:<Ic.kanban/> }, { key:'Liste', icon:<Ic.list/> }].map(({ key, icon }) => {
        const active = view === key;
        return (
          <button key={key} onClick={() => setView(key)} style={{
            display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, border:'none', cursor:'pointer',
            background: active ? T.acc : 'transparent',
            color: active ? '#fff' : T.t3,
            fontSize:12, fontWeight:600, transition:'.2s', whiteSpace:'nowrap', fontFamily:'var(--font-sans)',
          }}>
            {icon}{key}
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TASK CARD
   ════════════════════════════════════════════════════════════ */
const TaskCard = memo(function TaskCard({ task, colKey, index, canDrag, isMobile, draggingId, onDragStart, onDragEnd, onDragOver, onClick, onMoveLeft, onMoveRight, isFirst, isLast }) {
  const isDone   = colKey === 'done';
  const isAction = task.source === 'action';
  const priority = PRIORITIES.find(p => p.val === task.priority);
  const due      = getDueStatus(task.due, isDone);
  const isNext   = !isDone && task.due && due?.status !== 'overdue' && index === 0;

  return (
    <div
      draggable={canDrag && !isMobile}
      onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver}
      onClick={onClick}
      style={{ animationDelay:`${index * 25}ms` }}
      className={['task-card interactive', draggingId===task.id?'dragging':'', due?.status==='overdue'?'overdue':'', due?.status==='due-soon'?'due-soon':'', isNext?'is-next':''].filter(Boolean).join(' ')}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8, gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, flex:1, minWidth:0 }}>
          {isNext && (
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'1px 7px', borderRadius:T.r20, background:T.accm, border:`1px solid ${T.accb}`, fontSize:9, fontWeight:700, color:T.acc, whiteSpace:'nowrap', flexShrink:0 }}>
              <Ic.lightning/>Prochain
            </span>
          )}
          {isAction && <span className="src-badge cr"><Ic.cr/> CR</span>}
        </div>
        {priority && <span style={{ width:8, height:8, borderRadius:'50%', background:priority.dot, flexShrink:0, marginTop:3 }}/>}
      </div>

      <p style={{ fontSize:13.5, fontWeight:600, margin:'0 0 6px', lineHeight:1.4, color:T.t1, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
        {task.title}
      </p>

      {isAction && task.reunion && (
        <p style={{ fontSize:11, color:T.acc, margin:'0 0 8px', fontStyle:'italic', lineHeight:1.4, display:'flex', alignItems:'center', gap:4 }}>
          <Ic.cal/> {task.reunion}
        </p>
      )}

      {priority && (
        <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:600, color:priority.dot, padding:'2px 8px', borderRadius:T.r20, background:priority.dot+'18', border:`1px solid ${priority.dot}44`, marginBottom:8 }}>
          {priority.label}
        </span>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:10 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {task.due && (
            <span style={{ fontSize:10, color:T.t3, display:'flex', alignItems:'center', gap:4, ...(due?.status==='overdue'?{color:'#E24B4A',fontWeight:700}:{}), ...(due?.status==='due-soon'?{color:'#BA7517',fontWeight:700}:{}) }}>
              <Ic.cal/> {task.due}
            </span>
          )}
          {due && <DueBadge due={due}/>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {isMobile && canDrag && (
            <div style={{ display:'flex', gap:4 }} onClick={e => e.stopPropagation()}>
              {!isFirst && <button onClick={onMoveLeft}  style={{ width:24, height:24, borderRadius:6, border:`1px solid ${T.bd0}`, background:T.bg1, color:T.t3, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:12 }}>←</button>}
              {!isLast  && <button onClick={onMoveRight} style={{ width:24, height:24, borderRadius:6, border:`1px solid ${T.acc}`, background:T.accm, color:T.acc, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:12 }}>→</button>}
            </div>
          )}
          {task.assignee && (
            <div style={{ width:24, height:24, borderRadius:'50%', background:isAction?T.acc:'#378ADD', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, flexShrink:0 }}>
              {task.assignee[0]?.toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════
   EDIT MODAL
   ════════════════════════════════════════════════════════════ */
function EditModal({ open, task, isMobile, estAdminPur, estManager, user, peutModifier, onClose, onSave, onMoveAction, setTask }) {
  if (!task) return null;
  const isAction = task.source === 'action';
  const canEdit  = peutModifier(task);
  const readOnly = !canEdit;

  return (
    <Modal open={open} onClose={onClose} title={readOnly ? 'Détails de la tâche' : 'Modifier la tâche'} width={isMobile ? '95vw' : 800}>
      <div className="modal-grid">
        <div className="modal-main">

          {readOnly && !isAction && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, background:T.bg2, border:`1px solid ${T.bd0}`, fontSize:12, color:T.t3 }}>
              <Ic.lock/> Consultation uniquement — seul le manager du département ou un administrateur peut modifier cette tâche.
            </div>
          )}

          {isAction && (
            <div style={{ padding:'12px 16px', borderRadius:10, background:'#FFF0E8', border:'1px solid #FDBA8C' }}>
              <p style={{ fontSize:12, fontWeight:700, color:T.acc, margin:'0 0 4px', display:'flex', alignItems:'center', gap:6 }}>
                <Ic.cr/> Action issue d'un compte rendu
              </p>
              <p style={{ fontSize:12, color:'#854F0B', margin:0, lineHeight:1.55 }}>
                Lecture seule ici — gérez-la depuis la réunion.
                {task.reunion && <><br/>Réunion : <strong>{task.reunion}</strong></>}
              </p>
            </div>
          )}

          {!isAction && (
            readOnly ? (
              <div>
                <label className="modal-label">TITRE</label>
                <p style={{ fontSize:14, fontWeight:600, color:T.t1, margin:0, lineHeight:1.4 }}>{task.title}</p>
              </div>
            ) : (
              <Input label="TITRE" value={task.title} onChange={e => setTask({ ...task, title:e.target.value })}/>
            )
          )}

          <div>
            <label className="modal-label">DESCRIPTION</label>
            {readOnly ? (
              <p style={{ fontSize:13, color:T.t2, margin:0, lineHeight:1.7, whiteSpace:'pre-wrap' }}>
                {task.description || <span style={{ color:T.t3, fontStyle:'italic' }}>Aucune description</span>}
              </p>
            ) : (
              <textarea
                value={task.description || ''} onChange={e => setTask({ ...task, description:e.target.value })}
                placeholder="Ajoutez des détails…"
                style={{ width:'100%', minHeight:110, padding:12, borderRadius:8, border:`1px solid ${T.bd0}`, background:'var(--color-background-primary)', color:T.t1, fontFamily:'inherit', fontSize:13, resize:'vertical', boxSizing:'border-box', outline:'none' }}
              />
            )}
          </div>
        </div>

        <div className="modal-sidebar">
          <div>
            <label className="modal-label">STATUT</label>
            <p style={{ fontSize:12, fontWeight:700, color:T.acc, margin:0, textTransform:'uppercase' }}>{COL_CFG[task.colKey]?.label}</p>
          </div>

          <div>
            <label className="modal-label">ÉCHÉANCE</label>
            <p style={{ fontSize:13, margin:'0 0 5px', color:T.t3 }}>{task.due || '—'}</p>
            <DueBadge due={getDueStatus(task.due, task.colKey === 'done')}/>
          </div>

          {!isAction && (
            <div>
              <label className="modal-label">PRIORITÉ</label>
              {readOnly ? (
                (() => {
                  const p = PRIORITIES.find(p => p.val === task.priority);
                  return p ? (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:p.dot+'22', color:p.dot, border:`1px solid ${p.dot}44` }}>{p.label}</span>
                  ) : <span style={{ color:T.t3 }}>—</span>;
                })()
              ) : (
                <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
                  {PRIORITIES.map(p => (
                    <button key={p.val} onClick={() => setTask({ ...task, priority:p.val })} style={{ padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer', border:`1px solid ${task.priority===p.val?p.dot:T.bd0}`, background:task.priority===p.val?p.dot+'22':'transparent', color:task.priority===p.val?p.dot:T.t3 }}>{p.label}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isAction && !readOnly && (
            <Input label="MODIFIER L'ÉCHÉANCE" value={task.due} onChange={e => setTask({ ...task, due:e.target.value })}/>
          )}

          <div>
            <label className="modal-label">RESPONSABLE</label>
            <p style={{ fontSize:13, color:T.t3, margin:0 }}>{task.assignee || '—'}</p>
          </div>

          <div className="modal-sidebar-actions">
            {isAction && (estAdminPur || estManager || Number(task.user_id) === Number(user?.id)) && (
              <>
                {task.colKey !== 'inprogress' && task.colKey !== 'done' && (
                  <Button variant="primary" onClick={() => onMoveAction('inprogress')} style={{ width:'100%' }}>▶ En cours</Button>
                )}
                {task.colKey !== 'done' && (
                  <Button variant="primary" onClick={() => onMoveAction('done')} style={{ width:'100%' }}>✓ Terminé</Button>
                )}
                {task.colKey === 'done' && (estAdminPur || estManager) && (
                  <Button variant="ghost" onClick={() => onMoveAction('inprogress')} style={{ width:'100%' }}>↩ Remettre en cours</Button>
                )}
              </>
            )}
            {canEdit && (
              <Button variant="primary" onClick={onSave} style={{ width:'100%' }}>Enregistrer</Button>
            )}
            <Button variant="ghost" onClick={onClose} style={{ width:'100%' }}>Fermer</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ════════════════════════════════════════════════════════════ */
export default function TasksPage() {
  useGlobalStyle();
  const { addToast } = useNotif();
  const { user }     = useAuth();

  const raw            = user?.roleRaw || '';
  const estAdminPur    = ROLES_ADMIN.includes(raw);
  const estManager     = ROLES_MANAGER.includes(raw);
  const estDirecteur   = ROLES_DIRECTEUR.includes(raw);
  const estSuperviseur = ROLES_SUPERVISEUR.includes(raw);

  const [tasks,          setTasks]        = useState({ todo:[], inprogress:[], done:[] });
  const [loading,        setLoading]      = useState(true);
  const [view,           setView]         = useState('Kanban');
  const [activeTab,      setActiveTab]    = useState('all');
  const [query,          setQuery]        = useState('');
  const [priorityFilter, setPriority]     = useState(null);
  const [dragInfo,       setDragInfo]     = useState({ id:null, sCol:null });
  const [overCol,        setOverCol]      = useState(null);
  const [draggingId,     setDraggingId]   = useState(null);
  const [editingTask,    setEditingTask]  = useState(null);
  const [isEditOpen,     setIsEditOpen]   = useState(false);
  const [isCreateOpen,   setIsCreateOpen] = useState(false);
  const [activeCol,      setActiveCol]    = useState('todo');
  const [isMobile,       setIsMobile]     = useState(false);

  const prevRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width:640px)');
    const fn = () => setIsMobile(mq.matches);
    fn(); mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('xamio_token');
    const h = { Authorization:`Bearer ${token}`, Accept:'application/json' };
    try {
      const [tr, ar] = await Promise.all([
        fetch('/api/taches',      { headers:h }).then(r => r.ok ? r.json() : { data:[] }),
        fetch('/api/mes-actions', { headers:h }).then(r => r.ok ? r.json() : { data:[] }),
      ]);
      setTasks(repartir([...(tr.data ?? []).map(normalizeTache), ...(ar.data ?? []).map(normalizeAction)]));
    } catch {
      addToast('Erreur lors du chargement.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const estAssigne = useCallback(t => !!user && Number(t.user_id) === Number(user.id), [user]);

  const peutModifier = useCallback(t => {
    if (!t || t.source === 'action') return false;
    if (estAdminPur) return true;
    if (estManager) {
      const deptIds = user?.dept_ids;
      if (!deptIds?.length) return true;
      return t.dept_id != null && deptIds.map(Number).includes(Number(t.dept_id));
    }
    return false;
  }, [estAdminPur, estManager, user]);

  const peutDragguer = useCallback(t => {
    if (!t || estDirecteur) return false;
    if (estAdminPur) return true;
    if (estManager) {
      const deptIds = user?.dept_ids;
      if (!deptIds?.length) return true;
      return t.dept_id != null && deptIds.map(Number).includes(Number(t.dept_id));
    }
    return estAssigne(t);
  }, [estAdminPur, estDirecteur, estManager, estAssigne, user]);

  const peutDeposer = useCallback((taskId, dest, src) => {
    const all  = [...tasks.todo, ...tasks.inprogress, ...tasks.done];
    const task = all.find(t => t.id === taskId);
    if (!task || estDirecteur) return false;
    if (estAdminPur) return true;
    if (estManager) {
      const deptIds = user?.dept_ids;
      if (!deptIds?.length) return true;
      return task.dept_id != null && deptIds.map(Number).includes(Number(task.dept_id));
    }
    if (!estAssigne(task)) return false;
    return COL_ORDER[dest] > COL_ORDER[src];
  }, [tasks, estAdminPur, estDirecteur, estManager, estAssigne, user]);

  const peutVoir = useCallback(t =>
    estAdminPur || estDirecteur || estManager || estSuperviseur || estAssigne(t),
  [estAdminPur, estDirecteur, estManager, estSuperviseur, estAssigne]);

  const insights = useInsights(tasks);

  const tabCounts = useMemo(() => ({
    all:        tasks.todo.length + tasks.inprogress.length + tasks.done.length,
    todo:       tasks.todo.length,
    inprogress: tasks.inprogress.length,
    done:       tasks.done.length,
  }), [tasks]);

  const filteredTasks = useMemo(() => {
    const filterFn = list => list.filter(t =>
      t.title.toLowerCase().includes(query.toLowerCase()) &&
      (!priorityFilter || t.priority === priorityFilter) &&
      (estAdminPur || estDirecteur || estManager || estSuperviseur || estAssigne(t)) &&
      (activeTab === 'all' || t.colKey === activeTab)
    );
    return { todo: filterFn(tasks.todo), inprogress: filterFn(tasks.inprogress), done: filterFn(tasks.done) };
  }, [tasks, query, priorityFilter, activeTab, estAdminPur, estDirecteur, estManager, estSuperviseur, estAssigne]);

  const totalFiltered = filteredTasks.todo.length + filteredTasks.inprogress.length + filteredTasks.done.length;
  const hasFilters    = !!query || !!priorityFilter || activeTab !== 'all';

  const patchColonne = useCallback(async (taskId, destCol) => {
    if (!taskId || !destCol) throw new Error('taskId ou destCol manquant');
    const token    = localStorage.getItem('xamio_token');
    const isAction = taskId.startsWith('action_');
    const id       = taskId.replace(isAction ? 'action_' : 'tache_', '');
    if (!id || id === 'undefined') throw new Error(`ID invalide: "${taskId}"`);
    const url  = isAction ? `/api/actions/${id}/statut` : `/api/taches/${id}/colonne`;
    const body = isAction ? { action_statut: COL_TO_STATUT_ACTION[destCol] } : { tache_colonne: COL_TO_STATUT_TACHE[destCol] };
    const res  = await fetch(url, {
      method:'PATCH',
      headers:{ 'Content-Type':'application/json', Accept:'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message ?? `HTTP ${res.status}`); }
    return res.json();
  }, []);

  const moveOptimistic = useCallback((taskId, src, dest) => {
    prevRef.current = JSON.parse(JSON.stringify(tasks));
    setTasks(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const idx  = next[src].findIndex(t => t.id === taskId);
      if (idx === -1) return prev;
      const [moved] = next[src].splice(idx, 1);
      moved.colKey  = dest;
      next[dest].push(moved);
      return next;
    });
  }, [tasks]);

  const rollback = useCallback(() => {
    if (prevRef.current) { setTasks(prevRef.current); prevRef.current = null; }
  }, []);

  const handleDragStart = (e, task, colKey) => {
    if (!peutDragguer(task)) { e.preventDefault(); return; }
    setDragInfo({ id:task.id, sCol:colKey });
    setDraggingId(task.id);
  };
  const handleDragEnd = () => { setDraggingId(null); setOverCol(null); };

  const handleDrop = async (e, destCol) => {
    e.preventDefault();
    const { id:taskId, sCol:sourceCol } = dragInfo;
    setDragInfo({ id:null, sCol:null }); setOverCol(null); setDraggingId(null);
    if (!taskId || sourceCol === destCol) return;
    if (!peutDeposer(taskId, destCol, sourceCol)) { addToast('Déplacement non autorisé.', 'error'); return; }
    moveOptimistic(taskId, sourceCol, destCol);
    try {
      await patchColonne(taskId, destCol);
      addToast(<span>Déplacé vers <strong>{COL_CFG[destCol].label}</strong><button className="toast-undo-btn" onClick={() => { rollback(); addToast('Annulé.', 'info'); }}>Annuler</button></span>, 'success');
    } catch (err) { rollback(); addToast(`Erreur : ${err.message}`, 'error'); }
  };

  const handleMoveCard = (task, currentCol, dir) => {
    const cols = ['todo','inprogress','done'];
    const dest = cols[cols.indexOf(currentCol) + dir];
    if (!dest) return;
    if (!peutDeposer(task.id, dest, currentCol)) { addToast('Déplacement non autorisé.', 'error'); return; }
    moveOptimistic(task.id, currentCol, dest);
    setActiveCol(dest);
    patchColonne(task.id, dest).catch(() => { rollback(); addToast('Erreur.', 'error'); });
    addToast(<span>Déplacé vers <strong>{COL_CFG[dest].label}</strong></span>, 'success');
  };

  const handleMoveAction = async destCol => {
    if (!editingTask || editingTask.source !== 'action') return;
    const { id:taskId, colKey:srcCol } = editingTask;
    if (srcCol === destCol) { setIsEditOpen(false); return; }
    if (!estAdminPur && !estManager && COL_ORDER[destCol] < COL_ORDER[srcCol]) { addToast('Vous ne pouvez pas revenir en arrière.', 'error'); return; }
    moveOptimistic(taskId, srcCol, destCol);
    setIsEditOpen(false);
    if (isMobile) setActiveCol(destCol);
    try {
      await patchColonne(taskId, destCol);
      addToast(<span>Action déplacée vers <strong>{COL_CFG[destCol].label}</strong></span>, 'success');
    } catch { rollback(); addToast('Erreur.', 'error'); }
  };

  const handleSave = async () => {
    if (!editingTask || editingTask.source === 'action') { setIsEditOpen(false); return; }
    const token = localStorage.getItem('xamio_token');
    const id    = editingTask.id.replace('tache_', '');
    try {
      const res = await fetch(`/api/taches/${id}`, {
        method:'PUT',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ tache_titre:editingTask.title, tache_priorite:editingTask.priority, tache_echeance:editingTask.due||null, description:editingTask.description||null }),
      });
      if (!res.ok) throw new Error();
      setTasks(prev => {
        const next = { ...prev };
        next[editingTask.colKey] = next[editingTask.colKey].map(t => t.id === editingTask.id ? editingTask : t);
        return next;
      });
      setIsEditOpen(false);
      addToast('Tâche mise à jour.', 'success');
    } catch { addToast('Erreur lors de la sauvegarde.', 'error'); }
  };

  return (
    <div className="xm-tasks xm-enter" style={{ padding:'0 2px', maxWidth:'100%', overflowX:'hidden' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:24, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:T.t1, letterSpacing:'-.6px', margin:'0 0 4px', fontFamily:'var(--font-sans)' }}>Tâches</h1>
          <p style={{ fontSize:13, color:T.t3, margin:0, display:'flex', alignItems:'center', gap:8 }}>
            {insights.total} tâche{insights.total !== 1 ? 's' : ''}
            {insights.overdue > 0 && <span style={{ color:'#E24B4A', fontWeight:600 }}>· {insights.overdue} en retard</span>}
            {insights.dueSoon > 0 && <span style={{ color:'#BA7517', fontWeight:600 }}>· {insights.dueSoon} bientôt</span>}
          </p>
        </div>
        {(estAdminPur || estManager) && (
          <PrimaryBtn onClick={() => setIsCreateOpen(true)}><Ic.plus/> Nouvelle tâche</PrimaryBtn>
        )}
      </div>

      <StatsRow insights={insights}/>
      <TabBar active={activeTab} setActive={setActiveTab} counts={tabCounts}/>

      <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ flex:1 }}>
          <FiltersBar query={query} setQuery={setQuery} priorityFilter={priorityFilter} setPriority={setPriority} activeCount={totalFiltered}/>
        </div>
        <ViewSwitcher view={view} setView={setView}/>
      </div>

      {/* Kanban */}
      {view === 'Kanban' && (
        <>
          <div className="col-tabs">
            {['todo','inprogress','done'].map(col => (
              <button key={col} onClick={() => setActiveCol(col)} className={`col-tab ${activeCol===col?'active':''}`}>
                {COL_CFG[col].label}
                <span className="col-count">{filteredTasks[col].length}</span>
              </button>
            ))}
          </div>

          {totalFiltered === 0 ? <EmptyState hasFilters={hasFilters}/> : (
            <div className="kanban-container">
              {['todo','inprogress','done'].map(colKey => (
                <div
                  key={colKey}
                  className={`kanban-col${overCol===colKey?' over':''}`}
                  style={{ display: isMobile && colKey !== activeCol ? 'none' : undefined }}
                  onDragOver={e => { e.preventDefault(); setOverCol(colKey); }}
                  onDragLeave={() => setOverCol(o => o===colKey?null:o)}
                  onDrop={e => handleDrop(e, colKey)}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                    <span style={{ width:7, height:7, borderRadius:'50%', background:COL_CFG[colKey].dot, flexShrink:0 }}/>
                    <h3 style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.06em', margin:0, color:T.t2 }}>{COL_CFG[colKey].label}</h3>
                    <span style={{ fontSize:11, fontWeight:700, padding:'0 7px', borderRadius:T.r20, background:T.bg3, color:T.t3, fontFamily:'var(--font-mono)' }}>{filteredTasks[colKey].length}</span>
                  </div>

                  {loading && [1,2].map(i => <SkeletonCard key={i}/>)}

                  {!loading && filteredTasks[colKey].map((task, i) => (
                    <TaskCard
                      key={task.id} task={task} colKey={colKey} index={i}
                      canDrag={peutDragguer(task)} isMobile={isMobile} draggingId={draggingId}
                      isFirst={colKey==='todo'} isLast={colKey==='done'}
                      onDragStart={e => handleDragStart(e, task, colKey)}
                      onDragEnd={handleDragEnd}
                      onDragOver={e => e.preventDefault()}
                      onClick={() => { if (peutVoir(task)) { setEditingTask({...task,colKey}); setIsEditOpen(true); } }}
                      onMoveLeft={e  => { e.stopPropagation(); handleMoveCard(task, colKey, -1); }}
                      onMoveRight={e => { e.stopPropagation(); handleMoveCard(task, colKey,  1); }}
                    />
                  ))}

                  {!loading && filteredTasks[colKey].length === 0 && (
                    <div style={{ textAlign:'center', padding:'32px 16px', border:`2px dashed ${T.bd0}`, borderRadius:12, color:T.t3, fontSize:12 }}>Aucune tâche</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Liste */}
      {view === 'Liste' && (
        <div className="tasks-table-wrap">
          {loading ? (
            <div style={{ padding:24 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:40, marginBottom:12, borderRadius:8 }}/>)}
            </div>
          ) : totalFiltered === 0 ? (
            <div style={{ padding:'48px 24px' }}><EmptyState hasFilters={hasFilters}/></div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead style={{ background:T.bg2, fontSize:11 }}>
                <tr>
                  {['TÂCHE','SOURCE','ASSIGNÉ','ÉCHÉANCE','COLONNE','PRIORITÉ'].map(h => (
                    <th key={h} style={{ padding:14, textAlign:'left', fontWeight:700, color:T.t3, letterSpacing:'.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(filteredTasks).flatMap(([col, list]) =>
                  list.map(t => {
                    const due      = getDueStatus(t.due, col === 'done');
                    const priority = PRIORITIES.find(p => p.val === t.priority);
                    const canVoir  = peutVoir(t);
                    return (
                      <tr
                        key={t.id}
                        onClick={() => { if (canVoir) { setEditingTask({...t,colKey:col}); setIsEditOpen(true); } }}
                        style={{ borderTop:`1px solid ${T.bd0}`, cursor:canVoir?'pointer':'default', transition:'background .12s' }}
                        onMouseEnter={e => { if (canVoir) e.currentTarget.style.background = T.bg2; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                      >
                        <td style={{ padding:14, fontWeight:600, color:T.t1 }}>{t.title}</td>
                        <td style={{ padding:14 }} className="td-meta">
                          <span className={`src-badge ${t.source==='action'?'cr':'tache'}`}>
                            {t.source === 'action' ? <><Ic.cr/> CR</> : '✓ Tâche'}
                          </span>
                        </td>
                        <td style={{ padding:14, color:T.t3, fontSize:13 }} className="td-meta">
                          {t.assignee ? (
                            <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <span style={{ width:20, height:20, borderRadius:'50%', background:t.source==='action'?T.acc:'#378ADD', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, flexShrink:0 }}>
                                {t.assignee[0]?.toUpperCase()}
                              </span>
                              {t.assignee}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding:14, fontSize:12 }} className="td-meta">
                          {t.due ? (
                            <span style={{ display:'flex', flexDirection:'column', gap:3 }}>
                              <span style={{ color:T.t3 }}>{t.due}</span>
                              {due && <DueBadge due={due}/>}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding:14 }} className="td-meta">
                          <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:T.t2 }}>
                            <span style={{ width:6, height:6, borderRadius:'50%', background:COL_CFG[col].dot }}/>
                            {COL_CFG[col].label}
                          </span>
                        </td>
                        <td style={{ padding:14 }} className="td-meta">
                          {priority && (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:T.r20, background:priority.dot+'18', color:priority.dot, border:`1px solid ${priority.dot}44` }}>
                              {priority.label}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {ReactDOM.createPortal(
        <EditModal
          open={isEditOpen} task={editingTask} isMobile={isMobile}
          estAdminPur={estAdminPur} estManager={estManager} user={user}
          peutModifier={peutModifier}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSave}
          onMoveAction={handleMoveAction}
          setTask={setEditingTask}
        />,
        document.body
      )}

      {ReactDOM.createPortal(
        <CreateTacheModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={loadTasks}/>,
        document.body
      )}
    </div>
  );
}