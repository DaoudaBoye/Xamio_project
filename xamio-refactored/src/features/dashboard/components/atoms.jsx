import { memo } from 'react';
import { MONTHS_FR } from './dashboard.utils';

/* ═══════════════════════════════════════
   atoms.jsx — Composants de base du dashboard
   Chaque composant = une seule responsabilité
═══════════════════════════════════════ */

/* ── Status config ── */
const STATUS_MAP = {
  planifiee: { bg: 'var(--c-blue-bg)',   border: 'var(--c-blue-border)',   text: 'var(--c-blue-text)',   dot: 'var(--c-blue)',   label: 'Planifiée',  pulse: false },
  en_cours:  { bg: 'var(--c-amber-bg)',  border: 'var(--c-amber-border)',  text: 'var(--c-amber-text)',  dot: 'var(--c-amber)',  label: 'En cours',   pulse: true  },
  terminee:  { bg: 'var(--c-green-bg)',  border: 'var(--c-green-border)',  text: 'var(--c-green-text)',  dot: 'var(--c-green)',  label: 'Terminée',   pulse: false },
  annulee:   { bg: 'var(--c-gray-bg)',   border: 'var(--c-gray-border)',   text: 'var(--c-gray-text)',   dot: 'var(--c-gray)',   label: 'Annulée',    pulse: false },
  confirme:  { bg: 'var(--c-green-bg)',  border: 'var(--c-green-border)',  text: 'var(--c-green-text)',  dot: 'var(--c-green)',  label: 'Confirmé',   pulse: false },
  planifie:  { bg: 'var(--c-amber-bg)',  border: 'var(--c-amber-border)',  text: 'var(--c-amber-text)',  dot: 'var(--c-amber)',  label: 'En attente', pulse: false },
};

export const StatusBadge = memo(function StatusBadge({ status }) {
  const s = STATUS_MAP[status];
  if (!s) return null;
  return (
    <span
      className="db-badge"
      style={{ background: s.bg, borderColor: s.border, color: s.text }}
    >
      <span
        className={`dot${s.pulse ? ' pulse' : ''}`}
        style={{ background: s.dot }}
      />
      {s.label}
    </span>
  );
});

/* ── Section header ── */
export const SectionHeader = memo(function SectionHeader({ label, action, onAction }) {
  return (
    <div className="db-sh">
      <span className="db-sh-label">{label}</span>
      {action && (
        <button className="db-sh-action" onClick={onAction}>{action}</button>
      )}
    </div>
  );
});

/* ── Card shell ── */
export const Card = memo(function Card({ children, style }) {
  return (
    <div className="db-card" style={style}>
      {children}
    </div>
  );
});

/* ── Progress bar ── */
export const ProgressBar = memo(function ProgressBar({ pct }) {
  const color =
    pct >= 75 ? 'var(--c-green)' :
    pct >= 40 ? 'var(--c-brand)' :
    'var(--c-amber)';
  return (
    <div className="db-progress-track">
      <div
        className="db-progress-fill"
        style={{ width: `${pct}%`, background: color }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
});

/* ── Empty state ── */
export const EmptyState = memo(function EmptyState({ icon, title, description, ctaLabel, onCta }) {
  return (
    <div className="db-empty">
      <div className="db-empty-icon" aria-hidden="true">{icon}</div>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-t1)', margin: 0 }}>{title}</p>
      <p style={{ fontSize: 11.5, color: 'var(--c-t3)', lineHeight: 1.6, maxWidth: 210, margin: 0 }}>
        {description}
      </p>
      {ctaLabel && onCta && (
        <button className="db-btn-primary" onClick={onCta} style={{ marginTop: 8, height: 32, fontSize: 12 }}>
          {ctaLabel}
        </button>
      )}
    </div>
  );
});

/* ── KPI Trend chip ── */
export const TrendChip = memo(function TrendChip({ delta, unit = '', label }) {
  const dir = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const icons = { up: '↑', down: '↓', flat: '→' };
  return (
    <span className={`db-kpi-trend ${dir}`}>
      {icons[dir]} {Math.abs(delta)}{unit}
      {label && <span style={{ fontWeight: 400, marginLeft: 3, opacity: .75 }}>{label}</span>}
    </span>
  );
});

/* ── Meeting date block ── */
export const MeetingDateBlock = memo(function MeetingDateBlock({ dateStr, isToday: today }) {
  const dt = new Date(`${(dateStr || '').split('T')[0]}T00:00:00`);
  const day = isNaN(dt.getDate()) ? '—' : dt.getDate();
  const mon = isNaN(dt.getMonth()) ? '' : MONTHS_FR[dt.getMonth()];
  return (
    <div className={`db-meeting-date${today ? ' today' : ''}`}>
      <div className={`db-meeting-day${today ? ' today' : ''}`}>{day}</div>
      <div className={`db-meeting-month${today ? ' today' : ''}`}>{mon}</div>
    </div>
  );
});

/* ── Imminent badge ── */
export const ImminentBadge = memo(function ImminentBadge({ mins }) {
  const label = mins === 0 ? 'Imminent' : `Dans ${mins}min`;
  return (
    <span className="db-badge" style={{
      background: 'var(--c-amber-bg)',
      borderColor: 'var(--c-amber-border)',
      color: 'var(--c-amber-text)',
    }}>
      <span className="dot pulse" style={{ background: 'var(--c-amber)' }} />
      {label}
    </span>
  );
});
