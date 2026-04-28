import { memo, useMemo } from 'react';

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function fmtTime(t) {
  return t ? t.slice(0, 5) : null;
}

/* ─────────────────────────────────────────────
   IA: PRIORITÉ DU JOUR
───────────────────────────────────────────── */
function computePriority({ meetings, taskCounts, appts }) {
  const today = todayStr();

  /* 🔴 1. Réunion imminente / en cours */
  const urgentMeeting = meetings.find(m =>
    ['imminente', 'en_cours'].includes(m.status)
  );

  if (urgentMeeting) {
    return {
      level: 'critical',
      icon: '⏰',
      title: 'Réunion imminente',
      text: `Prépare-toi : ${urgentMeeting.title || 'réunion'} ${
        urgentMeeting.time ? `à ${fmtTime(urgentMeeting.time)}` : ''
      }`,
      action: 'Voir la réunion',
    };
  }

  /* 🔴 2. Tâches en retard */
  if (taskCounts?.enRetard > 0) {
    return {
      level: 'critical',
      icon: '⚠️',
      title: 'Tâches en retard',
      text: `${taskCounts.enRetard} tâche(s) nécessitent ton attention`,
      action: 'Voir les tâches',
    };
  }

  /* 🟠 3. RDV aujourd’hui */
  const todayAppt = appts.find(a =>
    (a.rdv_date || '').split('T')[0] === today &&
    a.rdv_statut === 'confirme'
  );

  if (todayAppt) {
    const name =
      todayAppt.contactExterne?.contact_nom ||
      todayAppt.rdv_titre ||
      '—';

    return {
      level: 'important',
      icon: '🤝',
      title: 'Rendez-vous aujourd’hui',
      text: `${name} ${
        todayAppt.rdv_heure ? `à ${fmtTime(todayAppt.rdv_heure)}` : ''
      }`,
      action: 'Voir le RDV',
    };
  }

  /* 🟢 4. Journée calme / productive */
  const { terminees = 0, total = 0 } = taskCounts || {};
  const pct = total > 0 ? Math.round((terminees / total) * 100) : 0;

  if (pct >= 70) {
    return {
      level: 'success',
      icon: '🏆',
      title: 'Bonne progression',
      text: `${pct}% des tâches terminées`,
      action: 'Continuer',
    };
  }

  return {
    level: 'neutral',
    icon: '📊',
    title: 'Journée stable',
    text: 'Rien d’urgent pour le moment',
    action: null,
  };
}

/* ─────────────────────────────────────────────
   STYLE
───────────────────────────────────────────── */
const STYLE = {
  critical: {
    bg: '#FEF1F1',
    border: '#F9C8C8',
    text: '#8B1C1C',
  },
  important: {
    bg: '#FEF7E7',
    border: '#FAE1AC',
    text: '#865110',
  },
  success: {
    bg: '#EDFAF3',
    border: '#B8EDD3',
    text: '#0E6836',
  },
  neutral: {
    bg: '#F4F3F1',
    border: '#D9D7D2',
    text: '#5C5B55',
  },
};

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export const FocusOfDay = memo(function FocusOfDay({
  meetings = [],
  taskCounts = {},
  appts = [],
}) {
  const priority = useMemo(
    () => computePriority({ meetings, taskCounts, appts }),
    [meetings, taskCounts, appts]
  );

  if (!priority) return null;

  const c = STYLE[priority.level];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      padding: '14px 18px',
      borderRadius: '12px',
      background: c.bg,
      border: `1px solid ${c.border}`,
    }}>
      {/* LEFT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '20px' }}>{priority.icon}</div>

        <div>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: c.text,
            opacity: 0.7,
          }}>
            Priorité du jour
          </div>

          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: c.text,
          }}>
            {priority.title}
          </div>

          <div style={{
            fontSize: '13px',
            color: c.text,
            opacity: 0.85,
          }}>
            {priority.text}
          </div>
        </div>
      </div>

      {/* ACTION */}
      {priority.action && (
        <button style={{
          background: c.text,
          color: '#fff',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
        }}>
          {priority.action}
        </button>
      )}
    </div>
  );
});
