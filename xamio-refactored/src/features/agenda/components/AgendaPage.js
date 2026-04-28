import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader, Button, Modal, Input } from '../../../components/ui/index';
import { useNotif } from '../../../context/NotifContext';
import { meetings, appointments } from '../../../data/mockData';

/* ─────────────────────────────────────────────────────────
   IDENTITÉ XAMIO
   ───────────────────────────────────────────────────────── */
const XAMIO_ORANGE        = '#E8400C';
const XAMIO_BLUE          = '#0078FF';
const XAMIO_ORANGE_BG     = 'rgba(232,64,12,.08)';
const XAMIO_ORANGE_BORDER = 'rgba(232,64,12,.2)';
const XAMIO_BLUE_BG       = 'rgba(0,120,255,.08)';
const XAMIO_BLUE_BORDER   = 'rgba(0,120,255,.18)';

/* ─────────────────────────────────────────────────────────
   CONSTANTES
   ───────────────────────────────────────────────────────── */
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

const EVENT_COLORS = {
  meeting:     { fg: XAMIO_BLUE,   bg: XAMIO_BLUE_BG,          border: XAMIO_BLUE_BORDER         },
  appointment: { fg: XAMIO_ORANGE, bg: XAMIO_ORANGE_BG,        border: XAMIO_ORANGE_BORDER       },
  event:       { fg: '#7C3AED',    bg: 'rgba(124,58,237,.08)',  border: 'rgba(124,58,237,.2)'     },
  task:        { fg: '#059669',    bg: 'rgba(5,150,105,.08)',   border: 'rgba(5,150,105,.2)'      },
};

const EVENT_LABELS = {
  meeting: 'Réunion', appointment: 'Rendez-vous', event: 'Événement', task: 'Tâche',
};

const TYPE_PILLS = [
  { type: 'meeting',     label: 'Réunion',   color: XAMIO_BLUE,   bg: XAMIO_BLUE_BG,          border: XAMIO_BLUE_BORDER         },
  { type: 'appointment', label: 'RDV',       color: XAMIO_ORANGE, bg: XAMIO_ORANGE_BG,        border: XAMIO_ORANGE_BORDER       },
  { type: 'event',       label: 'Événement', color: '#7C3AED',    bg: 'rgba(124,58,237,.08)',  border: 'rgba(124,58,237,.2)'     },
  { type: 'task',        label: 'Tâche',     color: '#059669',    bg: 'rgba(5,150,105,.08)',   border: 'rgba(5,150,105,.2)'      },
];

const FORM_DEFAULT = { title: '', date: '', time: '', type: 'meeting' };

/* ─────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────── */
const pad = n => String(n).padStart(2, '0');
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

function getDaysInMonth(y, m)     { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y, m) {
  const d = new Date(y, m, 1).getDay();
  return d === 0 ? 6 : d - 1; // Lun = 0
}

/* Construit la liste d'événements — une seule date par événement */
const ALL_EVENTS = (() => {
  const evs = [];
  meetings.forEach(m => {
    const parts = m.date.split('-').map(Number);
    evs.push({
      id:    `m-${m.id}`,
      type:  'meeting',
      title: m.title,
      date:  m.date,
      time:  m.time,
      y:     parts[0],
      mo:    parts[1] - 1,
      d:     parts[2],
    });
  });
  appointments.forEach(a => {
    const parts = a.date.split('-').map(Number);
    evs.push({
      id:    `a-${a.id}`,
      type:  'appointment',
      title: a.title,
      date:  a.date,
      time:  a.time,
      y:     parts[0],
      mo:    parts[1] - 1,
      d:     parts[2],
    });
  });
  return evs;
})();

/* ─────────────────────────────────────────────────────────
   SOUS-COMPOSANTS
   ───────────────────────────────────────────────────────── */
function NavBtn({ onClick, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:  hov ? XAMIO_ORANGE_BG : 'var(--color-background-tertiary)',
        border:      `1px solid ${hov ? XAMIO_ORANGE_BORDER : 'var(--color-border)'}`,
        borderRadius: 7, width: 30, height: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        color:      hov ? XAMIO_ORANGE : 'var(--color-text-muted)',
        transition: 'all .15s',
      }}
    >
      {children}
    </button>
  );
}

function EventPill({ ev }) {
  const c = EVENT_COLORS[ev.type] || EVENT_COLORS.meeting;
  return (
    <div style={{
      background:   c.bg,
      borderLeft:   `2px solid ${c.fg}`,
      borderRadius: '0 3px 3px 0',
      padding:      '1px 5px',
      fontSize: 9, color: c.fg, fontWeight: 500,
      fontFamily: 'var(--font-sans)',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      letterSpacing: '.02em',
      flexShrink: 0,           /* ← empêche l'étirement */
      minWidth: 0,
    }}>
      {ev.time} {ev.title}
    </div>
  );
}

