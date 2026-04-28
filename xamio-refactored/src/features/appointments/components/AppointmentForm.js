import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { Button } from '../../../components/ui/index';
import { useRdvConflicts } from '../hooks/useRdvConflicts';

/* ─────────────────────────────────────────────
   RESPONSIVE STYLES INJECTION
   ───────────────────────────────────────────── */
const RESPONSIVE_CSS = `
  .appt-grid-3 {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr 1fr;
    gap: 12px;
  }
  .appt-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .appt-grid-3-contact {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
  }
  .appt-contact-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .appt-contact-switch {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
  .appt-contact-switch button {
    white-space: nowrap;
    min-width: 130px;
  }
  .appt-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-top: 1px solid var(--color-border);
    padding-top: 20px;
    gap: 16px;
    flex-wrap: wrap;
  }
  .appt-footer-actions {
    display: flex;
    gap: 12px;
  }
  .appt-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .appt-dept-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px;
    min-height: 44px;
    align-items: center;
  }

  @media (max-width: 768px) {
    .appt-grid-3 { grid-template-columns: 1fr 1fr; gap: 10px; }
    .appt-grid-3 > *:last-child { grid-column: 1 / -1; }
    .appt-grid-3-contact { grid-template-columns: 1fr 1fr; gap: 10px; }
    .appt-grid-3-contact > *:last-child { grid-column: 1 / -1; }
    .appt-contact-switch button { min-width: 110px; font-size: 12px; padding: 8px 10px; }
  }

  @media (max-width: 520px) {
    .appt-grid-3 { grid-template-columns: 1fr; }
    .appt-grid-3 > *:last-child { grid-column: auto; }
    .appt-grid-2 { grid-template-columns: 1fr; }
    .appt-grid-3-contact { grid-template-columns: 1fr; }
    .appt-grid-3-contact > *:last-child { grid-column: auto; }
    .appt-contact-header { flex-direction: column; align-items: flex-start; }
    .appt-contact-switch { width: 100%; }
    .appt-contact-switch button { flex: 1; min-width: 0; font-size: 12px; }
    .appt-footer { flex-direction: column; align-items: stretch; }
    .appt-footer > * { width: 100%; }
    .appt-footer-actions { justify-content: flex-end; }
  }

  @media (max-width: 380px) {
    .appt-footer-actions { flex-direction: column-reverse; }
    .appt-footer-actions button { width: 100%; }
  }
`;

function injectStyles() {
  if (document.getElementById('appt-form-responsive')) return;
  const el = document.createElement('style');
  el.id = 'appt-form-responsive';
  el.textContent = RESPONSIVE_CSS;
  document.head.appendChild(el);
}

/* ─────────────────────────────────────────────
   DESIGN TOKENS — variables CSS pour dark/light
   ───────────────────────────────────────────── */
const T = {
  bg:          'var(--color-background-secondary)',
  surface:     'var(--color-background-tertiary)',
  border:      'var(--color-border)',
  borderFocus: 'var(--color-text-primary)',
  text:        'var(--color-text-primary)',
  muted:       'var(--color-text-muted)',
  accent:      'var(--color-accent)',
  danger:      'var(--color-danger)',
  warning:     'var(--color-warning)',
  success:     'var(--color-success)',
  radius:      '8px',
  shadow:      '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
};

const API_BASE = process.env.REACT_APP_API_URL || '/api';

