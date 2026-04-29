export const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];

export const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Normalise une tâche API → colonne kanban
 * tache_colonne : 'todo' | 'inprogress' | 'done'
 */
function tacheToColonne(t) {
  return t.tache_colonne ?? 'todo';
}

/**
 * Normalise une action compte-rendu → colonne kanban
 * action_statut : 'a_faire' | 'en_cours' | 'termine' | 'annule'
 * 'annule' est exclu du décompte (ni todo ni done)
 */
function actionToColonne(a) {
  switch (a.action_statut) {
    case 'termine':  return 'done';
    case 'en_cours': return 'inprogress';
    case 'a_faire':  return 'todo';
    default:         return null; // 'annule' → ignoré
  }
}

/**
 * Accepte :
 * - un tableau plat de tâches API      [{ tache_colonne }]
 * - un objet kanban mockData            { todo:[], inprogress:[], done:[] }
 * - un objet { tasks, actions }         pour combiner les deux sources
 */
export function buildTaskCounts(input) {
  // Format combiné { tasks: [...], actions: [...] }
  if (input && !Array.isArray(input) && ('tasks' in input || 'actions' in input)) {
    const taches  = (input.tasks   ?? []).map(tacheToColonne).filter(Boolean);
    const actions = (input.actions ?? []).map(actionToColonne).filter(Boolean);
    const all     = [...taches, ...actions];
    const done    = all.filter(c => c === 'done').length;
    const inprog  = all.filter(c => c === 'inprogress').length;
    const todo    = all.filter(c => c === 'todo').length;
    return { done, inprog, todo, total: done + inprog + todo };
  }

  // Tableau plat API tâches seules
  if (Array.isArray(input)) {
    const done   = input.filter(t => t.tache_colonne === 'done').length;
    const inprog = input.filter(t => t.tache_colonne === 'inprogress').length;
    const todo   = input.filter(t => t.tache_colonne === 'todo').length;
    return { done, inprog, todo, total: done + inprog + todo };
  }

  // Fallback format kanban objet { todo:[], inprogress:[], done:[] }
  const done   = safeNum(input?.done?.length);
  const inprog = safeNum(input?.inprogress?.length);
  const todo   = safeNum(input?.todo?.length);
  return { done, inprog, todo, total: done + inprog + todo };
}

export function completionPct(counts) {
  if (!counts.total) return 0;
  return Math.round((counts.done / counts.total) * 100);
}

export function isToday(dateStr) {
  if (!dateStr) return false;
  const d = typeof dateStr === 'string' ? dateStr.split('T')[0] : dateStr;
  return new Date(`${d}T00:00:00`).toDateString() === new Date().toDateString();
}

export function minutesUntil(dateStr, timeStr) {
  if (!dateStr || !timeStr) return Infinity;
  const d = typeof dateStr === 'string' ? dateStr.split('T')[0] : dateStr;
  const [h, m] = timeStr.split(':').map(Number);
  const target = new Date(`${d}T00:00:00`);
  target.setHours(h, m, 0, 0);
  return Math.round((target - new Date()) / 60_000);
}

export function getGreeting(name) {
  const h = new Date().getHours();
  return {
    salut: h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir',
    dateStr: new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }),
    firstName: name?.split(' ')[0] || '',
  };
}

export function getTemporalAlerts({ upcomingForAlerts, unread }) {
  const alerts = [];

  const imminent = upcomingForAlerts
    .filter(m => m.status === 'en_cours' || isToday(m.date))
    .map(m => ({
      ...m,
      mins: m.status === 'en_cours' ? 0 : minutesUntil(m.date, m.time),
    }))
    .filter(m => m.mins >= 0 && m.mins <= 120)
    .sort((a, b) => a.mins - b.mins)[0];

  if (imminent) {
    const { mins } = imminent;
    alerts.push({
      icon: '📅',
      text: imminent.title,
      meta: imminent.status === 'en_cours'
        ? (imminent.duration ? `En cours · ~${imminent.duration} min` : 'En cours maintenant')
        : mins < 60 ? `Dans ${mins} min` : `Dans ${Math.round(mins / 60)}h`,
      route: '/meetings',
      level: 'danger',
    });
  }

  if (unread > 0 && alerts.length < 2) {
    alerts.push({
      icon: '🔔',
      text: `${unread} notification${unread > 1 ? 's' : ''} non lue${unread > 1 ? 's' : ''}`,
      meta: 'Voir maintenant',
      route: '/notifications',
      level: 'warn',
    });
  }

  return alerts;
}

export function formatApptDate(dateStr) {
  if (!dateStr) return '—';
  return dateStr.slice(0, 10).split('-').reverse().join('/');
}

export function buildTrend(delta, label, unit = '') {
  return { delta, label, unit, dir: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat' };
}