function DayCell({ day, index, events, today, selected, onSelect }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        minHeight:   80,
        padding:     '6px 7px',
        borderRight: index % 7 !== 6 ? '1px solid var(--color-border)' : 'none',
        borderBottom: '1px solid var(--color-border)',
        cursor:      'pointer',
        background:  selected
          ? XAMIO_ORANGE_BG
          : hov ? 'var(--color-background-tertiary)' : 'transparent',
        transition:  'background .12s',
        /* ← contenu ne déborde jamais vers la cellule suivante */
        overflow:    'hidden',
        boxSizing:   'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11,
          fontWeight: today ? 700 : 400,
          background:  today ? XAMIO_ORANGE : 'transparent',
          color:       today ? '#fff' : selected ? XAMIO_ORANGE : 'var(--color-text-secondary)',
          fontFamily:  'var(--mono)',
          boxShadow:   today ? `0 2px 8px ${XAMIO_ORANGE_BORDER}` : 'none',
          flexShrink: 0,
        }}>
          {day}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
        {events.map(ev => <EventPill key={ev.id} ev={ev} />)}
      </div>
    </div>
  );
}

function EventCard({ ev, onClick }) {
  const c = EVENT_COLORS[ev.type] || EVENT_COLORS.meeting;
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding:    '10px 12px',
        background: hov ? c.border : c.bg,
        border:     `1px solid ${c.border}`,
        borderLeft: `3px solid ${c.fg}`,
        borderRadius: 9, marginBottom: 8,
        cursor:     onClick ? 'pointer' : 'default',
        transition: 'background .12s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
          {ev.title}
        </p>
        <span style={{
          fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
          background: c.bg, color: c.fg,
          border: `1px solid ${c.border}`,
          letterSpacing: '.04em', textTransform: 'uppercase',
          flexShrink: 0, marginLeft: 8,
        }}>
          {EVENT_LABELS[ev.type]}
        </span>
      </div>
      <p style={{ fontSize: 11, color: c.fg, fontFamily: 'var(--mono)', fontWeight: 500 }}>{ev.time}</p>
    </div>
  );
}

