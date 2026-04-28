/**
 * DirecteurAgendaPage — Agenda privé du Directeur
 * Visible uniquement par les rôles : Directeur, Assistant
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader, Badge, Button, Modal, Input } from '../../../components/ui/index';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../context/AuthContext';
import VisibilitySelector from '../../../components/ui/VisibilitySelector';
import { usePermissions } from '../../../hooks/usePermissions';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

const EVENT_COLORS = {
  confidential: { fg: 'var(--color-purple)',          bg: 'var(--color-purple-bg)',          border: 'var(--color-purple-border)'          },
  strategic:    { fg: 'var(--color-warning)', bg: 'var(--color-warning-bg)',  border: 'var(--color-warning-border)' },
  personal:     { fg: 'var(--sage)',           bg: 'var(--sage-dim)',          border: 'var(--sage-border)'          },
  meeting:      { fg: 'var(--color-accent)',   bg: 'var(--color-accent-bg)',   border: 'var(--color-accent-border)'  },
};

// Données mock privées du directeur
const DIRECTEUR_EVENTS = [
  { id: 'd1', type: 'strategic',    title: 'CODIR mensuel',                    date: '2026-03-10', time: '09:00', note: 'Préparer les KPIs Q1' },
  { id: 'd2', type: 'confidential', title: 'Entretien annuel — Cheikh Diop',   date: '2026-03-12', time: '14:00', note: 'Confidentiel RH' },
  { id: 'd3', type: 'personal',     title: 'Déjeuner — Banque Atlantique',     date: '2026-03-13', time: '12:30', note: 'Partenariat financement' },
  { id: 'd4', type: 'strategic',    title: 'Présentation CA — Résultats Q1',   date: '2026-03-18', time: '10:00', note: 'Rapport financier à finaliser' },
  { id: 'd5', type: 'confidential', title: 'Négociation rachat Logitec SN',    date: '2026-03-20', time: '15:00', note: 'NDA signé — strictement confidentiel' },
  { id: 'd6', type: 'meeting',      title: 'Appel Investisseurs Paris',        date: '2026-03-24', time: '11:00', note: 'Série B — deck envoyé' },
  { id: 'd7', type: 'personal',     title: 'Médecin — Clinique du Plateau',   date: '2026-03-26', time: '08:30', note: 'Bilan annuel' },
  { id: 'd8', type: 'strategic',    title: 'Revue stratégique 2026–2028',      date: '2026-04-02', time: '09:00', note: 'Board strategy session' },
  { id: 'd9', type: 'confidential', title: 'Entretien candidat DGA',           date: '2026-04-07', time: '14:30', note: 'Recrutement direction générale adjointe' },
  { id: 'd10',type: 'meeting',      title: 'Summit Afrique Numérique — Lagos', date: '2026-04-15', time: '08:00', note: 'Keynote 30 min prévue' },
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  let d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export default function DirecteurAgendaPage() {
  const navigate = useNavigate();
  const { addToast } = useNotif();
  const { user } = useAuth();
  const now = new Date();

  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(null); // event to preview
  const [events, setEvents] = useState(DIRECTEUR_EVENTS);
  const [form, setForm] = useState({ title: '', date: '', time: '', type: 'strategic', note: '', visibility: 'direction' });

  // Sécurité côté client — redirection si pas autorisé
  const { voitAgendaDirecteur, isDirecteur, isAssistante, isAdmin } = usePermissions();  
  if (!voitAgendaDirecteur) {
    return (
      <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--color-danger)" strokeWidth="1.5"/><line x1="12" y1="8" x2="12" y2="12" stroke="var(--color-danger)" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="16" r="0.8" fill="var(--color-danger)"/></svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Accès restreint</p>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Cet agenda est réservé au Directeur et à son Assistant.</p>
        </div>
        <button onClick={() => navigate('/')} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background-tertiary)', cursor: 'pointer', fontSize: 13, color: 'var(--color-text-secondary)' }}>
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  const daysInMonth  = getDaysInMonth(year, month);
  const firstDaySlot = getFirstDayOfMonth(year, month);
  const monthEvents  = events.filter(e => {
    const [y, mo] = e.date.split('-').map(Number);
    return y === year && mo - 1 === month;
  });

  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); setSelected(null); }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0);  } else setMonth(m => m + 1); setSelected(null); }

  function eventsForDay(d) {
    const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    return monthEvents.filter(e => e.date === key).slice(0, 3);
  }

  function selectDay(d) {
    const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    setSelected(prev => prev === key ? null : key);
  }

  function isToday(d) {
    return year === now.getFullYear() && month === now.getMonth() && d === now.getDate();
  }

  const dayEvents = selected ? events.filter(e => e.date === selected) : [];

  const handleCreate = () => {
    if (!form.title || !form.date) { addToast('Titre et date requis.', 'error'); return; }
    const newEv = { id: `d-${Date.now()}`, ...form };
    setEvents(prev => [...prev, newEv]);
    addToast('Événement ajouté à l\'agenda du directeur.', 'success');
    setModal(false);
    setForm({ title: '', date: '', time: '', type: 'strategic', note: '', visibility: 'direction' });
  };

  const cells = [
    ...Array(firstDaySlot).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const TYPE_LABELS = { confidential: 'Confidentiel', strategic: 'Stratégique', personal: 'Personnel', meeting: 'Réunion' };

  return (
    <div className="animate-enter">
      {/* Header avec badge privé */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>Agenda Directeur</h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'var(--color-purple-bg)', border: '1px solid var(--color-purple-border)', fontSize: 10, fontWeight: 600, color: 'var(--color-purple)', letterSpacing: '.07em', fontFamily: 'var(--font-sans)' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              PRIVÉ
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{MONTHS[month]} {year} — Accès : Directeur &amp; Assistant</p>
        </div>
          {isAssistante && !isDirecteur && !isAdmin && (
            <Button variant="primary" onClick={() => setModal(true)}>+ Ajouter</Button>
          )}      
        </div>

      <div className="resp-agenda-grid">

        {/* Calendrier */}
        <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-purple-bg)' }}>
            <button onClick={prevMonth} style={{ background: 'transparent', border: '1px solid var(--color-purple-border)', borderRadius: 7, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-purple)', transition: 'all var(--transition-normal)' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="8,2 4,6 8,10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--color-purple)" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--color-purple)" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, color: 'var(--color-purple)' }}>{MONTHS[month]} {year}</h3>
            </div>
            <button onClick={nextMonth} style={{ background: 'transparent', border: '1px solid var(--color-purple-border)', borderRadius: 7, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-purple)', transition: 'all var(--transition-normal)' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="4,2 8,6 4,10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--color-border)' }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '.07em', fontFamily: 'var(--font-sans)' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} style={{ minHeight: 80, borderRight: i % 7 !== 6 ? '1px solid var(--color-border)' : 'none', borderBottom: '1px solid var(--color-border)', background: 'var(--color-background)' }} />;
              const key    = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const dayEvs = eventsForDay(day);
              const today  = isToday(day);
              const sel    = selected === key;
              return (
                <div key={`d-${day}`} onClick={() => selectDay(day)}
                  style={{ minHeight: 80, padding: '6px 7px', borderRight: i % 7 !== 6 ? '1px solid var(--color-border)' : 'none', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', background: sel ? 'var(--color-purple-bg)' : 'transparent', transition: 'background var(--transition-normal)' }}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'var(--color-background-tertiary)'; }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: today ? 700 : 400, background: today ? 'var(--color-purple)' : 'transparent', color: today ? '#fff' : sel ? 'var(--color-purple)' : 'var(--color-text-secondary)', fontFamily: 'var(--mono)' }}>
                      {day}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dayEvs.map(ev => {
                      const c = EVENT_COLORS[ev.type] || EVENT_COLORS.meeting;
                      return (
                        <div key={ev.id} style={{ background: c.bg, borderLeft: `2px solid ${c.fg}`, borderRadius: '0 3px 3px 0', padding: '1px 5px', fontSize: 9, color: c.fg, fontWeight: 500, fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '.02em' }}>
                          {ev.time} {ev.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panneau droit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Légende */}
          <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '.1em', fontWeight: 600, marginBottom: 12, fontFamily: 'var(--font-sans)' }}>LÉGENDE</p>
            {Object.entries(EVENT_COLORS).map(([type, c]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c.fg, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>{TYPE_LABELS[type]}</span>
              </div>
            ))}
          </div>

          {/* Détail du jour */}
          <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '.1em', fontWeight: 600, marginBottom: 14, fontFamily: 'var(--font-sans)' }}>
              {selected ? selected.split('-').reverse().join('/') : 'SÉLECTIONNER UN JOUR'}
            </p>
            {!selected && <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>Cliquez sur un jour pour voir les détails.</p>}
            {selected && dayEvents.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>Aucun événement ce jour.</p>}
            {dayEvents.map(ev => {
              const c = EVENT_COLORS[ev.type] || EVENT_COLORS.meeting;
              return (
                <div key={ev.id} onClick={() => setViewModal(ev)} style={{ padding: '10px 12px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 9, marginBottom: 8, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>{ev.title}</p>
                    <Badge label={TYPE_LABELS[ev.type]} color={ev.type === 'confidential' ? 'plum' : ev.type === 'strategic' ? 'ochre' : ev.type === 'personal' ? 'sage' : 'accent'} />
                  </div>
                  <p style={{ fontSize: 11, color: c.fg, fontFamily: 'var(--mono)' }}>{ev.time}</p>
                  {ev.note && <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4, fontStyle: 'italic' }}>{ev.note}</p>}
                </div>
              );
            })}
          </div>

          {/* Résumé du mois */}
          <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '.1em', fontWeight: 600, marginBottom: 12, fontFamily: 'var(--font-sans)' }}>CE MOIS</p>
            {Object.entries(TYPE_LABELS).map(([type, label]) => {
              const count = monthEvents.filter(e => e.type === type).length;
              const c = EVENT_COLORS[type];
              return (
                <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: c.fg }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal ajout */}
      <Modal open={modal} onClose={() => setModal(false)} title="Ajouter — Agenda Directeur">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Visibilité */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '.07em', display: 'block', marginBottom: 8 }}>
              VISIBILITÉ <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <VisibilitySelector value={form.visibility} onChange={v => setForm(f => ({ ...f, visibility: v }))} />
          </div>
          <Input label="Titre *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre de l'événement" />
          <div className="resp-form-2col">
            <Input label="Date *" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <Input label="Heure" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          </div>
          <Input label="Note (confidentielle)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Remarque interne..." />
          <div>
            <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>TYPE</label>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {Object.entries(TYPE_LABELS).map(([t, label]) => {
                const active = form.type === t;
                const c = EVENT_COLORS[t];
                return (
                  <button type="button" key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${active ? c.fg : 'var(--color-border)'}`, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)', background: active ? c.bg : 'transparent', color: active ? c.fg : 'var(--color-text-muted)', transition: 'all var(--transition-normal)' }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
            <Button variant="ghost" onClick={() => setModal(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleCreate}>Ajouter</Button>
          </div>
        </div>
      </Modal>

      {/* Modal détail événement */}
      <Modal open={!!viewModal} onClose={() => setViewModal(null)} title="Détail — Confidentiel">
        {viewModal && (() => {
          const c = EVENT_COLORS[viewModal.type] || EVENT_COLORS.meeting;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '12px 14px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>{viewModal.title}</p>
                <p style={{ fontSize: 12, color: c.fg, fontFamily: 'var(--mono)' }}>{viewModal.date} à {viewModal.time}</p>
                <Badge label={TYPE_LABELS[viewModal.type]} color={viewModal.type === 'confidential' ? 'plum' : viewModal.type === 'strategic' ? 'ochre' : 'sage'} style={{ marginTop: 8 }} />
              </div>
              {viewModal.note && (
                <div style={{ padding: '10px 14px', background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                  <p style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '.07em', marginBottom: 6, fontWeight: 600 }}>NOTE INTERNE</p>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>{viewModal.note}</p>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="ghost" onClick={() => setViewModal(null)}>Fermer</Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
