import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Badge, SectionHeader, Input, Button, Modal, SearchBar } from '../../../components/ui/index';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../context/AuthContext';

const CSS = `
  /* ── RESPONSIVE BASE ── */
  .kanban-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-top: 24px;
  }
  @media (max-width: 1024px) {
    .kanban-container {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 640px) {
    .kanban-container {
      grid-template-columns: 1fr;
      gap: 12px;
      margin-top: 12px;
    }
  }

  /* ── KOLONNES ── */
  .kanban-col {
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 16px;
    min-height: 80vh;
    transition: background 0.15s ease, border-color 0.15s ease, border-width 0.15s ease;
  }
  @media (max-width: 640px) {
    .kanban-col {
      min-height: unset;
      padding: 12px;
      border-radius: 12px;
    }
    .kanban-col-empty {
      display: none;
    }
  }
  .column-over {
    background: var(--color-background-tertiary);
    border-color: var(--color-accent);
    border-width: 2px;
  }

  /* ── TASK CARD ── */
  .task-card {
    background: var(--color-background-primary);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  }
  @media (max-width: 640px) {
    .task-card {
      padding: 12px;
      margin-bottom: 8px;
      border-radius: 10px;
    }
  }
  .task-card.can-interact:hover {
    border-color: #E8500A;
    transform: translateY(-3px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.08);
  }
  @media (hover: none) {
    .task-card.can-interact:hover {
      transform: none;
    }
  }
  .task-card.dragging  { opacity: 0.4; transform: scale(0.97); }
  .task-card.locked    { opacity: 0.6; cursor: not-allowed; filter: grayscale(0.3); }
  .task-card.overdue   { border-left: 3px solid #E24B4A; }
  .task-card.due-soon  { border-left: 3px solid #BA7517; }

  /* ── TAGS ── */
  .tag {
    font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 4px;
    background: var(--color-background-secondary); color: var(--color-text-muted);
    text-transform: uppercase; margin-right: 4px;
  }
  .tag.cr-tag { background: #FFF0E8; color: #E8500A; border: 1px solid #FDBA8C; }

  .due-date {
    font-size: 10px; color: var(--color-text-muted);
    display: flex; align-items: center; gap: 4px; margin-top: 12px;
  }
  .due-date.overdue  { color: #E24B4A; font-weight: 700; }
  .due-date.due-soon { color: #BA7517; font-weight: 700; }

  .due-badge {
    font-size: 9px; font-weight: 800; padding: 2px 7px;
    border-radius: 4px; text-transform: uppercase; letter-spacing: 0.3px;
  }
  .due-badge.overdue  { background: #FCEBEB; color: #A32D2D; }
  .due-badge.due-soon { background: #FAEEDA; color: #854F0B; }
  .due-badge.on-track { background: #EAF3DE; color: #3B6D11; }

  /* ── VIEW SWITCHER ── */
  .view-switcher {
    display: flex; gap: 4px;
    background: var(--color-background-secondary);
    padding: 4px; border-radius: 10px;
    border: 1px solid var(--color-border);
    flex-shrink: 0;
  }
  .view-btn {
    padding: 6px 12px; font-size: 12px; border-radius: 7px; border: none;
    cursor: pointer; font-weight: 600; transition: 0.2s;
    background: transparent; color: var(--color-text-muted);
    white-space: nowrap;
  }
  .view-btn.active { background: #E8500A; color: white; }

  /* ── TOOLBAR ── */
  .tasks-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 24px 0;
    gap: 16px;
    flex-wrap: wrap;
  }
  @media (max-width: 768px) {
    .tasks-toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
      margin: 16px 0;
    }
    .tasks-toolbar > * { width: 100%; }
  }

  .tasks-toolbar-search { flex: 1; max-width: 400px; }
  @media (max-width: 768px) {
    .tasks-toolbar-search { max-width: 100%; }
  }

  .tasks-toolbar-filters { display: flex; gap: 6px; flex-wrap: wrap; }
  @media (max-width: 640px) {
    .tasks-toolbar-filters {
      overflow-x: auto; flex-wrap: nowrap; padding-bottom: 2px;
      -webkit-overflow-scrolling: touch; scrollbar-width: none;
    }
    .tasks-toolbar-filters::-webkit-scrollbar { display: none; }
    .tasks-toolbar-filters button { flex-shrink: 0; }
  }

  .tasks-toolbar-bottom {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
  }
  @media (min-width: 769px) {
    .tasks-toolbar-bottom { display: contents; }
  }

  /* ── COLUMN TABS MOBILE ── */
  .col-tabs { display: none; }
  @media (max-width: 640px) {
    .col-tabs {
      display: flex; gap: 6px; overflow-x: auto;
      scrollbar-width: none; -webkit-overflow-scrolling: touch; margin-bottom: 12px;
    }
    .col-tabs::-webkit-scrollbar { display: none; }
    .col-tab {
      flex-shrink: 0; padding: 6px 14px; border-radius: 20px;
      border: 1px solid var(--color-border); background: transparent;
      color: var(--color-text-muted); font-size: 12px; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s;
    }
    .col-tab.active { background: #E8500A; color: white; border-color: #E8500A; }
    .col-count {
      background: rgba(255,255,255,0.25); border-radius: 10px;
      padding: 1px 6px; font-size: 10px; font-weight: 800;
    }
    .col-tab:not(.active) .col-count {
      background: var(--color-background-tertiary); color: var(--color-text-muted);
    }
  }

  /* ── MODAL GRID ── */
  .modal-grid {
    display: grid; grid-template-columns: 2fr 1fr; gap: 24px; min-height: 320px;
  }
  @media (max-width: 640px) {
    .modal-grid { grid-template-columns: 1fr; gap: 0; min-height: unset; }
  }

  .modal-main { min-width: 0; display: flex; flex-direction: column; gap: 20px; }

  .modal-sidebar {
    border-left: 1px solid var(--color-border); padding-left: 24px;
    display: flex; flex-direction: column; gap: 16px;
  }
  @media (max-width: 640px) {
    .modal-sidebar {
      border-left: none; border-top: 1px solid var(--color-border);
      padding-left: 0; padding-top: 20px; margin-top: 4px;
    }
  }

  .modal-sidebar-actions { margin-top: auto; display: flex; flex-direction: column; gap: 10px; }
  @media (max-width: 640px) {
    .modal-sidebar-actions { flex-direction: row; margin-top: 8px; }
    .modal-sidebar-actions > * { flex: 1; }
  }

  .modal-label {
    font-size: 10px; font-weight: 800; color: var(--color-text-muted);
    text-transform: uppercase; display: block; margin-bottom: 4px;
  }

  /* ── SOURCE BADGE ── */
  .source-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 9px; font-weight: 700; padding: 2px 7px;
    border-radius: 4px; text-transform: uppercase;
  }
  .source-badge.cr    { background: #FFF0E8; color: #E8500A; border: 1px solid #FDBA8C; }
  .source-badge.tache { background: var(--color-background-secondary); color: var(--color-text-muted); }

  /* ── TOAST UNDO ── */
  .toast-undo-btn {
    margin-left: 14px; padding: 4px 14px; border-radius: 6px;
    border: 2px solid currentColor; background: rgba(255,255,255,0.15);
    color: inherit; font-size: 12px; font-weight: 800; cursor: pointer;
    letter-spacing: 0.3px; transition: background 0.15s;
  }
  .toast-undo-btn:hover { background: rgba(255,255,255,0.3); }

  /* ── SKELETON ── */
  .loading-skeleton {
    background: var(--color-border); border-radius: 8px;
    animation: skeleton-pulse 1.4s ease-in-out infinite;
  }
  @keyframes skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

  /* ── TABLE RESPONSIVE ── */
  .tasks-table-wrap {
    background: var(--color-background-secondary);
    border-radius: 16px; border: 1px solid var(--color-border); overflow: hidden;
  }
  @media (max-width: 768px) {
    .tasks-table-wrap { border-radius: 12px; }
    .tasks-table-wrap table, .tasks-table-wrap thead, .tasks-table-wrap tbody,
    .tasks-table-wrap th, .tasks-table-wrap td, .tasks-table-wrap tr { display: block; }
    .tasks-table-wrap thead { display: none; }
    .tasks-table-wrap tbody tr {
      border-top: 1px solid var(--color-border); padding: 14px 16px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .tasks-table-wrap tbody td { padding: 0 !important; }
    .tasks-table-wrap tbody td:first-child { font-size: 14px; font-weight: 600; }
    .td-meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  }
`;

