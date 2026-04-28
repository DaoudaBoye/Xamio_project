import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import { Modal } from '../../../components/ui/index';
import { useMeetingCreate }    from '../hooks/useMeetingCreate';
import { useMeetingConflicts } from '../hooks/useMeetingConflicts';
import { useNotif } from '../../../context/NotifContext';

const T = {
  bg:          'var(--color-background-secondary)',
  surface:     'var(--color-background-tertiary)',
  border:      'var(--color-border)',
  borderFocus: 'var(--color-text-primary)',
  text:        'var(--color-text-primary)',
  muted:       'var(--color-text-muted)',
  accent:      '#E8500A',
  danger:      'var(--color-danger)',
  warning:     'var(--color-warning)',
  success:     'var(--color-success)',
  radius:      '8px',
  shadow:      '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
};

const getSelectStyle = () => ({
  width: '100%', height: '41px', padding: '0 12px',
  background: T.bg, border: `1px solid ${T.border}`,
  borderRadius: T.radius, outline: 'none', fontSize: '14px',
  fontFamily: 'inherit', cursor: 'pointer', color: T.text,
});

const INITIAL_STATE = {
  title: '', date: '', time: '', duration: 60,
  location: '', visibility: 'organisation', dept_ids: [],
  participants: [], agenda: [],
};

const API_BASE = process.env.REACT_APP_API_URL || '/api';

