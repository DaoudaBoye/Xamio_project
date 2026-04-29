import { memo } from 'react';
import { SectionHeader, Card, EmptyState, ProgressBar } from './atoms';
import { completionPct } from './dashboard.utils';

const TASK_COLS = [
  { key: 'done',   label: 'Terminées', color: 'var(--c-green)'  },
  { key: 'inprog', label: 'En cours',  color: 'var(--c-brand)'  },
  { key: 'todo',   label: 'À faire',   color: 'var(--c-t3)'     },
];

export const TaskProgress = memo(function TaskProgress({ taskCounts, loading, canCreate, navigate }) {
  const pct = completionPct(taskCounts);
  const pctColor =
    pct >= 75 ? 'var(--c-green)' :
    pct >= 40 ? 'var(--c-brand)' :
    'var(--c-amber)';

  return (
    <div>
      <SectionHeader
        label="Avancement des tâches"
        action="Kanban →"
        onAction={() => navigate('/tasks')}
      />
      <Card>
        {loading ? (
          <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--c-t3)', fontSize: 13 }}>
            Chargement…
          </div>
        ) : taskCounts.total === 0 ? (
          <EmptyState
            icon="✅"
            title="Aucune tâche"
            description="Créez votre première tâche et commencez à avancer."
            ctaLabel={canCreate ? '+ Ajouter une tâche' : undefined}
            onCta={canCreate ? () => navigate('/tasks') : undefined}
          />
        ) : (
          <div style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 11.5, color: 'var(--c-t3)' }}>Avancement global</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: pctColor, fontVariantNumeric: 'tabular-nums' }}>
                {pct}%
              </span>
            </div>

            <ProgressBar pct={pct} />

            <div className="db-task-stats">
              {TASK_COLS.map(({ key, label, color }) => (
                <div key={key} className="db-task-stat">
                  <p style={{
                    fontSize: 22, fontWeight: 700, color,
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.15, margin: 0,
                  }}>
                    {taskCounts[key]}
                  </p>
                  <p style={{
                    fontSize: 10, color: 'var(--c-t3)',
                    marginTop: 3, textTransform: 'uppercase',
                    letterSpacing: '.06em',
                  }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
});