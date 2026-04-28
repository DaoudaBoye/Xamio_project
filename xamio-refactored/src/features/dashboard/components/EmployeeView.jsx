import { memo, useMemo } from 'react';
import { AlertBanner }  from './AlertBanner';
import { MeetingsList } from './MeetingsList';
import { TaskProgress } from './TaskProgress';
import { SectionHeader, Card, EmptyState } from './atoms';
import { buildTaskCounts, safeNum, isToday, minutesUntil } from './dashboard.utils';

const EMPLOYEE_QUICK_ACTIONS = [
  { label: 'Mes réunions',  icon: '📅', route: '/meetings'      },
  { label: 'Mes tâches',    icon: '✅', route: '/tasks'          },
  { label: 'Mes documents', icon: '📄', route: '/documents'      },
  { label: 'Notifications', icon: '🔔', route: '/notifications'  },
];

export const EmployeeView = memo(function EmployeeView({
  greeting, alerts, meetings, loading, tasks, navigate,
}) {
  const taskCounts = useMemo(() => buildTaskCounts(tasks), [tasks]);

  const myMeetings = useMemo(
    () => meetings
      .filter(m => m.status === 'planifiee' || m.status === 'imminente')
      .slice(0, 5),
    [meetings]
  );

  return (
    <div className="db-page" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="db-fade-in">
        <h1 style={{
          fontSize: 21, fontWeight: 700, letterSpacing: '-.04em',
          color: 'var(--c-t1)', lineHeight: 1.2, marginBottom: 4,
        }}>
          {greeting.salut}{greeting.firstName ? `, ${greeting.firstName}` : ''} 👋
        </h1>
        <p style={{ fontSize: 12, color: 'var(--c-t3)', textTransform: 'capitalize' }}>
          {greeting.dateStr}
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="db-fade-in" style={{ animationDelay: '.05s' }}>
          <AlertBanner alerts={alerts} onNavigate={navigate} />
        </div>
      )}

      {/* KPI row (compact, 2 cols) */}
      <div
        className="db-fade-in"
        style={{ animationDelay: '.08s', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
      >
        <div
          className="db-kpi"
          style={{ '--kpi-accent': 'var(--c-brand)', cursor: 'pointer' }}
          onClick={() => navigate('/meetings')}
          role="button" tabIndex={0}
        >
          <p className="db-kpi-label">Mes réunions à venir</p>
          <p className="db-kpi-value">{loading ? '…' : myMeetings.length}</p>
          <p className="db-kpi-sub">Réunions planifiées</p>
        </div>

        <div
          className="db-kpi"
          style={{ '--kpi-accent': 'var(--c-purple)', cursor: 'pointer' }}
          onClick={() => navigate('/tasks')}
          role="button" tabIndex={0}
        >
          <p className="db-kpi-label">Mes tâches en cours</p>
          <p className="db-kpi-value">{taskCounts.inprog}</p>
          <p className="db-kpi-sub">{taskCounts.todo} à faire · {taskCounts.done} terminées</p>
        </div>
      </div>

      {/* Content grid */}
      <div
        className="db-fade-in"
        style={{ animationDelay: '.12s', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 240px', gap: 20, alignItems: 'start' }}
      >
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <MeetingsList
            meetings={myMeetings}
            loading={loading}
            hasInProgress={false}
            canCreate={false}
            navigate={navigate}
          />
          <TaskProgress taskCounts={taskCounts} canCreate={false} navigate={navigate} />
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 16 }}>
          <SectionHeader label="Raccourcis" />
          <Card>
            {EMPLOYEE_QUICK_ACTIONS.map(({ label, icon, route }, i, arr) => (
              <button
                key={label}
                className="db-qa-btn"
                onClick={() => navigate(route)}
                style={i === arr.length - 1 ? { borderBottom: 'none' } : {}}
              >
                <span className="db-qa-icon">{icon}</span>
                {label}
              </button>
            ))}
          </Card>

          <SectionHeader label="Activité récente" style={{ marginTop: 8 }} />
          <Card>
            <EmptyState
              icon="🔔"
              title="Aucune activité"
              description="Vos notifications apparaîtront ici."
            />
          </Card>
        </div>
      </div>
    </div>
  );
});