function authHeaders() {
  const token = localStorage.getItem('xamio_token');
  return {
    'Accept':        'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

/* ─────────────────────────────────────────────
   CONSTANTES
   ───────────────────────────────────────────── */
const TYPES = [
  { value: 'demo',        label: '🎯 Démo produit' },
  { value: 'partnership', label: '🤝 Partenariat' },
  { value: 'investment',  label: '💰 Investisseurs' },
  { value: 'commercial',  label: '📊 Commercial' },
  { value: 'hr',          label: '👤 Ressources Humaines' },
];

const DURATIONS = [
  { value: 15,  label: '15 minutes' },
  { value: 30,  label: '30 minutes' },
  { value: 45,  label: '45 minutes' },
  { value: 60,  label: '1 heure' },
  { value: 90,  label: '1h 30' },
  { value: 120, label: '2 heures' },
];

export const FORM_INITIAL = {
  title:                '',
  date:                 '',
  time:                 '',
  duration:             60,
  contactType:          'personne',
  contactNom:           '',
  contactEmail:         '',
  contactTel:           '',
  contactSociete:       '',
  contactReferent:      '',
  participantsInternes: [],
  participantsExternes: [],
  location:             '',
  type:                 'demo',
  description:          '',
  rappels:              [60, 1440],
};

/* ─────────────────────────────────────────────
   ATOMS
   ───────────────────────────────────────────── */
const Field = memo(({ label, required, hint, sublabel, children, error }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 4 }}>
      <div>
        <label style={{ fontSize: '13px', fontWeight: '600', color: T.text }}>
          {label}{required && <span style={{ color: T.danger }}> *</span>}
        </label>
        {sublabel && (
          <p style={{ fontSize: '11px', color: T.muted, margin: '2px 0 0' }}>{sublabel}</p>
        )}
      </div>
      {hint && <span style={{ fontSize: '11px', color: T.muted }}>{hint}</span>}
    </div>
    {children}
    {error && <span style={{ fontSize: '11px', color: T.danger, fontWeight: '500' }}>{error}</span>}
  </div>
));