// ✅ CORRIGÉ — valeurs alignées avec la migration
const PRIORITIES = [
  { val: 'urgente', label: 'Urgente', color: 'red',    dot: '#E24B4A' },
  { val: 'haute',   label: 'Haute',   color: 'orange', dot: '#E8500A' },
  { val: 'normale', label: 'Normale', color: 'gold',   dot: '#BA7517' },
  { val: 'basse',   label: 'Basse',   color: 'blue',   dot: '#378ADD' },
];

const COL_LABEL = { todo: 'À faire', inprogress: 'En cours', done: 'Terminé' };
const COL_ORDER = { todo: 0, inprogress: 1, done: 2 };

// ✅ Mapping statut backend → colonne frontend
const STATUT_TO_COL = {
  a_faire:   'todo',
  en_cours:  'inprogress',
  termine:   'done',
  annule:    'todo', // les annulées restent visibles dans "À faire"
};

// ✅ Mapping colonne frontend → statut backend
const COL_TO_STATUT = {
  todo:       'a_faire',
  inprogress: 'en_cours',
  done:       'termine',
};

const ROLES_SUPERVISEUR = [
  'Super Admin', 'Admin Entreprise', 'super_admin', 'admin',
  'Assistant', 'Assistante', 'assistant', 'assistante',
];
const ROLES_ADMIN     = ['Super Admin', 'Admin Entreprise', 'super_admin', 'admin'];
const ROLES_MANAGER   = ['Manager', 'manager'];
const ROLES_DIRECTEUR = ['Directeur', 'directeur'];

