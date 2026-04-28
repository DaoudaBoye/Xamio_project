import React from 'react';
import ReactDOM from 'react-dom';
import { Modal } from '../../../components/ui/index';

/* ─── Tokens ──────────────────────────────────────────────────── */
const T = {
  bg1: 'var(--color-background-secondary)',
  bg2: 'var(--color-background-tertiary)',
  bg3: 'var(--color-background-elevated)',
  bd0: 'var(--color-border)',
  bd1: 'var(--color-border-medium)',
  bd2: 'var(--color-border-strong)',
  t1:  'var(--color-text-primary)',
  t2:  'var(--color-text-secondary)',
  t3:  'var(--color-text-muted)',

  acc:  '#E8500A',
  acc2: '#C94108',
  accm: 'rgba(232, 80, 10, 0.08)',
  accb: 'rgba(232, 80, 10, 0.22)',

  r6:  'var(--radius-medium)',
  r8:  'var(--radius-large)',
  r10: '10px',
  r12: 'var(--radius-xlarge)',
  r16: '16px',
  r20: '20px',
  sdrop: 'var(--shadow-dropdown)',
};

/* ─── Constants ───────────────────────────────────────────────── */
const TYPE_META = {
  demo:        { label: 'Démo',           color: 'accent'  },
  partnership: { label: 'Partenariat',    color: 'purple'  },
  investment:  { label: 'Investissement', color: 'warning' },
  commercial:  { label: 'Commercial',     color: 'success' },
  hr:          { label: 'RH',             color: 'danger'  },
};

const TYPE_BLOCK = {
  accent:  { bg: 'var(--color-accent-bg)',  border: 'var(--color-accent-border)',  fg: 'var(--color-accent)'  },
  purple:  { bg: 'var(--color-purple-bg)',  border: 'var(--color-purple-border)',  fg: 'var(--color-purple)'  },
  warning: { bg: 'var(--color-warning-bg)', border: 'var(--color-warning-border)', fg: 'var(--color-warning)' },
  success: { bg: 'var(--color-success-bg)', border: 'var(--color-success-border)', fg: 'var(--color-success)' },
  danger:  { bg: 'var(--color-danger-bg)',  border: 'var(--color-danger-border)',  fg: 'var(--color-danger)'  },
};

const STATUS_CFG = {
  confirmed: { label: 'Confirmé',   fg: 'var(--color-success)', bg: 'var(--color-success-bg)', dot: 'var(--color-success)', border: 'var(--color-success-border)' },
  pending:   { label: 'En attente', fg: 'var(--color-warning)', bg: 'var(--color-warning-bg)', dot: 'var(--color-warning)', border: 'var(--color-warning-border)' },
  cancelled: { label: 'Annulé',     fg: 'var(--color-danger)',  bg: 'var(--color-danger-bg)',  dot: 'var(--color-danger)',  border: 'var(--color-danger-border)'  },
};

