import React, { useState } from 'react';
import { SectionHeader, Card, Badge, Modal, Input, Button, EmptyState } from '../../../components/ui/index';
import { useNotif } from '../../../context/NotifContext';

const INITIAL_EVENTS = [
  { id: 'ev1', title: 'Lancement officiel XAMIO v1.0', date: '2025-04-15', time: '18:00', location: 'Hôtel Terrou-Bi, Dakar', type: 'launch', attendees: 120, description: 'Soirée de lancement de la plateforme XAMIO avec démos live, networking et cocktail.', status: 'confirmed', cover: '🚀' },
  { id: 'ev2', title: 'Conférence Tech Africa 2025', date: '2025-05-08', time: '09:00', location: 'CICAD, Dakar', type: 'conference', attendees: 450, description: 'Participation au panel "SaaS et Transformation digitale en Afrique de l\'Ouest".', status: 'confirmed', cover: '🎤' },
  { id: 'ev3', title: 'Team Building Équipe XAMIO', date: '2025-04-22', time: '10:00', location: 'Saly Portudal', type: 'internal', attendees: 18, description: 'Journée de cohésion d\'équipe : activités, retrospective et vision 2025.', status: 'planned', cover: '🏖' },
  { id: 'ev4', title: 'Webinar — Gestion de réunions avec l\'IA', date: '2025-04-03', time: '14:00', location: 'En ligne (Zoom)', type: 'webinar', attendees: 80, description: 'Démonstration des fonctionnalités IA de XAMIO pour les prospects.', status: 'confirmed', cover: '💻' },
];

const TYPE_META = {
  launch:     { label: 'Lancement',   color: 'ochre'  },
  conference: { label: 'Conférence',  color: 'plum'   },
  internal:   { label: 'Interne',     color: 'sage'   },
  webinar:    { label: 'Webinar',     color: 'slate'  },
};

export default function EventsPage() {
  const { addToast } = useNotif();
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [modal, setModal]   = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm]     = useState({ title: '', date: '', time: '', location: '', type: 'internal', attendees: '', description: '' });

  const handleCreate = () => {
    if (!form.title || !form.date) { addToast('Titre et date requis.', 'error'); return; }
    setEvents(prev => [...prev, { id: `ev${Date.now()}`, ...form, attendees: Number(form.attendees) || 0, status: 'planned', cover: '📅' }]);
    addToast('Événement créé !', 'success');
    setModal(false);
    setForm({ title: '', date: '', time: '', location: '', type: 'internal', attendees: '', description: '' });
  };

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="animate-enter">
      <SectionHeader title="Événements" subtitle={`${events.length} événements planifiés`} action="Créer" onAction={() => setModal(true)} />

      {events.length === 0
        ? <EmptyState icon="📅" title="Aucun événement" description="Créez votre premier événement interne ou externe." action="Créer un événement" onAction={() => setModal(true)} />
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sortedEvents.map(ev => {
              const tm = TYPE_META[ev.type] || TYPE_META.internal;
              const d  = ev.date.split('-').reverse().join('/');
              return (
                <div key={ev.id}
                  onClick={() => setDetail(detail?.id === ev.id ? null : ev)}
                  style={{ background: 'var(--color-background-secondary)', border: `1px solid ${detail?.id === ev.id ? 'var(--color-accent-border)' : 'var(--color-border)'}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'border-color var(--transition-normal)' }}
                  onMouseEnter={e => { if (detail?.id !== ev.id) e.currentTarget.style.borderColor = 'var(--color-border-medium)'; }}
                  onMouseLeave={e => { if (detail?.id !== ev.id) e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                >
                  {/* Main row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
                    {/* Cover emoji */}
                    <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                      {ev.cover}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{ev.title}</h3>
                        <Badge label={tm.label} color={tm.color} />
                        <Badge label={ev.status === 'confirmed' ? 'Confirmé' : 'Planifié'} color={ev.status === 'confirmed' ? 'sage' : 'ochre'} dot />
                      </div>
                      <div style={{ display: 'flex', gap: 18, fontSize: 12, color: 'var(--color-text-muted)' }}>
                        <span style={{ fontFamily: 'var(--mono)' }}>{d} · {ev.time}</span>
                        <span>{ev.location}</span>
                        <span>{ev.attendees} participants</span>
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: detail?.id === ev.id ? 'rotate(90deg)' : 'none', transition: 'transform var(--transition-normal)', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                      <polyline points="5,2 10,7 5,12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                  {/* Expanded detail */}
                  {detail?.id === ev.id && (
                    <div style={{ borderTop: '1px solid var(--color-border)', padding: '16px 20px', background: 'var(--color-background-tertiary)', display: 'flex', gap: 24 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', letterSpacing: '.07em', marginBottom: 8, fontWeight: 500 }}>DESCRIPTION</p>
                        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{ev.description || '—'}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                        <Button size="sm" variant="secondary" onClick={e => { e.stopPropagation(); addToast('Invitation envoyée !', 'success'); }}>
                          Inviter
                        </Button>
                        <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setEvents(prev => prev.filter(x => x.id !== ev.id)); setDetail(null); addToast('Événement supprimé.', 'warning'); }}>
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      <Modal open={modal} onClose={() => setModal(false)} title="Créer un événement">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Titre *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nom de l'événement" />
          <div className="resp-form-2col" style={{}}>
            <Input label="Date *" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <Input label="Heure" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          </div>
          <Input label="Lieu" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Adresse ou lien" />
          <div className="resp-form-2col" style={{}}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>TYPE</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ width: '100%', background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '9px 12px', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)' }}>
                <option value="internal">Interne</option>
                <option value="launch">Lancement</option>
                <option value="conference">Conférence</option>
                <option value="webinar">Webinar</option>
              </select>
            </div>
            <Input label="Nb participants" type="number" value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} placeholder="50" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>DESCRIPTION</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Décrivez l'événement…"
              style={{ width: '100%', background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '9px 12px', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 72, fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}
              onFocus={e => e.target.style.borderColor = 'var(--color-accent-border)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="ghost" onClick={() => setModal(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleCreate}>Créer l'événement</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
