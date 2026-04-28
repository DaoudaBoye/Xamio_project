import { memo } from 'react';

export const GreetingHeader = memo(function GreetingHeader({ greeting, canCreate, onCreate }) {
  return (
    <div
      className="db-fade-in"
      style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}
    >
      <div>
        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-.045em',
          color: 'var(--c-t1)',
          lineHeight: 1.2,
          marginBottom: 4,
        }}>
          {greeting.salut}{greeting.firstName ? `, ${greeting.firstName}` : ''} 👋
        </h1>
        <p style={{ fontSize: 12, color: 'var(--c-t3)', textTransform: 'capitalize', letterSpacing: '.01em' }}>
          {greeting.dateStr}
        </p>
      </div>

      {canCreate && (
        <button className="db-btn-primary" onClick={onCreate}>
          + Nouvelle réunion
        </button>
      )}
    </div>
  );
});