function authHeaders() {
  const token = localStorage.getItem('xamio_token');
  return {
    'Accept':        'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

const Field = memo(({ label, required, hint, sublabel, children, error }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <label style={{ fontSize: '13px', fontWeight: '600', color: T.text }}>
          {label}{required && <span style={{ color: T.danger }}> *</span>}
        </label>
        {sublabel && <p style={{ fontSize: '11px', color: T.muted, margin: '2px 0 0' }}>{sublabel}</p>}
      </div>
      {hint && <span style={{ fontSize: '11px', color: T.muted }}>{hint}</span>}
    </div>
    {children}
    {error && <span style={{ fontSize: '11px', color: T.danger, fontWeight: '500' }}>{error}</span>}
  </div>
));

const Input = memo(({ hasError, style: styleProp, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        width: '100%', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit',
        color: T.text, background: T.bg, borderRadius: T.radius, outline: 'none',
        border: `1px solid ${hasError ? T.danger : isFocused ? T.borderFocus : T.border}`,
        boxShadow: isFocused ? '0 0 0 3px rgba(128,128,128,.12)' : T.shadow,
        transition: 'all .15s ease-in-out', boxSizing: 'border-box', ...styleProp,
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
});

function Section({ color = T.accent, title, description, children }) {
  return (
    <div style={{ borderLeft: `3px solid ${color}`, paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <p style={{ fontSize: '13px', fontWeight: '700', color: T.text, margin: 0 }}>{title}</p>
        {description && <p style={{ fontSize: '11px', color: T.muted, margin: '3px 0 0' }}>{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ParticipantCounter({ count, label, color = T.accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
      <span style={{ fontSize: '13px', fontWeight: '600', color: T.text }}>{label}</span>
      <span style={{
        fontSize: '11px', fontWeight: '700', padding: '1px 8px', borderRadius: '20px',
        background: count > 0 ? color : T.surface,
        color: count > 0 ? '#fff' : T.muted,
        border: `1px solid ${count > 0 ? color : T.border}`,
        transition: 'all .2s',
      }}>
        {count} {count === 1 ? 'personne' : 'personnes'}
      </span>
    </div>
  );
}

const ConflictWarning = memo(({ conflicts }) => {
  if (conflicts.length === 0) return null;
  return (
    <div style={{
      padding: '10px 14px', borderRadius: T.radius,
      background: 'var(--color-warning-bg)',
      border: '1px solid var(--color-warning-border)',
      color: 'var(--color-warning)', fontSize: '13px',
      display: 'flex', flexDirection: 'column', gap: '5px',
    }}>
      <span style={{ fontWeight: '600' }}>
        ⚠️ {conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} de planning détecté{conflicts.length > 1 ? 's' : ''}
      </span>
      {conflicts.map((r, i) => (
        <span key={i} style={{ fontSize: '12px', color: 'var(--color-warning)' }}>
          · <strong>{r.reun_titre}</strong>
          {' — '}{(r.reun_date ?? '').slice(0, 10)}
          {r.reun_heure ? ` à ${r.reun_heure}` : ''}
          {' ('}{r.reun_duree_min ?? 60} min{')'}
        </span>
      ))}
      <span style={{ fontSize: '11px', color: T.muted, marginTop: '2px' }}>
        Un ou plusieurs participants sont déjà engagés sur ce créneau. Vous pouvez quand même créer la réunion.
      </span>
    </div>
  );
});

export const CreateMeetingModal = memo(({ open, onClose, onCreate }) => {
  const { create, loading, error: apiError } = useMeetingCreate();
  const { addToast } = useNotif();

  const [form,         setForm]         = useState(INITIAL_STATE);
  const [errors,       setErrors]       = useState({});
  const [pInput,       setPInput]       = useState({ nom: '', email: '' });
  const [searchTerm,   setSearchTerm]   = useState('');
  const [departements, setDepartements] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [submitting,   setSubmitting]   = useState(false); // ✅ guard double-submit

  const { conflicts, checking } = useMeetingConflicts({
    date: form.date, time: form.time,
    duration: form.duration, participants: form.participants,
  });

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    if (!open) return;
    setForm(INITIAL_STATE);
    setErrors({});
    setPInput({ nom: '', email: '' });
    setSearchTerm('');
    setDepartements([]);
    setSubmitting(false);
    setLoadingDepts(true);

    fetch(`${API_BASE}/departements`, { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { if (data.success) setDepartements(data.departements || []); })
      .catch(err => console.error('[CreateMeetingModal] départements :', err.message))
      .finally(() => setLoadingDepts(false));
  }, [open]);

  const deptMembers = useMemo(() => {
    const all = departements
      .filter(d => form.dept_ids.includes(d.dept_id))
      .flatMap(d => d.membres || []);
    return Array.from(new Map(all.map(m => [m.email, m])).values());
  }, [form.dept_ids, departements]);

  const filteredMembers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return deptMembers.filter(m =>
      `${m.util_prenom} ${m.util_nom} ${m.email}`.toLowerCase().includes(term)
    );
  }, [deptMembers, searchTerm]);

  const update = useCallback((k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(prev => (prev[k] ? { ...prev, [k]: null } : prev));
  }, []);

  const addParticipant = useCallback(() => {
    const email = pInput.email.trim();
    if (!email || !email.includes('@') || form.participants.some(p => p.email === email)) return;
    update('participants', [
      ...form.participants,
      { id: crypto.randomUUID(), nom: pInput.nom.trim(), email, _externe: true },
    ]);
    setPInput({ nom: '', email: '' });
  }, [pInput, form.participants, update]);

  const addAgendaPoint = useCallback(e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    e.stopPropagation(); // ✅ empêche la propagation vers le form
    const val = e.target.value.trim();
    if (!val) return;
    update('agenda', [...form.agenda, { id: crypto.randomUUID(), text: val }]);
    e.target.value = '';
  }, [form.agenda, update]);

  const handleSubmit = async e => {
    e?.preventDefault();
    e?.stopPropagation();

    if (submitting || loading) return; // ✅ guard double-submit

    const errs = {};
    if (!form.title.trim()) errs.title = 'Objet requis';
    if (!form.date)         errs.date  = 'Date requise';
    if (Object.keys(errs).length) return setErrors(errs);

    setSubmitting(true);
    try {
      const apiResponse = await create(form);
      addToast(`Réunion "${form.title}" planifiée`, 'success');
      onCreate?.(apiResponse);
      onClose();
    } catch (err) {
      // apiError géré par useMeetingCreate
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = loading || submitting;

  return (
    <Modal open={open} onClose={onClose} title="📅 Planifier une réunion" width={600}>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '10px 0' }}
      >
        {apiError && (
          <div style={{
            padding: '10px', borderRadius: T.radius,
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: T.danger, fontSize: '13px',
          }}>
            {apiError}
          </div>
        )}

        {/* ── 1. INFORMATIONS GÉNÉRALES ── */}
        <Section color="var(--color-text-primary)" title="Informations générales" description="Les champs obligatoires pour planifier la réunion">
          <Field label="Objet de la réunion" required error={errors.title}>
            <Input
              placeholder="Nommer la session…"
              value={form.title} hasError={!!errors.title}
              onChange={e => update('title', e.target.value)} autoFocus
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr 1fr', gap: '12px' }}>
            <Field label="Date" required error={errors.date}>
              <Input type="date" min={today} value={form.date} hasError={!!errors.date} onChange={e => update('date', e.target.value)} />
            </Field>
            <Field label="Heure" hint={checking ? '⟳ vérification…' : undefined}>
              <Input type="time" value={form.time} onChange={e => update('time', e.target.value)} />
            </Field>
            <Field label="Durée">
              <select value={form.duration} onChange={e => update('duration', Number(e.target.value))} style={getSelectStyle()}>
                <option value={30}>30 min</option>
                <option value={60}>1 heure</option>
                <option value={90}>1h 30</option>
                <option value={120}>2 heures</option>
              </select>
            </Field>
          </div>

          <Field label="Lieu ou visioconférence">
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: T.muted }}>📍</span>
              <Input style={{ paddingLeft: '34px' }} placeholder="Salle de réunion, lien Zoom, Teams…" value={form.location} onChange={e => update('location', e.target.value)} />
            </div>
          </Field>
        </Section>

        {/* ── 2. PARTICIPANTS INTERNES ── */}
        <Section color={T.accent} title="Participants internes" description="Membres de votre organisation invités à cette réunion">
          <ParticipantCounter count={form.participants.filter(p => !p._externe).length} label="Membres ajoutés" color={T.accent} />

          {form.participants.filter(p => !p._externe).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px', background: 'rgba(232,80,10,0.06)', borderRadius: T.radius, border: '1px solid rgba(232,80,10,0.18)' }}>
              {form.participants.filter(p => !p._externe).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: T.bg, padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(232,80,10,0.18)', fontSize: '12px' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: T.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {p.nom?.charAt(0) ?? '?'}
                  </span>
                  <span style={{ fontWeight: '600', color: T.accent }}>{p.nom || p.email.split('@')[0]}</span>
                  <button
                    type="button" // ✅
                    onClick={() => update('participants', form.participants.filter(x => x.id !== p.id))}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.danger, fontSize: 13 }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          <Field label="Filtrer par département" sublabel="Sélectionnez un département pour voir ses membres" hint={loadingDepts ? '⟳ chargement…' : `${form.dept_ids.length} sélectionné(s)`}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px', background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, minHeight: '44px', alignItems: 'center' }}>
              {loadingDepts ? (
                <span style={{ fontSize: '12px', color: T.muted }}>Chargement des départements...</span>
              ) : departements.length === 0 ? (
                <span style={{ fontSize: '12px', color: T.muted }}>Aucun département disponible</span>
              ) : (
                departements.map(d => {
                  const active = form.dept_ids.includes(d.dept_id);
                  return (
                    <button
                      key={d.dept_id}
                      type="button" // ✅
                      onClick={() => update('dept_ids', active ? form.dept_ids.filter(i => i !== d.dept_id) : [...form.dept_ids, d.dept_id])}
                      style={{ padding: '4px 12px', borderRadius: '15px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.1s', border: `1px solid ${active ? T.accent : T.border}`, background: active ? T.accent : T.bg, color: active ? '#fff' : T.text }}
                    >
                      {active && '✓ '}{d.dept_nom}
                    </button>
                  );
                })
              )}
            </div>
          </Field>

          {form.dept_ids.length > 0 && (
            <div style={{ background: T.surface, padding: '12px', borderRadius: T.radius }}>
              <Input placeholder="🔍 Rechercher un membre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ marginBottom: '8px', height: '34px' }} />
              <div style={{ maxHeight: '160px', overflowY: 'auto', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '4px' }}>
                {filteredMembers.length === 0 ? (
                  <p style={{ padding: '10px', fontSize: '12px', color: T.muted }}>Aucun membre trouvé</p>
                ) : (
                  filteredMembers.map(m => {
                    const isAdded = form.participants.some(p => p.email === m.email);
                    return (
                      <div key={m.id || m.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: `1px solid ${T.border}`, background: isAdded ? 'var(--color-success-bg)' : T.bg }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: isAdded ? 'var(--color-success)' : T.surface, color: isAdded ? '#fff' : T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {m.util_prenom?.charAt(0)}{m.util_nom?.charAt(0)}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: T.text }}>{m.util_prenom} {m.util_nom}</span>
                            <span style={{ fontSize: '11px', color: T.muted }}>{m.email}</span>
                          </div>
                        </div>
                        <button
                          type="button" // ✅
                          disabled={isAdded}
                          onClick={() => update('participants', [...form.participants, { id: crypto.randomUUID(), nom: `${m.util_prenom} ${m.util_nom}`, email: m.email }])}
                          style={{ border: 'none', background: 'none', color: isAdded ? 'var(--color-success)' : T.accent, cursor: isAdded ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '12px' }}
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

        {/* ── 3. PARTICIPANTS EXTERNES ── */}
        <Section color="var(--color-purple)" title="Participants externes" description="Personnes extérieures à votre organisation invitées à la réunion">
          <ParticipantCounter count={form.participants.filter(p => p._externe).length} label="Contacts externes ajoutés" color="var(--color-purple)" />

          <Field sublabel="Saisissez le nom et l'email puis cliquez sur Ajouter">
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input placeholder="Nom" value={pInput.nom} onChange={e => setPInput({ ...pInput, nom: e.target.value })} />
              <Input
                placeholder="Email *"
                value={pInput.email}
                onChange={e => setPInput({ ...pInput, email: e.target.value })}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation(); // ✅
                    addParticipant();
                  }
                }}
              />
              <button
                type="button" // ✅
                onClick={addParticipant}
                style={{ padding: '0 16px', borderRadius: T.radius, border: `1px solid ${T.border}`, background: 'transparent', color: T.text, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}
              >
                Ajouter
              </button>
            </div>
          </Field>

          {form.participants.filter(p => p._externe).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {form.participants.filter(p => p._externe).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-purple-bg)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--color-purple-border)', fontSize: '12px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--color-purple)' }}>{p.nom || p.email.split('@')[0]}</span>
                  {p.nom && <span style={{ color: T.muted, fontSize: 11 }}>· {p.email}</span>}
                  <button
                    type="button" // ✅
                    onClick={() => update('participants', form.participants.filter(x => x.id !== p.id))}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.danger }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── 4. ORDRE DU JOUR ── */}
        <Section color="var(--color-warning)" title="Ordre du jour" description="Les points à aborder durant la réunion">
          <Field sublabel="Appuyez sur Entrée pour ajouter un point">
            <Input placeholder="Ex : Revue du budget Q3, Présentation des KPIs…" onKeyDown={addAgendaPoint} />
          </Field>

          {form.agenda.length > 0 && (
            <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
              {form.agenda.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', padding: '10px 12px', borderBottom: i < form.agenda.length - 1 ? `1px solid ${T.border}` : 'none', color: T.text }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--color-warning)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <span style={{ flex: 1 }}>{item.text}</span>
                  <button
                    type="button" // ✅
                    onClick={() => update('agenda', form.agenda.filter(x => x.id !== item.id))}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.muted }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <ConflictWarning conflicts={conflicts} />

       {/* ── Footer ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: `1px solid ${T.border}`, paddingTop: '20px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDisabled}
            style={{
              padding: '9px 18px', borderRadius: T.radius,
              border: `1px solid ${T.border}`, background: 'transparent',
              color: T.text, fontSize: 13, fontWeight: 500,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: isDisabled ? 0.6 : 1,
            }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isDisabled}
            style={{
              padding: '9px 24px', borderRadius: T.radius, border: 'none',
              background: isDisabled ? T.muted : 'var(--color-text-primary)',
              color: 'var(--color-background)', fontSize: 13, fontWeight: 700,
              cursor: isDisabled ? 'not-allowed' : 'pointer', minWidth: 150,
              fontFamily: 'inherit', transition: 'all .15s', opacity: isDisabled ? 0.7 : 1,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {isDisabled ? (
              <>
                <svg
                  width="14" height="14" viewBox="0 0 16 16" fill="none"
                  style={{ animation: 'appt-spin .75s linear infinite', flexShrink: 0 }}
                >
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.8"
                    strokeDasharray="22 16" strokeLinecap="round"/>
                </svg>
                Planification…
              </>
            ) : (
              'Créer la réunion'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
});

export default CreateMeetingModal;