import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Modal } from '../../../components/ui/index';
import { useNotif } from '../../../context/NotifContext';

/* ─── Styles ─── */
const CSS = `
  .ctm-footer { display: flex; justify-content: flex-end; gap: 10px; padding-top: 20px; border-top: 1px solid var(--color-border); margin-top: 4px; }
  @media (max-width: 520px) {
    .ctm-footer { flex-direction: column-reverse; }
    .ctm-footer button { width: 100%; }
  }
  @keyframes ctm-spin { to { transform: rotate(360deg); } }
`;

function injectCSS() {
  if (document.getElementById('ctm-style')) return;
  const s = document.createElement('style');
  s.id = 'ctm-style';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─── Thème ─── */
const T = {
  bg:      'var(--color-background-secondary)',
  surface: 'var(--color-background-tertiary)',
  bd:      'var(--color-border)',
  bdFocus: 'var(--color-border-strong)',
  t1:      'var(--color-text-primary)',
  t2:      'var(--color-text-secondary)',
  t3:      'var(--color-text-muted)',
  acc:     '#E8500A',
  accm:    'rgba(232, 80, 10, 0.08)',
  accb:    'rgba(232, 80, 10, 0.22)',
  danger:  'var(--color-danger)',
  success: 'var(--color-success)',
  r:       'var(--radius-medium)',
  rl:      'var(--radius-large)',
};

/* ─── Constantes ─── */
const PRIORITIES = [
  { val: 'high',   label: 'Haute',   dot: '#E24B4A' },
  { val: 'medium', label: 'Normale', dot: '#BA7517' },
  { val: 'low',    label: 'Basse',   dot: '#378ADD' },
];

export const FORM_INITIAL = {
  title:       '',
  priority:    'medium',
  due:         '',
  description: '',
};

const API_BASE = process.env.REACT_APP_API_URL || '/api';

function authHeaders() {
  const token = localStorage.getItem('xamio_token');
  return {
    'Content-Type': 'application/json',
    Accept:         'application/json',
    Authorization:  token ? `Bearer ${token}` : '',
  };
}

/* ─── Composants UI ─── */
const FormField = memo(({ label, required, hint, error, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: T.t2 }}>
        {label}
        {required && <span style={{ color: T.danger, marginLeft: 2 }}>*</span>}
      </label>
      {hint && <span style={{ fontSize: 11, color: T.t3 }}>{hint}</span>}
    </div>
    {children}
    {error && <span style={{ fontSize: 11, color: T.danger, fontWeight: 500 }}>{error}</span>}
  </div>
));

const FormInput = memo(({ hasError, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        width: '100%', height: 36, padding: '0 12px', fontSize: 13,
        fontFamily: 'var(--font-sans)', color: T.t1, background: T.bg,
        border: `1px solid ${hasError ? T.danger : focused ? T.bdFocus : T.bd}`,
        borderRadius: T.r, outline: 'none', boxSizing: 'border-box',
        boxShadow: focused ? `0 0 0 3px ${T.accm}` : 'none',
        transition: 'all .15s',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
});

function Section({ color = T.acc, title, description, children }) {
  return (
    <div style={{ borderLeft: `3px solid ${color}`, paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {(title || description) && (
        <div>
          {title       && <p style={{ fontSize: 13, fontWeight: 700, color: T.t1, margin: 0 }}>{title}</p>}
          {description && <p style={{ fontSize: 11, color: T.t3, margin: '3px 0 0' }}>{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function PriorityPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {PRIORITIES.map(p => (
        <button
          key={p.val}
          type="button"
          onClick={() => onChange(p.val)}
          style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all .15s',
            border:     `1px solid ${value === p.val ? p.dot : T.bd}`,
            background: value === p.val ? p.dot + '22' : T.bg,
            color:      value === p.val ? p.dot : T.t3,
          }}
        >
          {value === p.val && '● '}{p.label}
        </button>
      ))}
    </div>
  );
}

function MemberRow({ member, isAdded, onAdd }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 12px', borderBottom: `1px solid ${T.bd}`,
      background: isAdded ? 'var(--color-success-bg)' : T.bg, gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: isAdded ? T.success : T.surface,
          color: isAdded ? '#fff' : T.t3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700,
        }}>
          {member.util_prenom?.[0]}{member.util_nom?.[0]}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: T.t1, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {member.util_prenom} {member.util_nom}
          </p>
          <p style={{ fontSize: 11, color: T.t3, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {member.email}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => !isAdded && onAdd(member)}
        disabled={isAdded}
        style={{
          border: 'none', background: 'none', flexShrink: 0,
          color:  isAdded ? T.success : T.acc,
          cursor: isAdded ? 'default' : 'pointer',
          fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap',
        }}
      >
        {isAdded ? '✓ Ajouté' : '+ Ajouter'}
      </button>
    </div>
  );
}

function GhostBtn({ children, onClick, disabled }) {
  const [h, setH] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '8px 18px', borderRadius: T.rl,
        border: `1px solid ${T.bd}`,
        background: h ? T.surface : 'transparent',
        color: h ? T.t1 : T.t2, fontSize: 13, fontWeight: 450,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-sans)', transition: 'all .15s',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

function PrimaryBtn({ children, loading, disabled }) {
  const [h, setH] = useState(false);
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 20px', borderRadius: T.rl, border: 'none',
        background: disabled || loading ? T.t3 : h ? '#C94108' : T.acc,
        color: '#fff', fontSize: 13, fontWeight: 700,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-sans)', transition: 'all .15s',
        boxShadow: h && !disabled && !loading ? `0 4px 20px ${T.acc}55` : `0 2px 8px ${T.acc}33`,
        transform: h && !disabled && !loading ? 'translateY(-1px)' : 'none',
        opacity: loading ? 0.8 : 1,
      }}
    >
      {loading && (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
          style={{ animation: 'ctm-spin .75s linear infinite', flexShrink: 0 }}>
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.8"
            strokeDasharray="22 16" strokeLinecap="round"/>
        </svg>
      )}
      {loading ? 'Création…' : children}
    </button>
  );
}