/* ─── HELPERS ─── */
function getDueStatus(dueDateStr, isDone) {
  if (isDone || !dueDateStr) return null;
  let due;
  if (/^\d{4}-\d{2}-\d{2}/.test(dueDateStr)) {
    due = new Date(dueDateStr);
  } else {
    const months = { janvier:0,février:1,mars:2,avril:3,mai:4,juin:5,juillet:6,août:7,septembre:8,octobre:9,novembre:10,décembre:11 };
    const parts = dueDateStr.toLowerCase().split(' ');
    if (parts.length < 3) return null;
    const day = parseInt(parts[0], 10), month = months[parts[1]], year = parseInt(parts[2], 10);
    if (isNaN(day) || month === undefined || isNaN(year)) return null;
    due = new Date(year, month, day);
  }
  const today = new Date(); today.setHours(0,0,0,0);
  const diffDays = Math.ceil((due - today) / 86400000);
  if (diffDays < 0)  return { status: 'overdue',  label: 'En retard', days: Math.abs(diffDays) };
  if (diffDays <= 3) return { status: 'due-soon', label: 'Bientôt',   days: diffDays };
  return               { status: 'on-track',  label: 'À jour',    days: diffDays };
}

// ✅ CORRIGÉ — tache_colonne (sans s) + priorités alignées migration
function normalizeTache(t) {
  return {
    id:       `tache_${t.tache_id ?? t.id}`,
    title:    t.tache_titre ?? t.title ?? '',
    assignee: t.user ? `${t.user.util_prenom} ${t.user.util_nom}`.trim() : (t.assignee ?? ''),
    user_id:  t.user_id != null ? Number(t.user_id) : null,
    due:      t.tache_echeance ?? t.due ?? '',
    priority: t.tache_priorite ?? t.priority ?? 'normale',
    tags:     t.tags ?? [],
    source:   'tache',
    colKey:   t.tache_colonne ?? 'a_faire', // ✅ corrigé : sans 's', valeur migration
  };
}

// ✅ CORRIGÉ — mapping statut backend → colonne kanban
function normalizeAction(a) {
  const colKey = STATUT_TO_COL[a.action_statut] ?? 'todo';

  return {
    id:       `action_${a.action_id ?? a.id}`,
    title:    a.action_texte ?? a.title ?? '',
    assignee: a.assignee ?? '',
    user_id:  a.user_id != null ? Number(a.user_id) : null,
    due:      a.action_echeance ?? a.due ?? '',
    priority: 'normale', // ✅ corrigé : aligné migration
    tags:     ['CR'],
    source:   'action',
    reunion:  a.reunion ?? null,
    colKey,
    description: a.reunion ? `Action issue de la réunion : ${a.reunion}` : '',
  };
}

function repartirEnColonnes(items) {
  return {
    todo:       items.filter(t => t.colKey === 'todo'),
    inprogress: items.filter(t => t.colKey === 'inprogress'),
    done:       items.filter(t => t.colKey === 'done'),
  };
}

/* ─── COMPOSANTS ─── */
function DueBadge({ due }) {
  if (!due) return null;
  const label =
    due.status === 'overdue'  ? `${due.days}j de retard` :
    due.status === 'due-soon' ? (due.days === 0 ? "Aujourd'hui" : `Dans ${due.days}j`) :
    'À jour';
  return <span className={`due-badge ${due.status}`}>{label}</span>;
}

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div className="loading-skeleton" style={{ height: 10, width: '60%', marginBottom: 12 }} />
      <div className="loading-skeleton" style={{ height: 14, width: '90%', marginBottom: 8 }} />
      <div className="loading-skeleton" style={{ height: 10, width: '40%' }} />
    </div>
  );
}

