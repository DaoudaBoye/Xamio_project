import { memo, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { SectionHeader, Card, EmptyState, StatusBadge } from './atoms';
import { formatApptDate } from './dashboard.utils';
import AppointmentForm, { FORM_INITIAL } from '../../appointments/components/AppointmentForm';

/* ─────────────────────────────────────────────
   MODAL — rendu via Portal dans document.body
   ───────────────────────────────────────────── */
const OVERLAY_STYLE = {
  position:             'fixed',
  inset:                0,
  zIndex:               9999,
  background:           'rgba(15,23,42,.5)',
  backdropFilter:       'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  display:              'flex',
  alignItems:           'center',
  justifyContent:       'center',
  padding:              '16px',
};

const MODAL_STYLE = {
  background:    'var(--c-surface)',       // ← était '#fff'
  borderRadius:  '14px',
  boxShadow:     '0 24px 80px rgba(0,0,0,.35)',
  width:         '100%',
  maxWidth:      '680px',
  maxHeight:     'calc(100vh - 32px)',
  overflowY:     'auto',
  display:       'flex',
  flexDirection: 'column',
  position:      'relative',
  animation:     'appt-modal-in .18s cubic-bezier(.2,0,.2,1)',
};

// Inject keyframe once
if (typeof document !== 'undefined' && !document.getElementById('appt-modal-anim')) {
  const s = document.createElement('style');
  s.id = 'appt-modal-anim';
  s.textContent = `
    @keyframes appt-modal-in {
      from { opacity: 0; transform: scale(.97) translateY(8px); }
      to   { opacity: 1; transform: none; }
    }
  `;
  document.head.appendChild(s);
}

function NewApptModal({ open, onClose, onSuccess }) {
  const [form,   setForm]   = useState({ ...FORM_INITIAL });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = useCallback(() => {
    const e = {};
    if (!form.title?.trim()) e.title      = 'Titre requis';
    if (!form.date)           e.date       = 'Date requise';
    if (!form.visibility)     e.visibility = 'Visibilité requise';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const handleClose = useCallback(() => {
    setForm({ ...FORM_INITIAL });
    setErrors({});
    setSaving(false);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('xamio_token') || '';
      const body  = {
        rdv_titre:             form.title,
        rdv_date:              form.date,
        rdv_heure:             form.time        || null,
        rdv_duree:             form.duration    || 60,
        rdv_lieu:              form.location    || null,
        rdv_type:              form.type        || 'demo',
        rdv_description:       form.description || null,
        rdv_visibilite:        form.visibility,
        contact_nom:           form.contactType === 'entreprise'
                                 ? (form.contactReferent || form.contactSociete)
                                 : form.contactNom,
        contact_email:         form.contactEmail   || null,
        contact_tel:           form.contactTel     || null,
        contact_societe:       form.contactSociete || null,
        rappels:               form.rappels        || [60, 1440],
        participants_internes: form.participantsInternes.map(p => p.user_id),
        participants_externes: form.participantsExternes,
      };

      const res  = await fetch('/api/rendez-vous', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':        'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        onSuccess?.(data.data);
        handleClose();
      } else {
        setErrors(data.errors ?? { title: data.message || 'Erreur serveur' });
      }
    } catch (err) {
      console.error('[NewApptModal]', err);
      setErrors({ title: 'Erreur réseau, réessayez.' });
    } finally {
      setSaving(false);
    }
  }, [form, validate, handleClose, onSuccess]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      style={OVERLAY_STYLE}
      onMouseDown={e => e.target === e.currentTarget && handleClose()}
    >
      <div style={MODAL_STYLE} role="dialog" aria-modal="true" aria-label="Nouveau rendez-vous">

        {/* ── Header ── */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '18px 24px 14px',
          borderBottom:   '1px solid var(--c-border)',      // ← était rgba fixe
          position:       'sticky',
          top:            0,
          background:     'var(--c-surface)',               // ← était '#fff'
          zIndex:         1,
          borderRadius:   '14px 14px 0 0',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--c-t1)' }}>
              🗓 Nouveau rendez-vous
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--c-t3)' }}>
              Planifiez un RDV avec un contact externe
            </p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Fermer"
            style={{
              border:         'none',
              background:     'none',
              cursor:         'pointer',
              fontSize:       '16px',
              color:          'var(--c-t3)',                // ← était '#9B9890'
              borderRadius:   '6px',
              width:          '32px',
              height:         '32px',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              transition:     'background .12s, color .12s',
              flexShrink:     0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-surface-2)'; e.currentTarget.style.color = 'var(--c-t1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none';               e.currentTarget.style.color = 'var(--c-t3)'; }}
          >
            ✕
          </button>
        </div>

        {/* ── Form ── */}
        <div style={{ padding: '0 24px 24px' }}>
          <AppointmentForm
            form={form}
            setForm={setForm}
            errors={errors}
            onSubmit={handleSubmit}
            onCancel={handleClose}
          />
        </div>

        {/* ── Saving overlay ── */}
        {saving && (
          <div style={{
            position:       'absolute',
            inset:          0,
            background:     'rgba(0,0,0,.25)',             // ← neutre pour dark/light
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            borderRadius:   '14px',
            fontSize:       '14px',
            color:          'var(--c-t1)',                 // ← était '#5C5B55'
            fontWeight:     600,
          }}>
            ⟳ Création en cours…
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ── Quick action button ── */
const QuickActionBtn = memo(function QuickActionBtn({ label, icon, action, isLast }) {
  return (
    <button className="db-qa-btn" onClick={action} style={isLast ? { borderBottom: 'none' } : {}}>
      <span className="db-qa-icon" aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
});

/* ── Appointment card ── */
const AppointmentCard = memo(function AppointmentCard({ appt, peutGererRDV, onNewAppt }) {
  if (!appt) {
    return (
      <EmptyState
        icon="🗓"
        title="Aucun RDV prévu"
        description="Planifiez un rendez-vous avec un contact externe."
        ctaLabel={peutGererRDV ? '+ Nouveau RDV' : undefined}
        onCta={peutGererRDV ? onNewAppt : undefined}
      />
    );
  }

  return (
    <div style={{ padding: '16px 18px' }}>
      <p className="db-appt-time">{appt.rdv_heure?.slice(0, 5) ?? '—'}</p>
      <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--c-t1)', margin: '10px 0 3px' }}>
        {appt.rdv_titre}
      </p>
      <p style={{ fontSize: 11.5, color: 'var(--c-t3)', marginBottom: 2 }}>
        {formatApptDate(appt.rdv_date)}
      </p>
      <p style={{ fontSize: 11.5, color: 'var(--c-t3)', marginBottom: 14 }}>
        Avec {appt.contactExterne?.contact_nom ?? '—'}
      </p>
      <StatusBadge status={appt.rdv_statut} />
    </div>
  );
});

/* ── Right panel ── */
export const RightPanel = memo(function RightPanel({
  nextAppt, quickActions, pending,
  peutGererRDV, navigate,
  onApptCreated,
}) {
  const [apptModal, setApptModal] = useState(false);
  const openModal  = useCallback(() => setApptModal(true),  []);
  const closeModal = useCallback(() => setApptModal(false), []);

  const handleSuccess = useCallback((newAppt) => {
    onApptCreated?.(newAppt);
    closeModal();
  }, [onApptCreated, closeModal]);

  const patchedActions = quickActions.map(qa =>
    qa.icon === '🗓' ? { ...qa, action: openModal } : qa
  );

  return (
    <>
      <aside className="db-right-panel" aria-label="Panneau de droite">

        <div>
          <SectionHeader label="Prochain rendez-vous" />
          <Card>
            <AppointmentCard
              appt={nextAppt}
              peutGererRDV={peutGererRDV}
              onNewAppt={openModal}
            />
          </Card>
        </div>

        {patchedActions.length > 0 && (
          <div>
            <SectionHeader label="Actions rapides" />
            <Card style={{ overflow: 'hidden' }}>
              {patchedActions.map(({ label, icon, action }, i) => (
                <QuickActionBtn
                  key={label}
                  label={label}
                  icon={icon}
                  action={action}
                  isLast={i === patchedActions.length - 1}
                />
              ))}
            </Card>
          </div>
        )}

        <div>
          <SectionHeader
            label="Activité récente"
            action={pending > 0 ? `${pending} en attente` : undefined}
            onAction={() => navigate('/notifications')}
          />
          <Card>
            <EmptyState
              icon="🔔"
              title="Aucune activité"
              description="Vos notifications apparaîtront ici dès qu'il se passe quelque chose."
            />
          </Card>
        </div>

      </aside>

      <NewApptModal
        open={apptModal}
        onClose={closeModal}
        onSuccess={handleSuccess}
      />
    </>
  );
});