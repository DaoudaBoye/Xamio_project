import { memo } from 'react';

export const AlertBanner = memo(function AlertBanner({ alerts, onNavigate }) {
  if (!alerts.length) return null;

  return (
    <div className="db-alert-wrap" role="alert">
      {alerts.map((a, i) => (
        <button
          key={i}
          className={`db-alert-row ${a.level}`}
          onClick={() => onNavigate(a.route)}
        >
          {/* Animated indicator dot */}
          <PulseDot level={a.level} />

          <span style={{ fontSize: 14, flexShrink: 0 }} aria-hidden="true">{a.icon}</span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--c-t1)',
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {a.text}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: a.level === 'danger' ? 'var(--c-red-text)' : 'var(--c-amber-text)',
            }}>
              {a.meta}
            </span>
            <span style={{ fontSize: 12, color: 'var(--c-t4)' }} aria-hidden="true">→</span>
          </div>
        </button>
      ))}
    </div>
  );
});

function PulseDot({ level }) {
  const color = level === 'danger' ? 'var(--c-red)' : 'var(--c-amber)';
  return (
    <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        background: color,
        animation: 'db-ping 2s ease-out infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        background: color,
      }} />
    </div>
  );
}
