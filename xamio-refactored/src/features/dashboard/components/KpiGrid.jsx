import { memo } from 'react';
import { TrendChip } from './atoms';
import { safeNum, completionPct, buildTaskCounts } from './dashboard.utils';

/* ── Single KPI card ── */
const KpiCard = memo(function KpiCard({
  label, value, sub, subOk,
  accentColor, onClick, urgent,
  trend,
}) {
  return (
    <div
      className="db-kpi"
      style={{ '--kpi-accent': accentColor }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
      aria-label={`${label}: ${value}`}
    >
      {urgent && <div className="db-dot-urgent" aria-label="Attention requise" />}

      <p className="db-kpi-label">{label}</p>
      <p className="db-kpi-value">{value}</p>

      {sub && (
        <p className={`db-kpi-sub${subOk ? ' ok' : ''}`}>{sub}</p>
      )}

      {trend && (
        <TrendChip delta={trend.delta} unit={trend.unit} label={trend.label} />
      )}
    </div>
  );
});

/* ── KPI grid (4 cards) ── */
export const KpiGrid = memo(function KpiGrid({
  upcomingCount, doneMtgs, loading,
  taskCounts, confirmed, pending,
  navigate,
}) {
  const pct = completionPct(taskCounts);
  const pctColor =
    pct >= 75 ? 'var(--c-green)' :
    pct >= 40 ? 'var(--c-brand)' :
    'var(--c-amber)';

  return (
    <div className="db-kpi-grid" role="list">
      <KpiCard
        label="Réunions à venir"
        value={loading ? '…' : upcomingCount}
        sub={loading ? 'Chargement…' : `${doneMtgs} terminée(s) ce mois`}
        accentColor="var(--c-brand)"
        onClick={() => navigate('/meetings')}
        trend={loading ? null : { delta: upcomingCount - 2, label: 'vs sem. passée' }}
      />

      <KpiCard
        label="Tâches en cours"
        value={taskCounts.inprog}
        sub={`${taskCounts.todo} en attente · ${taskCounts.done} terminées`}
        accentColor="var(--c-purple)"
        onClick={() => navigate('/tasks')}
        trend={{ delta: 1, label: 'terminée(s) auj.' }}
      />

      <KpiCard
        label="RDV confirmés"
        value={confirmed}
        sub={pending > 0 ? `${pending} en attente` : 'Tout confirmé ✓'}
        subOk={pending === 0}
        accentColor={pending > 0 ? 'var(--c-amber)' : 'var(--c-green)'}
        urgent={pending > 0}
        onClick={() => navigate('/appointments')}
        trend={{ delta: 1, label: 'ce mois' }}
      />

      <KpiCard
        label="Taux de complétion"
        value={`${pct}%`}
        sub={pct >= 75 ? 'Excellent rythme ✓' : pct >= 40 ? `${100 - pct}% restant` : 'À accélérer'}
        subOk={pct >= 75}
        accentColor={pctColor}
        onClick={() => navigate('/tasks')}
        trend={{ delta: 5, unit: '%', label: 'vs sem. passée' }}
      />
    </div>
  );
});