/* ─── Composant principal ─── */
export default function CreateTacheModal({ open, onClose, onCreated }) {
  const { addToast } = useNotif();

  const [form,         setForm]         = useState(FORM_INITIAL);
  const [errors,       setErrors]       = useState({});
  const [loading,      setLoading]      = useState(false);
  const [departements, setDepts]        = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [deptId,       setDeptId]       = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState(null); // ✅ dept retenu pour le submit
  const [assignee,     setAssignee]     = useState(null);
  const [memberSearch, setMemberSearch] = useState('');

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => { injectCSS(); }, []);

  useEffect(() => {
    if (!open) return;
    setForm(FORM_INITIAL);
    setErrors({});
    setDeptId(null);
    setSelectedDeptId(null); // ✅ reset
    setAssignee(null);
    setMemberSearch('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoadingDepts(true);
    fetch(`${API_BASE}/departements`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : { success: false })
      .then(data => { if (data.success) setDepts(data.departements || []); })
      .catch(() => {})
      .finally(() => setLoadingDepts(false));
  }, [open]);

  const update = useCallback((k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: null }));
  }, []);

  const deptMembers = useMemo(() => {
    const dept = departements.find(d => d.dept_id === deptId);
    return dept?.membres ?? [];
  }, [deptId, departements]);

  const filteredMembers = useMemo(() => {
    const term = memberSearch.toLowerCase();
    return deptMembers.filter(m =>
      `${m.util_prenom} ${m.util_nom} ${m.email}`.toLowerCase().includes(term)
    );
  }, [deptMembers, memberSearch]);

  // ✅ Quand on sélectionne un membre, on retient le deptId avant de fermer le panel
  const handleSelectMember = useCallback((member) => {
    setAssignee(member);
    setSelectedDeptId(deptId); // ✅ sauvegarde avant reset
    setDeptId(null);
    setMemberSearch('');
  }, [deptId]);

  // ✅ Quand on retire l'assignee, on remet aussi le dept
  const handleRemoveAssignee = useCallback(() => {
    setAssignee(null);
    setSelectedDeptId(null);
  }, []);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setErrors({ title: 'Le titre est obligatoire.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/taches`, {
        method:  'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          tache_titre:    form.title.trim(),
          tache_priorite: form.priority,
          tache_colonne:  'todo',
          tache_echeance: form.due              || null,
          description:    form.description      || null, // ✅ capturé depuis form
          user_id:        assignee?.user_id ?? assignee?.id ?? null,
          dept_id:        selectedDeptId ?? deptId ?? null, // ✅ retenu même après fermeture du panel
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Erreur serveur');
      }

      const { data: created } = await res.json();
      addToast('Tâche créée avec succès.', 'success');
      onCreated?.(created);
      onClose();
    } catch (e) {
      addToast(e.message || 'Erreur lors de la création.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { if (!loading) onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Nouvelle tâche" width={640}>
      <form
        onSubmit={e => { e.preventDefault(); handleSubmit(); }}
        style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '6px 0' }}
      >

        {/* ── 1. INFORMATIONS GÉNÉRALES ── */}
        <Section title="Informations générales" description="Champs obligatoires pour créer la tâche">

          <FormField label="Titre" required error={errors.title}>
            <FormInput
              placeholder="Ex : Préparer le rapport Q2"
              value={form.title}
              hasError={!!errors.title}
              onChange={e => update('title', e.target.value)}
              autoFocus
            />
          </FormField>

          <FormField label="Description" hint="Facultatif">
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Détails, contexte, ressources nécessaires..."
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', fontSize: 13,
                fontFamily: 'var(--font-sans)', color: T.t1, background: T.bg,
                border: `1px solid ${T.bd}`, borderRadius: T.r,
                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                lineHeight: 1.6, transition: 'border-color .15s',
              }}
              onFocus={e => e.target.style.borderColor = T.bdFocus}
              onBlur={e  => e.target.style.borderColor = T.bd}
            />
          </FormField>

          <FormField label="Échéance" hint="Facultatif">
            <FormInput
              type="date"
              min={today}
              value={form.due}
              onChange={e => update('due', e.target.value)}
            />
          </FormField>

        </Section>

        {/* ── 2. PRIORITÉ ── */}
        <Section color="#BA7517" title="Priorité" description="Niveau d'urgence de la tâche">
          <PriorityPicker value={form.priority} onChange={v => update('priority', v)} />
        </Section>

        {/* ── 3. ASSIGNATION ── */}
        <Section color={T.acc} title="Assigner à" description="Sélectionnez un département puis un membre">

          {assignee && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: T.r,
              background: T.accm, border: `1px solid ${T.accb}`,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: T.acc, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>
                {assignee.util_prenom?.[0]}{assignee.util_nom?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.acc, margin: 0 }}>
                  {assignee.util_prenom} {assignee.util_nom}
                </p>
                <p style={{ fontSize: 11, color: T.t3, margin: 0 }}>{assignee.email}</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveAssignee} // ✅ reset dept aussi
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.t3, fontSize: 18, lineHeight: 1 }}
              >×</button>
            </div>
          )}

          <FormField label="Département" hint={loadingDepts ? '⟳ chargement…' : undefined}>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 6, padding: 10,
              background: T.surface, border: `1px solid ${T.bd}`,
              borderRadius: T.r, minHeight: 44,
            }}>
              {loadingDepts ? (
                <span style={{ fontSize: 12, color: T.t3 }}>Chargement...</span>
              ) : departements.length === 0 ? (
                <span style={{ fontSize: 12, color: T.t3 }}>Aucun département disponible</span>
              ) : departements.map(d => {
                const active = deptId === d.dept_id || selectedDeptId === d.dept_id; // ✅ highlight même après sélection
                return (
                  <button
                    key={d.dept_id}
                    type="button"
                    onClick={() => { setDeptId(active ? null : d.dept_id); setMemberSearch(''); }}
                    style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12,
                      cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
                      border:     `1px solid ${active ? T.acc : T.bd}`,
                      background: active ? T.acc : T.bg,
                      color:      active ? '#fff' : T.t1,
                      fontWeight: active ? 700 : 400,
                    }}
                  >
                    {active && '✓ '}{d.dept_nom}
                  </button>
                );
              })}
            </div>
          </FormField>

          {deptId && (
            <div style={{ background: T.surface, padding: 12, borderRadius: T.r }}>
              <FormInput
                placeholder="🔍 Rechercher un membre..."
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                style={{ marginBottom: 8, height: 34 }}
              />
              <div style={{
                maxHeight: 180, overflowY: 'auto',
                border: `1px solid ${T.bd}`, borderRadius: 4, background: T.bg,
              }}>
                {filteredMembers.length === 0 ? (
                  <p style={{ padding: 10, fontSize: 12, color: T.t3, margin: 0 }}>Aucun membre trouvé</p>
                ) : filteredMembers.map(m => (
                  <MemberRow
                    key={m.id || m.email}
                    member={m}
                    isAdded={assignee?.email === m.email}
                    onAdd={handleSelectMember} // ✅ handler corrigé
                  />
                ))}
              </div>
            </div>
          )}

        </Section>

        {/* ── Footer ── */}
        <div className="ctm-footer">
          <GhostBtn onClick={handleClose} disabled={loading}>Annuler</GhostBtn>
          <PrimaryBtn loading={loading} disabled={!form.title.trim()}>
            Créer la tâche
          </PrimaryBtn>
        </div>

      </form>
    </Modal>
  );
}