/* ─── Helpers ─────────────────────────────────────────────────── */
function formatDateLong(s) {
  if (!s) return null;
  return new Date(s + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTimeRange(time, duration) {
  if (!time) return null;
  if (!duration) return time;
  const [h, m] = time.split(':').map(Number);
  const totalMin = h * 60 + m + Number(duration);
  const endH = String(Math.floor(totalMin / 60) % 24).padStart(2, '0');
  const endM = String(totalMin % 60).padStart(2, '0');
  return `${time} → ${endH}:${endM}`;
}

function formatDuration(duration) {
  if (!duration) return null;
  const d = Number(duration);
  if (d < 60) return `${d} min`;
  const h = Math.floor(d / 60);
  const m = d % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

function rappelLabel(r) {
  return r < 60 ? `${r}min` : r < 1440 ? `${r / 60}h` : `${r / 1440}j`;
}

function getInitials(nom, societe) {
  const src = nom || societe || '?';
  return src.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}

function formatContactLabel(a) {
  if (a.contactSociete && a.contactType === 'entreprise') return a.contactSociete;
  if (a.contactNom) return a.contactNom;
  if (a.with)       return a.with;
  return null;
}

function isUrl(str) {
  return /^https?:\/\//i.test(str);
}

/* ─── Micro-hook ──────────────────────────────────────────────── */
function useHover() {
  const [h, set] = React.useState(false);
  return [h, { onMouseEnter: () => set(true), onMouseLeave: () => set(false) }];
}

/* ─── SVG Icons ───────────────────────────────────────────────── */
const Ic = {
  clk:       () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  loc:       () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a4.5 4.5 0 014.5 4.5c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 018 1.5z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  cal:       () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  building:  () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.4"/><path d="M5 14V9h6v5M5 6h1M10 6h1M5 9h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  bell:      () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5A4.5 4.5 0 003.5 6v3.5L2 11h12l-1.5-1.5V6A4.5 4.5 0 008 1.5z" stroke="currentColor" strokeWidth="1.4"/><path d="M6.5 13a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  tag:       () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 2h6l6 6-6 6-6-6V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="5.5" cy="5.5" r="1" fill="currentColor"/></svg>,
  mail:      () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2 5l6 5 6-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  phone:     () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5-1.5 1a8 8 0 004 4l1-1.5L14 10.5V14a1 1 0 01-1 1C6.27 15 1 9.73 1 3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  lightning: () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M9 1L3 9h5l-1 6 6-8H8l1-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  warn:      () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2L14.5 13H1.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  check:     () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trash:     () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M5 5l.5 8h5L11 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  link:      () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5a3.54 3.54 0 005 0l2-2a3.54 3.54 0 00-5-5L7 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M9.5 6.5a3.54 3.54 0 00-5 0l-2 2a3.54 3.54 0 005 5L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  maps:      () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M13 7A5 5 0 113 7c0 3.5 5 8 5 8s5-4.5 5-8z" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  duration:  () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 3v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/></svg>,
  copy:      () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M3 11V3a1 1 0 011-1h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
};

/* ─── Atoms ───────────────────────────────────────────────────── */
function StatusPill({ statusKey }) {
  const c = STATUS_CFG[statusKey] || STATUS_CFG.pending;
  const live = statusKey === 'pending';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: T.r20,
      background: c.bg, fontSize: 11, fontWeight: 600, color: c.fg,
      border: `1px solid ${c.border}`, whiteSpace: 'nowrap', letterSpacing: '.02em',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0,
        animation: live ? 'xm-blink 1.8s ease infinite' : 'none',
      }} />
      {c.label}
    </span>
  );
}

function TypeBlock({ type }) {
  const m = TYPE_META[type] || TYPE_META.demo;
  const s = TYPE_BLOCK[m.color] || TYPE_BLOCK.accent;
  return (
    <div style={{
      width: 44, height: 44, flexShrink: 0,
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: T.r10,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
    }}>
      <span style={{ color: s.fg, lineHeight: 0 }}><Ic.tag /></span>
      <span style={{ fontSize: 9, fontWeight: 700, color: s.fg, letterSpacing: '.04em', textTransform: 'uppercase' }}>
        {m.label.slice(0, 4)}
      </span>
    </div>
  );
}