/* ─── PAGE PRINCIPALE ─── */
export default function TasksPage() {
  const { addToast } = useNotif();
  const { user } = useAuth();

  const raw            = user?.roleRaw || '';
  const estSuperviseur = ROLES_SUPERVISEUR.includes(raw);
  const estAdminPur    = ROLES_ADMIN.includes(raw);
  const estManager     = ROLES_MANAGER.includes(raw);
  const estDirecteur   = ROLES_DIRECTEUR.includes(raw);

  const [tasks,          setTasks]          = useState({ todo: [], inprogress: [], done: [] });
  const [loading,        setLoading]        = useState(true);
  const [view,           setView]           = useState('Kanban');
  const [search,         setSearch]         = useState('');
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [dragInfo,       setDragInfo]       = useState({ id: null, sCol: null });
  const [overInfo,       setOverInfo]       = useState({ col: null, index: null });
  const [draggingId,     setDraggingId]     = useState(null);
  const [editingTask,    setEditingTask]    = useState(null);
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [activeCol,      setActiveCol]      = useState('todo');
  const [isMobile,       setIsMobile]       = useState(false);

  const prevTasksRef = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('xamio_token');
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    try {
      const [tachesRes, actionsRes] = await Promise.all([
        fetch('/api/taches',      { headers }).then(r => r.ok ? r.json() : { data: [] }),
        fetch('/api/mes-actions', { headers }).then(r => r.ok ? r.json() : { data: [] }),
      ]);
      const taches  = (tachesRes.data  ?? []).map(normalizeTache);
      const actions = (actionsRes.data ?? []).map(normalizeAction);
      setTasks(repartirEnColonnes([...taches, ...actions]));
    } catch {
      addToast('Erreur lors du chargement des tâches.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const estAssigne = useCallback((task) => {
    if (!user || !task) return false;
    return Number(task.user_id) === Number(user.id);
  }, [user]);

  const filteredTasks = useMemo(() => {
    const filterFn = (list) => (list || []).filter(t => {
      const matchSearch   = t.title.toLowerCase().includes(search.toLowerCase());
      const matchPriority = !priorityFilter || t.priority === priorityFilter;
      const canSee =
        estAdminPur    ? true :
        estDirecteur   ? true :
        estManager     ? true :
        estSuperviseur ? true :
        estAssigne(t);
      return matchSearch && matchPriority && canSee;
    });
    return {
      todo:       filterFn(tasks.todo),
      inprogress: filterFn(tasks.inprogress),
      done:       filterFn(tasks.done),
    };
  }, [tasks, search, priorityFilter, estAdminPur, estDirecteur, estManager, estSuperviseur, estAssigne]);

  const peutDragguer = useCallback((task, colKey) => {
    if (!task) return false;
    if (estDirecteur) return false;
    if (task.source === 'action') {
      if (estAdminPur || estManager) return true;
      if (!user) return false;
      return Number(task.user_id) === Number(user.id);
    }
    if (estAdminPur || estManager) return true;
    if (!user) return false;
    return Number(task.user_id) === Number(user.id);
  }, [estAdminPur, estDirecteur, estManager, user]);

  const peutDeposerDans = useCallback((taskId, destCol, sourceCol) => {
    const allTasks = [...tasks.todo, ...tasks.inprogress, ...tasks.done];
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return false;
    if (estDirecteur) return false;
    if (estAdminPur) return true;
    if (estManager) return true;
    if (!user) return false;
    if (Number(task.user_id) !== Number(user.id)) return false;
    return COL_ORDER[destCol] > COL_ORDER[sourceCol];
  }, [tasks, estAdminPur, estDirecteur, estManager, user]);

  const peutModifier = useCallback((task, colKey) => {
    if (estDirecteur) return false;
    if (estAdminPur) return true;
    if (estManager) return true;
    if (estSuperviseur) return true;
    if (!user) return false;
    return Number(task.user_id) === Number(user.id);
  }, [estAdminPur, estDirecteur, estManager, estSuperviseur, user]);

  const handleDragStart = (e, task, colKey) => {
    if (!peutDragguer(task, colKey)) { e.preventDefault(); return; }
    setDragInfo({ id: task.id, sCol: colKey });
    setDraggingId(task.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setOverInfo({ col: null, index: null });
  };

  const handleDrop = (e, destCol) => {
    e.preventDefault();
    const { id: taskId, sCol: sourceCol } = dragInfo;

    if (!taskId || sourceCol === destCol) {
      setDragInfo({ id: null, sCol: null });
      setOverInfo({ col: null, index: null });
      setDraggingId(null);
      return;
    }

    if (!peutDeposerDans(taskId, destCol, sourceCol)) {
      addToast("Vous ne pouvez pas déplacer cette tâche vers cette colonne.", 'error');
      setDragInfo({ id: null, sCol: null });
      setOverInfo({ col: null, index: null });
      setDraggingId(null);
      return;
    }

    prevTasksRef.current = JSON.parse(JSON.stringify(tasks));

    setTasks(prev => {
      const newTasks  = JSON.parse(JSON.stringify(prev));
      const sIndex    = newTasks[sourceCol].findIndex(t => t.id === taskId);
      const [moved]   = newTasks[sourceCol].splice(sIndex, 1);
      moved.colKey    = destCol;
      const targetIdx = overInfo.index !== null ? overInfo.index : newTasks[destCol].length;
      newTasks[destCol].splice(targetIdx, 0, moved);
      return newTasks;
    });

    const token    = localStorage.getItem('xamio_token');
    const isAction = taskId.startsWith('action_');

    if (isAction) {
      const numericId = taskId.replace('action_', '');
      // ✅ CORRIGÉ — valeurs alignées avec la migration
      fetch(`/api/actions/${numericId}/statut`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ action_statut: COL_TO_STATUT[destCol] }),
      }).catch(() => addToast('Erreur lors de la sauvegarde du déplacement.', 'error'));
    } else {
      const numericId = taskId.replace('tache_', '');
      // ✅ CORRIGÉ — tache_colonne sans 's', valeurs migration
      fetch(`/api/taches/${numericId}/colonne`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ tache_colonne: destCol }),
      }).catch(() => addToast('Erreur lors de la sauvegarde du déplacement.', 'error'));
    }

    addToast(
      <span>
        Tâche déplacée vers <strong>{COL_LABEL[destCol]}</strong>
        <button
          className="toast-undo-btn"
          onClick={() => {
            if (prevTasksRef.current) {
              setTasks(prevTasksRef.current);
              prevTasksRef.current = null;
              addToast('Déplacement annulé.', 'info');
            }
          }}
        >
          Annuler
        </button>
      </span>,
      'success'
    );

    setDragInfo({ id: null, sCol: null });
    setOverInfo({ col: null, index: null });
    setDraggingId(null);
  };

  const handleMoveCard = (task, currentCol, direction) => {
    const cols = ['todo', 'inprogress', 'done'];
    const currentIdx = cols.indexOf(currentCol);
    const destIdx    = currentIdx + direction;
    if (destIdx < 0 || destIdx >= cols.length) return;
    const destCol = cols[destIdx];

    if (!peutDeposerDans(task.id, destCol, currentCol)) {
      addToast("Vous ne pouvez pas déplacer cette tâche vers cette colonne.", 'error');
      return;
    }

    prevTasksRef.current = JSON.parse(JSON.stringify(tasks));

    setTasks(prev => {
      const newTasks = JSON.parse(JSON.stringify(prev));
      const sIndex   = newTasks[currentCol].findIndex(t => t.id === task.id);
      const [moved]  = newTasks[currentCol].splice(sIndex, 1);
      moved.colKey   = destCol;
      newTasks[destCol].push(moved);
      return newTasks;
    });

    setActiveCol(destCol);

    const token        = localStorage.getItem('xamio_token');
    const isActionTask = task.id.startsWith('action_');

    if (isActionTask) {
      const numericId = task.id.replace('action_', '');
      // ✅ CORRIGÉ
      fetch(`/api/actions/${numericId}/statut`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ action_statut: COL_TO_STATUT[destCol] }),
      }).catch(() => addToast('Erreur lors de la sauvegarde.', 'error'));
    } else {
      const numericId = task.id.replace('tache_', '');
      // ✅ CORRIGÉ
      fetch(`/api/taches/${numericId}/colonne`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ tache_colonne: destCol }),
      }).catch(() => addToast('Erreur lors de la sauvegarde.', 'error'));
    }

    addToast(<span>Tâche déplacée vers <strong>{COL_LABEL[destCol]}</strong></span>, 'success');
  };

  const handleMoveAction = async (destCol) => {
    if (!editingTask || editingTask.source !== 'action') return;
    const taskId    = editingTask.id;
    const sourceCol = editingTask.colKey;
    if (sourceCol === destCol) { setIsModalOpen(false); return; }

    if (!estAdminPur && !estManager && COL_ORDER[destCol] < COL_ORDER[sourceCol]) {
      addToast("Vous ne pouvez pas revenir en arrière sur une action.", 'error');
      return;
    }

    prevTasksRef.current = JSON.parse(JSON.stringify(tasks));
    setTasks(prev => {
      const newTasks = JSON.parse(JSON.stringify(prev));
      const sIndex   = newTasks[sourceCol].findIndex(t => t.id === taskId);
      if (sIndex === -1) return prev;
      const [moved]  = newTasks[sourceCol].splice(sIndex, 1);
      moved.colKey   = destCol;
      newTasks[destCol].push(moved);
      return newTasks;
    });
    setIsModalOpen(false);
    if (isMobile) setActiveCol(destCol);

    const numericId = taskId.replace('action_', '');
    const token     = localStorage.getItem('xamio_token');
    try {
      // ✅ CORRIGÉ
      await fetch(`/api/actions/${numericId}/statut`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ action_statut: COL_TO_STATUT[destCol] }),
      });
      addToast(<span>Action déplacée vers <strong>{COL_LABEL[destCol]}</strong></span>, 'success');
    } catch {
      if (prevTasksRef.current) { setTasks(prevTasksRef.current); prevTasksRef.current = null; }
      addToast('Erreur lors de la sauvegarde.', 'error');
    }
  };

  const handleSave = async () => {
    if (!editingTask || editingTask.source === 'action') { setIsModalOpen(false); return; }

    const token     = localStorage.getItem('xamio_token');
    const numericId = editingTask.id.replace('tache_', '');

    try {
      await fetch(`/api/taches/${numericId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          tache_titre:    editingTask.title,
          tache_priorite: editingTask.priority,
          tache_echeance: editingTask.due,
          tache_colonne:  editingTask.colKey, // ✅ CORRIGÉ — sans 's'
        }),
      });

      setTasks(prev => {
        const newTasks = { ...prev };
        newTasks[editingTask.colKey] = newTasks[editingTask.colKey].map(t =>
          t.id === editingTask.id ? editingTask : t
        );
        return newTasks;
      });

      setIsModalOpen(false);
      addToast('Tâche mise à jour.', 'success');
    } catch {
      addToast('Erreur lors de la sauvegarde.', 'error');
    }
  };

  const renderCard = (task, colKey) => {
    const isDone     = colKey === 'done';
    const isAction   = task.source === 'action';
    const canModify  = peutModifier(task, colKey);
    const canDrag    = peutDragguer(task, colKey);
    const priority   = PRIORITIES.find(p => p.val === task.priority);
    const isDragging = draggingId === task.id;
    const due        = getDueStatus(task.due, isDone);
    const cols       = ['todo', 'inprogress', 'done'];
    const colIdx     = cols.indexOf(colKey);

    return (
      <div
        key={task.id}
        draggable={canDrag && !isMobile}
        onDragStart={(e) => handleDragStart(e, task, colKey)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => { e.preventDefault(); setOverInfo({ col: colKey, index: cols.indexOf(colKey) }); }}
        onClick={() => {
          if (canModify) {
            setEditingTask({ ...task, colKey });
            setIsModalOpen(true);
          } else {
            addToast("Vous n'avez pas accès à cette tâche.", 'error');
          }
        }}
        className={[
          'task-card',
          canModify ? 'can-interact' : 'locked',
          isDragging ? 'dragging' : '',
          due?.status === 'overdue'  ? 'overdue'  : '',
          due?.status === 'due-soon' ? 'due-soon' : '',
        ].filter(Boolean).join(' ')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {task.tags?.map(tag => (
              <span key={tag} className={`tag ${tag === 'CR' ? 'cr-tag' : ''}`}>
                {tag === 'CR' ? '📋 CR' : tag}
              </span>
            ))}
          </div>
          <Badge label={priority?.label} color={priority?.color} size="sm" />
        </div>

        <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px 0', lineHeight: 1.4 }}>
          {task.title}
        </p>

        {isAction && task.reunion && (
          <p style={{ fontSize: 11, color: '#E8500A', margin: '0 0 8px', fontStyle: 'italic', lineHeight: 1.4 }}>
            📅 {task.reunion}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
          <div>
            {task.due && (
              <div className={['due-date', due?.status === 'overdue' ? 'overdue' : '', due?.status === 'due-soon' ? 'due-soon' : ''].filter(Boolean).join(' ')}>
                📅 {task.due}
              </div>
            )}
            {due && <div style={{ marginTop: 5 }}><DueBadge due={due} /></div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isMobile && canDrag && (
              <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                {colIdx > 0 && (
                  <button
                    onClick={() => handleMoveCard(task, colKey, -1)}
                    style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-background-secondary)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12 }}
                    title="Colonne précédente"
                  >←</button>
                )}
                {colIdx < 2 && (
                  <button
                    onClick={() => handleMoveCard(task, colKey, 1)}
                    style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #E8500A', background: '#FFF0E8', color: '#E8500A', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12 }}
                    title="Colonne suivante"
                  >→</button>
                )}
              </div>
            )}
            {task.assignee && (
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: isAction ? '#E8500A' : '#378ADD', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                {task.assignee?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-enter">
      <SectionHeader title="Gestion des Tâches" subtitle="Tâches et actions assignées" />

      <div className="tasks-toolbar">
        <div className="tasks-toolbar-search">
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher une tâche..." />
        </div>
        <div className="tasks-toolbar-bottom">
          <div className="tasks-toolbar-filters">
            <button
              onClick={() => setPriorityFilter(null)}
              style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: !priorityFilter ? '#E8500A' : 'transparent', color: !priorityFilter ? '#fff' : 'var(--color-text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Tous
            </button>
            {PRIORITIES.map(p => (
              <button
                key={p.val}
                onClick={() => setPriorityFilter(priorityFilter === p.val ? null : p.val)}
                style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${priorityFilter === p.val ? p.dot : 'var(--color-border)'}`, background: priorityFilter === p.val ? p.dot + '22' : 'transparent', color: priorityFilter === p.val ? p.dot : 'var(--color-text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="view-switcher">
            {['Kanban', 'Liste'].map(v => (
              <button key={v} onClick={() => setView(v)} className={`view-btn ${view === v ? 'active' : ''}`}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      {view === 'Kanban' && (
        <>
          <div className="col-tabs">
            {['todo', 'inprogress', 'done'].map(col => (
              <button
                key={col}
                onClick={() => setActiveCol(col)}
                className={`col-tab ${activeCol === col ? 'active' : ''}`}
              >
                {COL_LABEL[col]}
                <span className="col-count">{filteredTasks[col].length}</span>
              </button>
            ))}
          </div>

          <div className="kanban-container">
            {['todo', 'inprogress', 'done'].map(colKey => {
              const isHidden = isMobile && colKey !== activeCol;
              return (
                <div
                  key={colKey}
                  className={`kanban-col ${overInfo.col === colKey ? 'column-over' : ''}`}
                  style={{ display: isHidden ? 'none' : undefined }}
                  onDragOver={(e) => { e.preventDefault(); setOverInfo(o => ({ ...o, col: colKey })); }}
                  onDragLeave={() => setOverInfo(o => o.col === colKey ? { col: null, index: null } : o)}
                  onDrop={(e) => handleDrop(e, colKey)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>
                      {COL_LABEL[colKey]}
                    </h3>
                    <Badge label={filteredTasks[colKey].length} size="sm" color="muted" />
                  </div>

                  {loading && [1, 2].map(i => <SkeletonCard key={i} />)}

                  {!loading && filteredTasks[colKey].length === 0 && (
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: 24 }}>
                      Aucune tâche
                    </p>
                  )}

                  {!loading && filteredTasks[colKey].map((task) => renderCard(task, colKey))}
                </div>
              );
            })}
          </div>
        </>
      )}

      {view === 'Liste' && (
        <div className="tasks-table-wrap">
          {loading ? (
            <div style={{ padding: 24 }}>
              {[1,2,3,4].map(i => <div key={i} className="loading-skeleton" style={{ height: 40, marginBottom: 12, borderRadius: 8 }} />)}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--color-background-tertiary)', fontSize: 11 }}>
                <tr>
                  <th style={{ padding: 16, textAlign: 'left' }}>TÂCHE</th>
                  <th style={{ padding: 16, textAlign: 'left' }}>SOURCE</th>
                  <th style={{ padding: 16, textAlign: 'left' }}>ASSIGNÉ</th>
                  <th style={{ padding: 16, textAlign: 'left' }}>ÉCHÉANCE</th>
                  <th style={{ padding: 16, textAlign: 'left' }}>STATUT</th>
                  <th style={{ padding: 16, textAlign: 'left' }}>PRIORITÉ</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(filteredTasks).flatMap(([col, list]) =>
                  list.map(t => {
                    const due      = getDueStatus(t.due, col === 'done');
                    const priority = PRIORITIES.find(p => p.val === t.priority);
                    const canModify = peutModifier(t, col);
                    return (
                      <tr
                        key={t.id}
                        style={{ borderTop: '1px solid var(--color-border)', cursor: canModify ? 'pointer' : 'default', opacity: canModify ? 1 : 0.6 }}
                        onClick={() => {
                          if (canModify) { setEditingTask({ ...t, colKey: col }); setIsModalOpen(true); }
                        }}
                      >
                        <td style={{ padding: 16, fontWeight: 600 }}>{t.title}</td>
                        <td style={{ padding: 16 }} className="td-meta">
                          <span className={`source-badge ${t.source === 'action' ? 'cr' : 'tache'}`}>
                            {t.source === 'action' ? '📋 CR' : '✓ Tâche'}
                          </span>
                        </td>
                        <td style={{ padding: 16, color: 'var(--color-text-muted)' }} className="td-meta">
                          {t.assignee || '—'}
                        </td>
                        <td style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 13 }} className="td-meta">
                          {t.due || '—'}
                        </td>
                        <td style={{ padding: 16 }} className="td-meta">
                          {col === 'done'
                            ? <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Terminé</span>
                            : due ? <DueBadge due={due} /> : <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{COL_LABEL[col]}</span>
                          }
                        </td>
                        <td style={{ padding: 16 }} className="td-meta">
                          <Badge label={priority?.label} color={priority?.color} />
                        </td>
                      </tr>
                    );
                  })
                )}
                {Object.values(filteredTasks).every(l => l.length === 0) && (
                  <tr>
                    <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      Aucune tâche trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Détails de la tâche" width={isMobile ? '95vw' : '800px'}>
        {editingTask && (
          <div className="modal-grid">
            <div className="modal-main">
              {editingTask.source === 'action' ? (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FFF0E8', border: '1px solid #FDBA8C' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#E8500A', margin: '0 0 4px' }}>📋 Action issue d'un compte rendu</p>
                  <p style={{ fontSize: 12, color: '#854F0B', margin: 0, lineHeight: 1.55 }}>
                    Cette action est gérée depuis la réunion associée. Elle est en lecture seule ici.
                    {editingTask.reunion && <><br />Réunion : <strong>{editingTask.reunion}</strong></>}
                  </p>
                </div>
              ) : (
                <Input
                  label="TITRE"
                  value={editingTask.title}
                  onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              )}

              <div>
                <label className="modal-label">DESCRIPTION</label>
                <textarea
                  disabled={editingTask.source === 'action'}
                  style={{ width: '100%', minHeight: 120, padding: 12, borderRadius: 8, border: '1px solid var(--color-border)', background: editingTask.source === 'action' ? 'var(--color-background-secondary)' : 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontFamily: 'inherit', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', opacity: editingTask.source === 'action' ? 0.6 : 1 }}
                  value={editingTask.description || ''}
                  onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                  placeholder={editingTask.source === 'action' ? '' : 'Ajoutez des détails sur cette tâche...'}
                />
              </div>
            </div>

            <div className="modal-sidebar">
              <div>
                <label className="modal-label">STATUT</label>
                <p style={{ textTransform: 'uppercase', fontSize: 12, fontWeight: 700, color: '#E8500A', margin: 0 }}>
                  {COL_LABEL[editingTask.colKey]}
                </p>
              </div>

              <div>
                <label className="modal-label">ÉCHÉANCE</label>
                <p style={{ fontSize: 13, margin: '0 0 6px 0', color: 'var(--color-text-muted)' }}>
                  {editingTask.due || '—'}
                </p>
                <DueBadge due={getDueStatus(editingTask.due, editingTask.colKey === 'done')} />
              </div>

              {editingTask.source !== 'action' && (
                <div>
                  <label className="modal-label">PRIORITÉ</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    {PRIORITIES.map(p => (
                      <button
                        key={p.val}
                        onClick={() => setEditingTask({ ...editingTask, priority: p.val })}
                        style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${editingTask.priority === p.val ? p.dot : 'var(--color-border)'}`, background: editingTask.priority === p.val ? p.dot + '22' : 'transparent', color: editingTask.priority === p.val ? p.dot : 'var(--color-text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {editingTask.source !== 'action' && (
                <Input
                  label="ÉCHÉANCE"
                  value={editingTask.due}
                  onChange={e => setEditingTask({ ...editingTask, due: e.target.value })}
                />
              )}

              <div>
                <label className="modal-label">RESPONSABLE</label>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
                  {editingTask.assignee || '—'}
                </p>
              </div>

              <div className="modal-sidebar-actions">
                {editingTask.source === 'action' && (estAdminPur || estManager || Number(editingTask.user_id) === Number(user?.id)) && (
                  <>
                    {editingTask.colKey !== 'inprogress' && editingTask.colKey !== 'done' && (
                      <Button variant="primary" onClick={() => handleMoveAction('inprogress')} fullWidth>
                        ▶ Marquer En cours
                      </Button>
                    )}
                    {editingTask.colKey !== 'done' && (
                      <Button variant="primary" onClick={() => handleMoveAction('done')} fullWidth>
                        ✓ Marquer Terminé
                      </Button>
                    )}
                    {editingTask.colKey === 'done' && (estAdminPur || estManager) && (
                      <Button variant="ghost" onClick={() => handleMoveAction('inprogress')} fullWidth>
                        ↩ Remettre En cours
                      </Button>
                    )}
                  </>
                )}
                {editingTask.source !== 'action' && !estDirecteur && (
                  <Button variant="primary" onClick={handleSave} fullWidth>Enregistrer</Button>
                )}
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} fullWidth>Fermer</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}