function RightSection({ title, accent, children }) {
  return (
    <div style={{
      background:   'var(--color-background-secondary)',
      border:       '1px solid var(--color-border)',
      borderRadius: 12, padding: '14px 16px',
    }}>
      <p style={{
        fontSize: 10,
        color:    accent ? XAMIO_ORANGE : 'var(--color-text-muted)',
        letterSpacing: '.1em', fontWeight: 700,
        marginBottom: 12, fontFamily: 'var(--font-sans)',
        textTransform: 'uppercase',
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE PRINCIPALE
   ───────────────────────────────────────────────────────── */
export default function AgendaPage() {
  const navigate     = useNavigate();
  const { addToast } = useNotif();

  const now = new Date();
  const [year,     setYear]     = useState(now.getFullYear());
  const [month,    setMonth]    = useState(now.getMonth());
  const [selected, setSelected] = useState(null);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(FORM_DEFAULT);

  const prevMonth = useCallback(() => {
    setSelected(null);
    setMonth(m => { if (m === 0)  { setYear(y => y - 1); return 11; } return m - 1; });
  }, []);

  const nextMonth = useCallback(() => {
    setSelected(null);
    setMonth(m => { if (m === 11) { setYear(y => y + 1); return 0;  } return m + 1; });
  }, []);

  /* Événements du mois — filtre strict sur année ET mois */
  const monthEvents = useMemo(
    () => ALL_EVENTS.filter(e => e.y === year && e.mo === month),
    [year, month]
  );

  /* Événements du jour sélectionné — filtre strict sur la date exacte */
  const dayEvents = useMemo(
    () => selected ? ALL_EVENTS.filter(e => e.date === selected) : [],
    [selected]
  );

  /* Lookup par date — chaque événement sur SA date uniquement, max 3 par cellule */
  const eventsByDate = useMemo(() => {
    const map = {};
    monthEvents.forEach(e => {
      const key = e.date; // YYYY-MM-DD exact, pas de calcul de plage
      if (!map[key]) map[key] = [];
      if (map[key].length < 3) map[key].push(e);
    });
    return map;
  }, [monthEvents]);

  /* Cellules de la grille */
  const cells = useMemo(() => {
    const daysInMonth  = getDaysInMonth(year, month);
    const firstDaySlot = getFirstDayOfMonth(year, month);
    const arr = [
      ...Array(firstDaySlot).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month]);

  const handleCreate = useCallback(() => {
    if (!form.title || !form.date) { addToast('Titre et date requis.', 'error'); return; }
    addToast("Événement ajouté à l'agenda !", 'success');
    setModal(false);
    setForm(FORM_DEFAULT);
  }, [form, addToast]);

  const updateForm = useCallback((key, val) => setForm(f => ({ ...f, [key]: val })), []);

  const monthSummary = useMemo(() => [
    { label: 'Réunions',    count: monthEvents.filter(e => e.type === 'meeting').length,     color: XAMIO_BLUE   },
    { label: 'Rendez-vous', count: monthEvents.filter(e => e.type === 'appointment').length, color: XAMIO_ORANGE },
  ], [monthEvents]);

  return (
    <div className="animate-enter">
      <SectionHeader
        title="Agenda"
        subtitle={`${MONTHS[month]} ${year}`}
        action="Ajouter"
        onAction={() => setModal(true)}
      />

      <div className="resp-agenda-grid">

        {/* ══ GRILLE CALENDRIER ══ */}
        <div style={{
          background:   'var(--color-background-secondary)',
          border:       '1px solid var(--color-border)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          {/* Navigation mois */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
          }}>
            <NavBtn onClick={prevMonth}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <polyline points="8,2 4,6 8,10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </NavBtn>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: XAMIO_ORANGE }} />
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-.02em' }}>
                {MONTHS[month]} {year}
              </h3>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: XAMIO_BLUE }} />
            </div>
            <NavBtn onClick={nextMonth}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <polyline points="4,2 8,6 4,10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </NavBtn>
          </div>

          {/* En-têtes jours */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7,1fr)',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-background)',
          }}>
            {DAYS.map((d, i) => (
              <div key={d} style={{
                padding: '8px 0', textAlign: 'center',
                fontSize: 10, fontWeight: 700,
                color: i >= 5 ? XAMIO_ORANGE : 'var(--color-text-muted)',
                letterSpacing: '.07em', fontFamily: 'var(--font-sans)',
              }}>{d}</div>
            ))}
          </div>

          {/* Cellules — chaque cellule isole son contenu avec overflow:hidden */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {cells.map((day, i) => {
              if (!day) {
                return (
                  <div key={`e-${i}`} style={{
                    minHeight:   80,
                    borderRight: i % 7 !== 6 ? '1px solid var(--color-border)' : 'none',
                    borderBottom: '1px solid var(--color-border)',
                    background:  'var(--color-background)',
                    overflow:    'hidden',
                  }} />
                );
              }

              const key  = toKey(year, month, day);
              const evs  = eventsByDate[key] || [];
              const isTd = year === now.getFullYear() && month === now.getMonth() && day === now.getDate();

              return (
                <DayCell
                  key={`d-${day}-${key}`}
                  day={day}
                  index={i}
                  events={evs}
                  today={isTd}
                  selected={selected === key}
                  onSelect={() => setSelected(prev => prev === key ? null : key)}
                />
              );
            })}
          </div>
        </div>

        {/* ══ PANNEAU DROIT ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Légende */}
          <RightSection title="Légende">
            {Object.entries(EVENT_COLORS).map(([type, c]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: 3,
                  background: c.fg, flexShrink: 0,
                  boxShadow: `0 0 0 2px ${c.border}`,
                }}/>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
                  {EVENT_LABELS[type]}
                </span>
              </div>
            ))}
          </RightSection>

          {/* Détail du jour sélectionné */}
          <RightSection
            title={selected ? selected.split('-').reverse().join('/') : 'Sélectionner un jour'}
            accent={!!selected}
          >
            {!selected && (
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
                Cliquez sur un jour pour voir ses événements.
              </p>
            )}
            {selected && dayEvents.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
                Aucun événement ce jour.
              </p>
            )}
            {dayEvents.map(ev => (
              <EventCard
                key={ev.id}
                ev={ev}
                onClick={ev.type === 'meeting' ? () => navigate(`/meetings/${ev.id.split('-')[1]}`) : null}
              />
            ))}
          </RightSection>

          {/* Résumé du mois */}
          <RightSection title="Ce mois">
            {monthSummary.map(({ label, count, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</span>
                </div>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
                  color: count > 0 ? color : 'var(--color-text-muted)',
                }}>{count}</span>
              </div>
            ))}
          </RightSection>

        </div>
      </div>

      {/* ── Modal création ── */}
      <Modal open={modal} onClose={() => setModal(false)} title="Ajouter à l'agenda">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Titre *"
            value={form.title}
            onChange={e => updateForm('title', e.target.value)}
            placeholder="Titre de l'événement"
          />
          <div className="resp-form-2col">
            <Input label="Date *" type="date" value={form.date} onChange={e => updateForm('date', e.target.value)}/>
            <Input label="Heure"  type="time" value={form.time} onChange={e => updateForm('time', e.target.value)}/>
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Type
            </label>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {TYPE_PILLS.map(({ type, label, color, bg, border }) => {
                const active = form.type === type;
                return (
                  <button
                    key={type}
                    onClick={() => updateForm('type', type)}
                    style={{
                      padding: '5px 13px', borderRadius: 20, fontSize: 11,
                      cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: active ? 600 : 400,
                      border:     `1px solid ${active ? border : 'var(--color-border)'}`,
                      background: active ? bg : 'transparent',
                      color:      active ? color : 'var(--color-text-muted)',
                      transition: 'all .12s',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
            <Button variant="ghost"   onClick={() => setModal(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleCreate}>Ajouter</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}