function GhostBtn({ children, onClick }) {
  const [h, hp] = useHover();
  return (
    <button type="button" onClick={onClick} {...hp} style={{
      padding: '8px 16px', borderRadius: T.r8,
      border: `1px solid ${T.bd1}`,
      background: h ? T.bg2 : 'transparent',
      fontSize: 13, fontWeight: 450,
      color: h ? T.t1 : T.t2, cursor: 'pointer',
      fontFamily: 'var(--font-sans)', transition: 'all .15s', whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>{children}</button>
  );
}

function DangerBtn({ children, onClick }) {
  const [h, hp] = useHover();
  return (
    <button type="button" onClick={onClick} {...hp} style={{
      padding: '8px 16px', borderRadius: T.r8,
      border: `1px solid ${h ? 'var(--color-danger)' : T.bd1}`,
      background: h ? 'var(--color-danger-bg)' : 'transparent',
      fontSize: 13, fontWeight: 450,
      color: 'var(--color-danger)', cursor: 'pointer',
      fontFamily: 'var(--font-sans)', transition: 'all .15s', whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>{children}</button>
  );
}

function AccentBtn({ children, onClick }) {
  const [h, hp] = useHover();
  return (
    <button type="button" onClick={onClick} {...hp} style={{
      padding: '8px 16px', borderRadius: T.r8, border: 'none',
      background: h ? T.acc2 : T.acc,
      fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
      fontFamily: 'var(--font-sans)', transition: 'all .15s', whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      boxShadow: h ? `0 4px 20px ${T.acc}55` : `0 2px 8px ${T.acc}33`,
      transform: h ? 'translateY(-1px)' : 'none',
    }}>{children}</button>
  );
}

/* ─── Section title ───────────────────────────────────────────── */
function SectionTitle({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 10px' }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, background: T.acc, flexShrink: 0 }} />
      <p style={{
        fontSize: 11, fontWeight: 700, color: T.t2,
        textTransform: 'uppercase', letterSpacing: '.08em',
        margin: 0, fontFamily: 'var(--font-sans)',
      }}>{children}</p>
    </div>
  );
}

/* ─── CopyableValue ───────────────────────────────────────────── */
function CopyableValue({ value, children }) {
  const [copied, setCopied] = React.useState(false);
  const [h, hp] = useHover();

  function handleCopy(e) {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <span
      {...hp}
      onClick={handleCopy}
      title="Copier"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        cursor: 'pointer', borderRadius: 4,
        padding: '1px 4px', margin: '-1px -4px',
        background: h ? T.bg2 : 'transparent',
        transition: 'background .12s',
      }}
    >
      {children}
      <span style={{
        color: copied ? 'var(--color-success)' : T.t3,
        lineHeight: 0,
        opacity: h || copied ? 1 : 0,
        transition: 'opacity .12s',
      }}>
        {copied ? <Ic.check /> : <Ic.copy />}
      </span>
    </span>
  );
}

/* ─── LocationPill ────────────────────────────────────────────── */
function LocationPill({ location }) {
  const [h, hp] = useHover();
  if (!location) return <span style={{ color: T.t3, fontSize: 13 }}>—</span>;

  const pillStyle = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '4px 10px', borderRadius: T.r20,
    background: h ? T.accm : T.bg2,
    border: `1px solid ${h ? T.accb : T.bd0}`,
    fontSize: 12, fontWeight: 500, color: h ? T.acc : T.t2,
    textDecoration: 'none', transition: 'all .15s', cursor: 'pointer',
    maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  };

  if (isUrl(location)) {
    return (
      <a href={location} target="_blank" rel="noopener noreferrer" {...hp} style={pillStyle}>
        <Ic.link /> {location.replace(/^https?:\/\//, '').split('/')[0]}
        <span style={{ fontSize: 10, opacity: .6 }}>↗</span>
      </a>
    );
  }

  return (
    <a
      href={`https://maps.google.com/?q=${encodeURIComponent(location)}`}
      target="_blank" rel="noopener noreferrer"
      {...hp} style={pillStyle}
    >
      <Ic.maps /> {location}
      <span style={{ fontSize: 10, opacity: .6 }}>↗</span>
    </a>
  );
}

/* ─── PlanningCard ────────────────────────────────────────────── */
function PlanningCard({ appt }) {
  const timeRange  = formatTimeRange(appt.time, appt.duration);
  const duration   = formatDuration(appt.duration);
  const dateLong   = formatDateLong(appt.date);
  const hasRappels = appt.rappels?.length > 0;
  const hasLieu    = !!appt.location;

  return (
    <div style={{
      background: T.bg1, borderRadius: T.r10,
      border: `1px solid ${T.bd0}`, overflow: 'hidden',
    }}>

      {/* ── Ligne 1 : Date | Heure ── */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        borderBottom: (hasLieu || hasRappels) ? `1px solid ${T.bd0}` : 'none',
      }}>
        {/* Date */}
        <div style={{
          flex: 1, padding: '12px 14px',
          borderRight: `1px solid ${T.bd0}`,
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 5,
            color: T.t3, fontSize: 10.5, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '.07em',
          }}>
            <Ic.cal /> Date
          </span>
          {dateLong
            ? <CopyableValue value={dateLong}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.t1, lineHeight: 1.4 }}>
                  {dateLong}
                </span>
              </CopyableValue>
            : <span style={{ fontSize: 13, color: T.t3 }}>—</span>
          }
        </div>

        {/* Heure */}
        <div style={{
          padding: '12px 14px', minWidth: 145,
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 5,
            color: T.t3, fontSize: 10.5, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '.07em',
          }}>
            <Ic.clk /> Heure
          </span>
          {appt.time ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <CopyableValue value={timeRange || appt.time}>
                <span style={{
                  fontSize: 14, fontWeight: 700, color: T.t1,
                  fontFamily: 'var(--font-mono, monospace)', letterSpacing: '.03em',
                }}>
                  {timeRange || appt.time}
                </span>
              </CopyableValue>
              {duration && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, color: T.t3, fontWeight: 500,
                }}>
                  <Ic.duration /> {duration}
                </span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: T.t3 }}>—</span>
          )}
        </div>
      </div>

      {/* ── Ligne 2 : Lieu ── */}
      {hasLieu && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          borderBottom: hasRappels ? `1px solid ${T.bd0}` : 'none',
        }}>
          <span style={{ color: T.t3, lineHeight: 0, flexShrink: 0 }}><Ic.loc /></span>
          <span style={{
            fontSize: 10.5, color: T.t3, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '.07em',
            flexShrink: 0, minWidth: 28,
          }}>Lieu</span>
          <LocationPill location={appt.location} />
        </div>
      )}

      {/* ── Ligne 3 : Rappels ── */}
      {hasRappels && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
        }}>
          <span style={{ color: T.t3, lineHeight: 0, flexShrink: 0 }}><Ic.bell /></span>
          <span style={{
            fontSize: 10.5, color: T.t3, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '.07em',
            flexShrink: 0, minWidth: 28,
          }}>Rappel</span>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {[...appt.rappels].sort((a, b) => a - b).map((r, i) => (
              <span key={i} style={{
                padding: '2px 9px', borderRadius: T.r20,
                background: T.accm, border: `1px solid ${T.accb}`,
                fontSize: 11, fontWeight: 600, color: T.acc,
              }}>{rappelLabel(r)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Participant chip ────────────────────────────────────────── */
const AVATAR_COLORS = [
  { bg: 'var(--color-accent-bg)',   fg: 'var(--color-accent)'   },
  { bg: 'var(--color-success-bg)',  fg: 'var(--color-success)'  },
  { bg: 'var(--color-purple-bg)',   fg: 'var(--color-purple)'   },
  { bg: 'var(--color-warning-bg)',  fg: 'var(--color-warning)'  },
];

function ParticipantChip({ participant, index }) {
  const col = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const u = participant.user;
  const c = participant.contactExterne;

  const name = (u ? [u.util_prenom, u.util_nom].filter(Boolean).join(' ') : null)
    || c?.contact_nom || u?.email || c?.contact_email || '?';
  const sub = u ? u.email : c?.contact_email;
  const initials = name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('');

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px', borderRadius: T.r10,
      background: T.bg1, border: `1px solid ${T.bd0}`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: col.bg, color: col.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, letterSpacing: '.03em',
        border: `1.5px solid ${col.fg}22`,
      }}>{initials}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 550, color: T.t1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
        }}>{name}</p>
        {sub && (
          <p style={{
            margin: '2px 0 0', fontSize: 11, color: T.t3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
          }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ═══════════════════════════════════════════════════════════════ */
export default function AppointmentDetailModal({ open, onClose, appt, onConfirm, onCancel }) {
  if (!open || !appt) return null;

  const typeMeta        = TYPE_META[appt.type]  || TYPE_META.demo;
  const typeStyle       = TYPE_BLOCK[typeMeta.color] || TYPE_BLOCK.accent;
  const cancelled       = appt.status === 'cancelled';
  const contact         = formatContactLabel(appt);
  const initials        = getInitials(appt.contactNom, appt.contactSociete);
  const hasParticipants = appt.participants?.length > 0;

  return ReactDOM.createPortal(
    <Modal open={open} onClose={onClose} title="Détail du rendez-vous" width={620}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, fontFamily: 'var(--font-sans)' }}>

        {/* ── En-tête ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 14,
          padding: '0 0 18px', borderBottom: `1px solid ${T.bd0}`, marginBottom: 18,
        }}>
          <TypeBlock type={appt.type} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              margin: '0 0 8px', fontSize: 16, fontWeight: 700,
              color: cancelled ? T.t3 : T.t1, letterSpacing: '-.3px',
              textDecoration: cancelled ? 'line-through' : 'none',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {appt.title || '—'}
            </h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <StatusPill statusKey={appt.status} />
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: T.r20,
                background: typeStyle.bg, border: `1px solid ${typeStyle.border}`,
                fontSize: 11, fontWeight: 500, color: typeStyle.fg,
              }}>
                <Ic.tag /> {typeMeta.label}
              </span>
              {appt.isNext && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: T.r20,
                  background: T.accm, border: `1px solid ${T.accb}`,
                  fontSize: 11, fontWeight: 600, color: T.acc,
                }}>
                  <Ic.lightning /> Prochain
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Alerte annulation ── */}
        {cancelled && appt.cancelReason && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 14px', borderRadius: T.r8, marginBottom: 16,
            background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)',
          }}>
            <span style={{ color: 'var(--color-danger)', lineHeight: 0, marginTop: 1 }}><Ic.warn /></span>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 600, color: 'var(--color-danger)' }}>Motif d'annulation</p>
              <p style={{ margin: 0, fontSize: 12, color: T.t2, lineHeight: 1.6 }}>{appt.cancelReason}</p>
            </div>
          </div>
        )}

        {/* ── Planification ── */}
        <div style={{ marginBottom: 18 }}>
          <SectionTitle>Planification</SectionTitle>
          <PlanningCard appt={appt} />
        </div>

        {/* ── Contact externe ── */}
        {contact && (
          <div style={{ marginBottom: 18 }}>
            <SectionTitle>Contact externe</SectionTitle>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: T.r10,
              background: T.bg1, border: `1px solid ${T.bd0}`,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: 'var(--color-accent-bg)', color: 'var(--color-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
              }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: T.t1 }}>
                  {appt.contactNom || appt.contactSociete || '—'}
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {appt.contactSociete && appt.contactType !== 'entreprise' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: T.t2 }}>
                      <Ic.building /> {appt.contactSociete}
                    </span>
                  )}
                  {appt.contactEmail && (
                    <CopyableValue value={appt.contactEmail}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: T.t2 }}>
                        <Ic.mail /> {appt.contactEmail}
                      </span>
                    </CopyableValue>
                  )}
                  {appt.contactTel && (
                    <CopyableValue value={appt.contactTel}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: T.t2 }}>
                        <Ic.phone /> {appt.contactTel}
                      </span>
                    </CopyableValue>
                  )}
                </div>
              </div>
              <span style={{
                padding: '2px 9px', borderRadius: T.r20, flexShrink: 0,
                background: T.bg3, border: `1px solid ${T.bd0}`,
                fontSize: 10, fontWeight: 500, color: T.t3, textTransform: 'capitalize',
              }}>
                {appt.contactType === 'entreprise' ? 'Entreprise' : 'Personne'}
              </span>
            </div>
          </div>
        )}

        {/* ── Participants internes ── */}
        {hasParticipants && (
          <div style={{ marginBottom: 18 }}>
            <SectionTitle>Participants internes ({appt.participants.length})</SectionTitle>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 6,
            }}>
              {appt.participants.map((p, i) => (
                <ParticipantChip key={i} participant={p} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Description ── */}
        {appt.description && (
          <div style={{ marginBottom: 18 }}>
            <SectionTitle>Description</SectionTitle>
            <div style={{
              padding: '12px 14px', borderRadius: T.r10,
              background: T.bg1, border: `1px solid ${T.bd0}`,
              fontSize: 13, color: T.t2, lineHeight: 1.7,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {appt.description}
            </div>
          </div>
        )}

        {/* ── Footer actions ── */}
        {!cancelled ? (
          <div style={{
            display: 'flex', gap: 8, justifyContent: 'flex-end',
            paddingTop: 16, borderTop: `1px solid ${T.bd0}`,
            flexWrap: 'wrap',
          }}>
            <DangerBtn onClick={() => { onClose(); onCancel(appt); }}>
              <Ic.trash /> Annuler le RDV
            </DangerBtn>
            {appt.status === 'pending' && (
              <AccentBtn onClick={() => { onClose(); onConfirm(appt.id); }}>
                <Ic.check /> Confirmer le RDV
              </AccentBtn>
            )}
            {appt.status === 'confirmed' && (
              <GhostBtn onClick={onClose}>Fermer</GhostBtn>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex', justifyContent: 'flex-end',
            paddingTop: 16, borderTop: `1px solid ${T.bd0}`,
          }}>
            <GhostBtn onClick={onClose}>Fermer</GhostBtn>
          </div>
        )}

      </div>
    </Modal>,
    document.body
  );
}