const FormInput = memo(({ hasError, style: styleProp, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        width: '100%', padding: '10px 12px', fontSize: '14px',
        fontFamily: 'inherit', color: T.text, background: T.bg,
        borderRadius: T.radius, outline: 'none', boxSizing: 'border-box',
        border: `1px solid ${hasError ? T.danger : focused ? T.borderFocus : T.border}`,
        boxShadow: focused ? '0 0 0 3px rgba(128,128,128,.12)' : T.shadow,
        transition: 'all .15s ease-in-out',
        ...styleProp,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
});

const getSelectStyle = (hasError = false) => ({
  width: '100%', height: '41px', padding: '0 12px',
  background: T.bg,
  border: `1px solid ${hasError ? T.danger : T.border}`,
  borderRadius: T.radius, outline: 'none', fontSize: '14px',
  fontFamily: 'inherit', cursor: 'pointer', color: T.text,
});

function Section({ color = T.accent, title, description, children }) {
  return (
    <div style={{
      borderLeft: `3px solid ${color}`,
      paddingLeft: '14px',
      display: 'flex', flexDirection: 'column', gap: '14px',
    }}>
      {(title || description) && (
        <div>
          {title && <p style={{ fontSize: '13px', fontWeight: '700', color: T.text, margin: 0 }}>{title}</p>}
          {description && (
            <p style={{ fontSize: '11px', color: T.muted, margin: '3px 0 0' }}>{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function ParticipantCounter({ count, label, color = T.accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
      <span style={{ fontSize: '13px', fontWeight: '600', color: T.text }}>{label}</span>
      <span style={{
        fontSize: '11px', fontWeight: '700',
        padding: '1px 8px', borderRadius: '20px',
        background: count > 0 ? color : T.surface,
        color:      count > 0 ? '#fff' : T.muted,
        border:     `1px solid ${count > 0 ? color : T.border}`,
        transition: 'all .2s',
      }}>
        {count} {count === 1 ? 'personne' : 'personnes'}
      </span>
    </div>
  );
}

const ContactTypeSwitch = memo(({ value, onChange }) => (
  <div className="appt-contact-switch">
    {[
      { v: 'personne',   label: '👤 Personne physique' },
      { v: 'entreprise', label: '🏢 Entreprise' },
    ].map(opt => {
      const active = value === opt.v;
      return (
        <button key={opt.v} type="button" onClick={() => onChange(opt.v)} style={{
          flex: 1, padding: '9px 40px', borderRadius: T.radius,
          fontSize: '13px', fontWeight: active ? 600 : 400, cursor: 'pointer',
          border:     `1px solid ${active ? T.accent : T.border}`,
          background: active ? T.accent : T.bg,
          color:      active ? '#fff' : T.muted,
          fontFamily: 'inherit', transition: 'all .15s',
        }}>
          {active && '✓ '}{opt.label}
        </button>
      );
    })}
  </div>
));

const ConflictWarning = memo(({ conflicts }) => {
  if (!conflicts.length) return null;
  return (
    <div style={{
      padding: '10px 14px', borderRadius: T.radius,
      background: 'var(--color-warning-bg)',
      border: '1px solid var(--color-warning-border)',
      color: T.warning, fontSize: '13px',
      display: 'flex', flexDirection: 'column', gap: '5px',
    }}>
      <span style={{ fontWeight: '600' }}>
        ⚠️ {conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} détecté{conflicts.length > 1 ? 's' : ''}
      </span>
      {conflicts.map((r, i) => (
        <span key={i} style={{ fontSize: '12px', color: T.warning }}>
          · <strong>{r.rdv_titre}</strong>
          {' — '}{(r.rdv_date ?? '').slice(0, 10)}
          {r.rdv_heure ? ` à ${r.rdv_heure}` : ''}
          {' ('}{r.rdv_duree ?? 60} min{')'}
        </span>
      ))}
      <span style={{ fontSize: '11px', color: T.muted, marginTop: '2px' }}>
        Un ou plusieurs participants sont déjà engagés sur ce créneau. Vous pouvez quand même créer le RDV.
      </span>
    </div>
  );
});

/* ─────────────────────────────────────────────
   COMPOSANT PRINCIPAL
   ───────────────────────────────────────────── */
export default function AppointmentForm({ form, setForm, onSubmit, onCancel, errors = {}, loading = false }) {
  
  useEffect(() => { injectStyles(); }, []);

  const participantsInternes = form?.participantsInternes ?? [];
  const participantsExternes = form?.participantsExternes ?? [];
  const contactType          = form?.contactType          ?? 'personne';

  const update = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), [setForm]);
  const today  = useMemo(() => new Date().toISOString().split('T')[0], []);

  const { conflicts, checking } = useRdvConflicts({
    date:                form?.date,
    time:                form?.time,
    duration:            form?.duration,
    participantsInternes,
  });

  const [departements, setDepartements] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [deptIds,      setDeptIds]      = useState([]);
  const [searchTerm,   setSearchTerm]   = useState('');

  useEffect(() => {
    setLoadingDepts(true);
    fetch(`${API_BASE}/departements`, { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { if (data.success) setDepartements(data.departements || []); })
      .catch(err => console.error('[AppointmentForm] départements :', err.message))
      .finally(() => setLoadingDepts(false));
  }, []);

  const deptMembers = useMemo(() => {
    const all = departements
      .filter(d => deptIds.includes(d.dept_id))
      .flatMap(d => d.membres || []);
    return Array.from(new Map(all.map(m => [m.email, m])).values());
  }, [deptIds, departements]);

  const filteredMembers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return deptMembers.filter(m =>
      `${m.util_prenom} ${m.util_nom} ${m.email}`.toLowerCase().includes(term)
    );
  }, [deptMembers, searchTerm]);

  const addInterne = useCallback(m => {
    if (participantsInternes.some(p => p.email === m.email)) return;
    update('participantsInternes', [
      ...participantsInternes,
      { id: crypto.randomUUID(), user_id: m.user_id || m.id, nom: `${m.util_prenom} ${m.util_nom}`, email: m.email },
    ]);
  }, [participantsInternes, update]);

  const removeInterne = useCallback(id => {
    update('participantsInternes', participantsInternes.filter(p => p.id !== id));
  }, [participantsInternes, update]);

  const [pInput, setPInput] = useState({ nom: '', email: '' });

  const addExterne = useCallback(() => {
    const email = pInput.email.trim();
    if (!email || !email.includes('@')) return;
    if (form?.contactEmail && email === form.contactEmail.trim()) return;
    if (participantsExternes.some(p => p.email === email)) return;
    update('participantsExternes', [
      ...participantsExternes,
      { id: crypto.randomUUID(), nom: pInput.nom.trim(), email, _externe: true },
    ]);
    setPInput({ nom: '', email: '' });
  }, [pInput, participantsExternes, form?.contactEmail, update]);

  const removeExterne = useCallback(id => {
    update('participantsExternes', participantsExternes.filter(p => p.id !== id));
  }, [participantsExternes, update]);

  const principalLabel = contactType === 'entreprise' ? form?.contactSociete : form?.contactNom;
  const hasPrincipal   = !!(principalLabel || form?.contactEmail);
  const totalExternes  = (hasPrincipal ? 1 : 0) + participantsExternes.length;

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit(); }}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '10px 0' }}
    >

      {/* ── 1. INFORMATIONS GÉNÉRALES ── */}
      <Section
        color={T.borderFocus}
        title="Informations générales"
        description="Les champs obligatoires pour créer le rendez-vous"
      >
        <Field label="Titre du rendez-vous" required error={errors.title}>
          <FormInput
            placeholder="Ex : Démo produit — CBAO"
            value={form?.title ?? ''}
            hasError={!!errors.title}
            onChange={e => update('title', e.target.value)}
            autoFocus
          />
        </Field>

        <div className="appt-grid-3">
          <Field label="Date" required error={errors.date}>
            <FormInput
              type="date" min={today}
              value={form?.date ?? ''}
              hasError={!!errors.date}
              onChange={e => update('date', e.target.value)}
            />
          </Field>
          <Field label="Heure" hint={checking ? '⟳ vérif…' : undefined}>
            <FormInput
              type="time"
              value={form?.time ?? ''}
              onChange={e => update('time', e.target.value)}
            />
          </Field>
          <Field label="Durée">
            <select value={form?.duration ?? 60} onChange={e => update('duration', Number(e.target.value))} style={getSelectStyle()}>
              {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Lieu ou visioconférence">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: T.muted }}>📍</span>
            <FormInput
              style={{ paddingLeft: '34px' }}
              placeholder="Salle de réunion, lien Zoom, Teams…"
              value={form?.location ?? ''}
              onChange={e => update('location', e.target.value)}
            />
          </div>
        </Field>

        <Field label="Type de rendez-vous">
          <select value={form?.type ?? 'demo'} onChange={e => update('type', e.target.value)} style={getSelectStyle()}>
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
      </Section>

      {/* ── 2. PARTICIPANTS INTERNES ── */}
      <Section
        color={T.accent}
        title="Participants internes"
        description="Membres de votre organisation présents au rendez-vous"
      >
        <ParticipantCounter count={participantsInternes.length} label="Membres ajoutés" color={T.accent} />

        {participantsInternes.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px',
            padding: '10px',
            background: 'var(--color-accent-bg)',
            borderRadius: T.radius,
            border: '1px solid var(--color-accent-border)',
          }}>
            {participantsInternes.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: T.bg, padding: '4px 10px',
                borderRadius: '20px',
                border: '1px solid var(--color-accent-border)',
                fontSize: '12px',
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: T.accent, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, flexShrink: 0,
                }}>
                  {p.nom?.charAt(0) ?? '?'}
                </span>
                <span style={{ fontWeight: '600', color: T.accent }}>{p.nom}</span>
                <button
                  type="button" onClick={() => removeInterne(p.id)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.danger, fontSize: 13 }}
                >✕</button>
              </div>
            ))}
          </div>
        )}

        <Field
          label="Filtrer par département"
          sublabel="Sélectionnez un département pour voir ses membres"
          hint={loadingDepts ? '⟳ chargement…' : `${deptIds.length} sélectionné(s)`}
        >
          <div style={{
            background: T.surface, borderRadius: T.radius,
            border: `1px solid ${T.border}`, minHeight: '44px',
          }}>
            <div className="appt-dept-pills">
              {loadingDepts ? (
                <span style={{ fontSize: '12px', color: T.muted }}>Chargement des départements...</span>
              ) : departements.length === 0 ? (
                <span style={{ fontSize: '12px', color: T.muted }}>Aucun département disponible</span>
              ) : (
                departements.map(d => {
                  const active = deptIds.includes(d.dept_id);
                  return (
                    <button
                      key={d.dept_id} type="button"
                      onClick={() => setDeptIds(prev =>
                        active ? prev.filter(i => i !== d.dept_id) : [...prev, d.dept_id]
                      )}
                      style={{
                        padding: '4px 12px', borderRadius: '15px', fontSize: '12px',
                        cursor: 'pointer', transition: 'all 0.1s', whiteSpace: 'nowrap',
                        border:     `1px solid ${active ? T.accent : T.border}`,
                        background: active ? T.accent : T.bg,
                        color:      active ? '#fff' : T.text,
                      }}
                    >
                      {active && '✓ '}{d.dept_nom}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </Field>

        {deptIds.length > 0 && (
          <div style={{ background: T.surface, padding: '12px', borderRadius: T.radius }}>
            <FormInput
              placeholder="🔍 Rechercher un membre..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ marginBottom: '8px', height: '34px' }}
            />
            <div style={{
              maxHeight: '160px', overflowY: 'auto',
              background: T.bg,
              border: `1px solid ${T.border}`, borderRadius: '4px',
            }}>
              {filteredMembers.length === 0 ? (
                <p style={{ padding: '10px', fontSize: '12px', color: T.muted }}>Aucun membre trouvé</p>
              ) : (
                filteredMembers.map(m => {
                  const isAdded = participantsInternes.some(p => p.email === m.email);
                  return (
                    <div key={m.id || m.email} style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '8px 12px',
                      borderBottom: `1px solid ${T.border}`,
                      background: isAdded ? 'var(--color-success-bg)' : T.bg,
                      gap: 8,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: isAdded ? T.success : T.surface,
                          color: isAdded ? '#fff' : T.muted,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          {m.util_prenom?.charAt(0)}{m.util_nom?.charAt(0)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.util_prenom} {m.util_nom}
                          </span>
                          <span style={{ fontSize: '11px', color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</span>
                        </div>
                      </div>
                      <button
                        type="button" disabled={isAdded} onClick={() => addInterne(m)}
                        style={{
                          border: 'none', background: 'none', flexShrink: 0,
                          color:  isAdded ? T.success : T.accent,
                          cursor: isAdded ? 'default' : 'pointer',
                          fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap',
                        }}
                      >
                        {isAdded ? '✓ Ajouté' : '+ Ajouter'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </Section>

      {/* ── 3. CONTACTS EXTERNES ── */}
      <Section
        color={T.warning}
        title="Contacts externes"
        description="Personnes ou entreprises invitées au rendez-vous"
      >
        <ParticipantCounter count={totalExternes} label="Contacts ajoutés" color={T.warning} />

        <div style={{
          padding: '12px 14px', borderRadius: T.radius,
          background: 'var(--color-warning-bg)',
          border: '1px solid var(--color-warning-border)',
        }}>
          <div className="appt-contact-header">
            <span style={{ fontSize: '12px', fontWeight: '700', color: T.warning, letterSpacing: '.04em' }}>
              CONTACT PRINCIPAL · rappels automatiques 🔔
            </span>
            <ContactTypeSwitch value={contactType} onChange={v => update('contactType', v)} />
          </div>

          {contactType === 'personne' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="appt-grid-3-contact">
                <Field label="Nom">
                  <FormInput
                    placeholder="Amadou Diallo"
                    value={form?.contactNom ?? ''}
                    onChange={e => update('contactNom', e.target.value)}
                  />
                </Field>
                <Field label="Email" hint="🔔 rappels">
                  <FormInput
                    type="email"
                    placeholder="contact@exemple.com"
                    value={form?.contactEmail ?? ''}
                    onChange={e => update('contactEmail', e.target.value)}
                  />
                </Field>
                <Field label="Téléphone">
                  <FormInput
                    placeholder="+221 77 XXX XX XX"
                    value={form?.contactTel ?? ''}
                    onChange={e => update('contactTel', e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Société" sublabel="Si cette personne représente une entreprise">
                <FormInput
                  placeholder="CBAO"
                  value={form?.contactSociete ?? ''}
                  onChange={e => update('contactSociete', e.target.value)}
                />
              </Field>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="appt-grid-2">
                <Field label="Nom de l'entreprise" required>
                  <FormInput
                    placeholder="CBAO"
                    value={form?.contactSociete ?? ''}
                    onChange={e => update('contactSociete', e.target.value)}
                  />
                </Field>
                <Field label="Contact référent" sublabel="Interlocuteur principal">
                  <FormInput
                    placeholder="Amadou Diallo"
                    value={form?.contactReferent ?? ''}
                    onChange={e => update('contactReferent', e.target.value)}
                  />
                </Field>
              </div>
              <div className="appt-grid-2">
                <Field label="Email" hint="🔔 rappels">
                  <FormInput
                    type="email"
                    placeholder="contact@entreprise.com"
                    value={form?.contactEmail ?? ''}
                    onChange={e => update('contactEmail', e.target.value)}
                  />
                </Field>
                <Field label="Téléphone">
                  <FormInput
                    placeholder="+221 33 XXX XX XX"
                    value={form?.contactTel ?? ''}
                    onChange={e => update('contactTel', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ── 4. DESCRIPTION ── */}
      <Section color={T.success}>
        <Field label="Description" sublabel="Objectif du RDV, points à aborder, documents à préparer">
          <textarea
            value={form?.description ?? ''}
            onChange={e => update('description', e.target.value)}
            placeholder="Ex : Présenter la démo v2 de XAMIO, discuter des tarifs Pro, répondre aux questions techniques..."
            rows={3}
            style={{
              width: '100%', padding: '10px 12px', fontSize: '14px',
              fontFamily: 'inherit', color: T.text, background: T.bg,
              borderRadius: T.radius, outline: 'none', resize: 'vertical',
              border: `1px solid ${T.border}`, boxSizing: 'border-box',
              lineHeight: 1.6, transition: 'border-color .15s',
            }}
            onFocus={e => e.target.style.borderColor = T.borderFocus}
            onBlur={e  => e.target.style.borderColor = T.border}
          />
        </Field>
      </Section>

      <ConflictWarning conflicts={conflicts} />

      {/* ── Footer ── */}
  <div className="appt-footer">
    <div className="appt-footer-actions">
      <Button variant="ghost" type="button" onClick={onCancel} disabled={loading}>
        Annuler
      </Button>
      <Button
        variant="primary" type="submit"
        disabled={loading}
        style={{
          background: T.borderFocus,
          color: 'var(--color-background)',
          minWidth: '140px',
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'opacity .15s',
        }}
      >
        {loading ? (
          <>
            <svg
              width="14" height="14" viewBox="0 0 16 16" fill="none"
              style={{ animation: 'appt-spin .75s linear infinite', flexShrink: 0 }}
            >
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.8"
                strokeDasharray="22 16" strokeLinecap="round"/>
            </svg>
            Création en cours…
          </>
        ) : (
          'Créer le RDV'
        )}
      </Button>
    </div>
  </div>

    </form>
  );
}