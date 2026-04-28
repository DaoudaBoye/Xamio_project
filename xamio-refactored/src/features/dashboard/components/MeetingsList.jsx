import { memo } from 'react';
import { SectionHeader, Card, EmptyState, StatusBadge, MeetingDateBlock, ImminentBadge } from './atoms';
import { isToday, minutesUntil } from './dashboard.utils';

/* ── Single meeting row ── */
const MeetingRow = memo(function MeetingRow({ meeting: m, onClick, isLast }) {
  const dateStr = typeof m.date === 'string' ? m.date.split('T')[0] : m.date;
  const today   = isToday(dateStr);
  const mins    = today ? minutesUntil(dateStr, m.time) : Infinity;
  const imminent = mins >= 0 && mins <= 120;

  return (
    <div
      className={`db-meeting-row${imminent ? ' imminent' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
      aria-label={`Réunion: ${m.title}`}
    >
      <MeetingDateBlock dateStr={dateStr} isToday={today} />

      <div className="db-meeting-body">
        <p className="db-meeting-title">{m.title || '—'}</p>
        <p className="db-meeting-meta">
          {m.time || '—'} · {m.duration || 60}min
          {m.location ? ` · ${m.location}` : ''}
        </p>
      </div>

      <div className="db-meeting-badge">
        {imminent
          ? <ImminentBadge mins={mins} />
          : <StatusBadge status={m.status} />
        }
      </div>
    </div>
  );
});

/* ── Meetings list section ── */
export const MeetingsList = memo(function MeetingsList({
  meetings, loading, hasInProgress,
  canCreate, onCreateClick, navigate,
}) {
  return (
    <div>
      <SectionHeader
        label="Prochaines réunions"
        action="Voir tout →"
        onAction={() => navigate('/meetings')}
      />
      <Card>
        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : meetings.length === 0 ? (
          <EmptyState
            icon="📅"
            title="Aucune réunion à venir"
            description={
              hasInProgress
                ? 'Une réunion est en cours en ce moment.'
                : 'Planifiez votre prochaine réunion.'
            }
            ctaLabel={!hasInProgress && canCreate ? '+ Planifier' : undefined}
            onCta={!hasInProgress && canCreate ? onCreateClick : undefined}
          />
        ) : (
          meetings.map((m, i) => (
            <MeetingRow
              key={m.id}
              meeting={m}
              isLast={i === meetings.length - 1}
              onClick={() => navigate(`/meetings/${m.id}`)}
            />
          ))
        )}
      </Card>
    </div>
  );
});

/* ── Loading skeleton ── */
function LoadingSkeleton({ rows = 3 }) {
  return (
    <div style={{ padding: '4px 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 12,
            padding: '14px 16px',
            borderBottom: i < rows - 1 ? '1px solid var(--c-border)' : 'none',
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--c-surface-3)', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 12, width: '60%', background: 'var(--c-surface-3)', borderRadius: 4, animation: 'db-soft-pulse 1.5s ease-in-out infinite', animationDelay: `${i * .1}s` }} />
            <div style={{ height: 10, width: '35%', background: 'var(--c-surface-2)', borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
