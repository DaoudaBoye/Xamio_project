import React, { useState, useCallback, useEffect } from 'react';
import { useAuth }        from '../../../context/AuthContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { ThemePicker }    from '../../../components/ui/ThemeToggle';
import { Button, Input }  from '../../../components/ui/index';
import { useNotif }       from '../../../context/NotifContext';

/* ─────────────────────────────────────────────
   CONSTANTES
   ───────────────────────────────────────────── */
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
  || 'http://localhost:8000/api';

function authHeaders() {
  const token = localStorage.getItem('xamio_token');
  return {
    'Content-Type':  'application/json',
    'Accept':        'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

const ROLES = ['Admin Entreprise', 'Directeur', 'Manager', 'Assistant', 'Employé'];

const ROLE_ID_MAP = {
  'Admin Entreprise': 2,
  'Manager':          3,
  'Assistant':        4,
  'Employé':          5,
  'Directeur':        6,
};

const SECTIONS = [
  { key: 'profile',       label: 'Profil',            icon: '👤' },
  { key: 'team',          label: 'Équipe',             icon: '🧑‍🤝‍🧑' },
  { key: 'departements',  label: 'Départements',       icon: '🏢' },  // ← nouveau
  { key: 'notifications', label: 'Notifications',      icon: '🔔' },
  { key: 'security',      label: 'Sécurité',           icon: '🔒' },
  { key: 'appearance',    label: 'Apparence',          icon: '🎨' },
  { key: 'plan',          label: 'Plan & facturation', icon: '💳' },
  { key: 'integrations',  label: 'Intégrations',       icon: '🔌' },
];

const EMPTY_FORM     = { prenom: '', nom: '', email: '', role: '', dept: '', password: '', confirmPassword: '' };
const EMPTY_DEPT_FORM = { dept_nom: '', dept_description: '', user_id: '' };
const PER_PAGE       = 10;


/* ─────────────────────────────────────────────
   SEARCHABLE SELECT — liste déroulante avec recherche
   ───────────────────────────────────────────── */
function SearchableSelect({ label, value, onChange, options = [], placeholder = '— Choisir —', disabled = false }) {
  const [open,  setOpen]  = React.useState(false);
  const [query, setQuery] = React.useState('');
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected     = options.find(o => String(o.id) === String(value));
  const displayLabel = selected ? selected.name : placeholder;
  const filtered     = options.filter(o => !query || o.name.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = opt => { onChange(opt ? String(opt.id) : ''); setOpen(false); setQuery(''); };

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
      {label && <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.08em', color: 'var(--color-text-muted)' }}>{label}</label>}

      <button type="button" disabled={disabled} onClick={() => { if (!disabled) { setOpen(o => !o); setQuery(''); } }}
        style={{ width: '100%', height: 41, padding: '0 12px', background: 'var(--color-background-tertiary)', border: `1px solid ${open ? 'var(--color-accent)' : 'var(--color-border)'}`, borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: selected ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontSize: 13, fontFamily: 'var(--font-sans)', opacity: disabled ? 0.6 : 1, transition: 'border-color .15s' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayLabel}</span>
        <span style={{ flexShrink: 0, marginLeft: 8, color: 'var(--color-text-muted)', fontSize: 11, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▼</span>
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 500, background: 'var(--color-background-secondary)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)' }}>
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher…"
              style={{ width: '100%', padding: '7px 10px', background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 7, fontSize: 12, color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
              onBlur={e  => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            <button type="button" onClick={() => handleSelect(null)}
              style={{ width: '100%', padding: '9px 14px', border: 'none', borderBottom: '1px solid var(--color-border)', background: !value ? 'var(--color-accent-bg)' : 'transparent', color: !value ? 'var(--color-accent)' : 'var(--color-text-muted)', fontSize: 12, fontFamily: 'var(--font-sans)', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => { if (value) e.currentTarget.style.background = 'var(--color-background-tertiary)'; }}
              onMouseLeave={e => { if (value) e.currentTarget.style.background = 'transparent'; }}
            >— Aucun manager —</button>
            {filtered.length === 0
              ? <p style={{ padding: '12px 14px', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>Aucun résultat pour « {query} »</p>
              : filtered.map(opt => {
                  const sel = String(opt.id) === String(value);
                  return (
                    <button key={opt.id} type="button" onClick={() => handleSelect(opt)}
                      style={{ width: '100%', padding: '9px 14px', border: 'none', borderBottom: '1px solid var(--color-border)', background: sel ? 'var(--color-accent-bg)' : 'transparent', color: sel ? 'var(--color-accent)' : 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: sel ? 600 : 400 }}
                      onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'var(--color-background-tertiary)'; }}
                      onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span>{opt.name}</span>
                      {sel && <span style={{ fontSize: 11 }}>✓</span>}
                    </button>
                  );
                })
            }
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   COMPOSANTS UTILITAIRES
   ───────────────────────────────────────────── */
function Row({ label, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{sub}</p>}
      </div>
      <div style={{ flexShrink: 0, marginLeft: 16 }}>{right}</div>
    </div>
  );
}

function Toggle({ value, onChange, disabled = false }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: value ? 'var(--color-accent)' : 'var(--color-background-elevated)',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: 'background var(--transition-normal)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{ position: 'absolute', top: 3, left: value ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left var(--transition-normal)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </button>
  );
}

function Select({ label, value, onChange, options, optionKey, optionLabel, optionValue, disabled = false, placeholder = '— Choisir —' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.08em', color: 'var(--color-text-muted)' }}>{label}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)',
          borderRadius: 8, padding: '9px 12px', color: 'var(--color-text-primary)', fontSize: 13,
          outline: 'none', fontFamily: 'var(--font-sans)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'border-color var(--transition-normal)',
        }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = 'var(--color-accent)'; }}
        onBlur={e  => e.target.style.borderColor = 'var(--color-border)'}
      >
        <option value="">{placeholder}</option>
        {/* Support tableau de strings ET tableau d'objets */}
        {options.map(o => {
          if (typeof o === 'string') return <option key={o} value={o}>{o}</option>;
          const k = optionKey   || 'id';
          const l = optionLabel || 'label';
          const v = optionValue || 'id';
          return <option key={o[k]} value={o[v]}>{o[l]}</option>;
        })}
      </select>
    </div>
  );
}

function ReadOnlyBadge() {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
      background: 'var(--color-background-tertiary)', color: 'var(--color-text-muted)',
      border: '1px solid var(--color-border)', letterSpacing: '.04em',
    }}>
      🔒 Lecture seule
    </span>
  );
}

function RoleBadge({ role }) {
  const colors = {
    'Admin Entreprise': { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
    'Directeur':        { bg: '#ede9fe', text: '#7c3aed', border: '#ddd6fe' },
    'Manager':          { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' },
    'Assistant':        { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' },
    'Employé':          { bg: 'var(--color-background-tertiary)', text: 'var(--color-text-secondary)', border: 'var(--color-border)' },
  };
  const c = colors[role] || colors['Employé'];
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: c.bg, color: c.text, border: `1px solid ${c.border}`, letterSpacing: '.04em' }}>
      {role || '—'}
    </span>
  );
}

function StatusDot({ status }) {
  const map    = { actif: '#22c55e', inactif: '#94a3b8', suspendu: '#f59e0b' };
  const labels = { actif: 'Actif', inactif: 'Inactif', suspendu: 'Suspendu' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: map[status] || map.inactif, display: 'inline-block' }} />
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{labels[status] || status}</span>
    </div>
  );
}

function Avatar({ u, size = 32 }) {
  const initials = `${(u.prenom || '')[0] || ''}${(u.nom || '')[0] || ''}`.toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--font-sans)', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION DÉPARTEMENTS — CRUD complet
   Admin seulement
   ───────────────────────────────────────────── */
function DepartementsSection({ addToast, isAdmin }) {
  const [departements,  setDepartements]  = useState([]);
  const [membres,       setMembres]       = useState([]);   // liste des users pour le select manager
  const [loading,       setLoading]       = useState(true);
  const [view,          setView]          = useState('list'); // 'list' | 'create' | 'edit'
  const [form,          setForm]          = useState(EMPTY_DEPT_FORM);
  const [editId,        setEditId]        = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [formErrors,    setFormErrors]    = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  /* ── Chargement des départements ── */
  const fetchDepartements = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/departements`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setDepartements(data.departements || []);
    } catch {
      addToast('Erreur lors du chargement des départements.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  /* ── Chargement des membres pour le select manager ── */
  const fetchMembres = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/membres`, { headers: authHeaders() });
      const data = await res.json();
      if (data.data) setMembres(data.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchDepartements();
    fetchMembres();
  }, [fetchDepartements, fetchMembres]);

  const validate = () => {
    const errs = {};
    if (!form.dept_nom.trim()) errs.dept_nom = 'Le nom est requis.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openCreate = () => {
    setForm(EMPTY_DEPT_FORM);
    setFormErrors({});
    setView('create');
  };

  const openEdit = dept => {
    setForm({
      dept_nom:         dept.dept_nom         || '',
      dept_description: dept.dept_description || '',
      user_id:          dept.user_id          || '',
    });
    setFormErrors({});
    setEditId(dept.dept_id);
    setView('edit');
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const isCreate = view === 'create';
      const url    = isCreate ? `${API_BASE}/departements` : `${API_BASE}/departements/${editId}`;
      const method = isCreate ? 'POST' : 'PUT';
      const body   = {
        dept_nom:         form.dept_nom.trim(),
        dept_description: form.dept_description.trim() || null,
        user_id:          form.user_id || null,
      };

      const res  = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur serveur');

      addToast(isCreate ? `Département "${form.dept_nom}" créé.` : 'Département mis à jour.', 'success');
      await fetchDepartements();
      setView('list');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    try {
      const res = await fetch(`${API_BASE}/departements/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error('Erreur suppression');
      setConfirmDelete(null);
      addToast('Département désactivé.', 'warning');
      await fetchDepartements();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  /* ── Formulaire créer/modifier ── */
  if (view === 'create' || view === 'edit') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setView('list')}
            style={{ background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-secondary)' }}
          >
            ← Retour
          </button>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600 }}>
            {view === 'create' ? 'Créer un département' : 'Modifier le département'}
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 520 }}>
          <div>
            <Input
              label="NOM DU DÉPARTEMENT *"
              value={form.dept_nom}
              onChange={e => setForm(p => ({ ...p, dept_nom: e.target.value }))}
              placeholder="Ex : Finance, Opérations, RH…"
            />
            {formErrors.dept_nom && (
              <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{formErrors.dept_nom}</p>
            )}
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.08em', color: 'var(--color-text-muted)', display: 'block', marginBottom: 5 }}>
              DESCRIPTION
            </label>
            <textarea
              value={form.dept_description}
              onChange={e => setForm(p => ({ ...p, dept_description: e.target.value }))}
              placeholder="Description optionnelle du département…"
              rows={3}
              style={{
                width: '100%', background: 'var(--color-background-tertiary)',
                border: '1px solid var(--color-border)', borderRadius: 8,
                padding: '9px 12px', color: 'var(--color-text-primary)', fontSize: 13,
                outline: 'none', fontFamily: 'var(--font-sans)', resize: 'vertical',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
              onBlur={e  => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>

          {/* ── Manager : affiché différemment selon create ou edit ── */}
          {view === 'create' ? (
            /* Création — pas de manager, explication du flux */
            <div style={{
              padding: '12px 14px',
              background: 'var(--color-accent-bg)',
              border: '1px solid var(--color-accent-border)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
            }}>
              💡 <strong>Le manager sera assigné après.</strong><br />
              Créez d'abord le département, puis créez vos utilisateurs, et revenez modifier ce département pour assigner un manager.
            </div>
          ) : (
            /* Modification — SearchableSelect manager avec recherche intégrée */
            <div>
              <SearchableSelect
                label="MANAGER RESPONSABLE (optionnel)"
                value={form.user_id}
                onChange={v => setForm(p => ({ ...p, user_id: v }))}
                options={membres}
                placeholder={membres.length === 0 ? '— Aucun utilisateur disponible —' : '— Rechercher un manager —'}
                disabled={membres.length === 0}
              />
              {membres.length === 0 && (
                <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  💡 Créez d'abord des utilisateurs dans l'onglet Équipe.
                </p>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
            <Button variant="ghost" onClick={() => setView('list')}>Annuler</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {view === 'create' ? 'Créer le département' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Liste des départements ── */
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600 }}>Départements</h3>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {loading ? 'Chargement…' : `${departements.length} département${departements.length > 1 ? 's' : ''} dans l'organisation`}
          </p>
        </div>
        {isAdmin && (
          <Button variant="primary" size="sm" onClick={openCreate}>
            + Nouveau département
          </Button>
        )}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>Chargement…</p>
      ) : departements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--color-background-tertiary)', borderRadius: 12, border: '1px dashed var(--color-border)' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🏢</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>Aucun département</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 20 }}>
            Créez vos premiers départements pour organiser votre équipe.
          </p>
          {isAdmin && (
            <Button variant="primary" onClick={openCreate}>+ Créer le premier département</Button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {departements.map(dept => {
            const manager = membres.find(m => m.id === dept.user_id);
            return (
              <div
                key={dept.dept_id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px',
                  background: 'var(--color-background-tertiary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  transition: 'border-color var(--transition-normal)',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent-border)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                {/* Icône */}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  🏢
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                    {dept.dept_nom}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {dept.dept_description || 'Aucune description'}
                    {manager ? ` · Manager : ${manager.name}` : ''}
                  </p>
                </div>

                {/* Badge membres */}
                {dept.membres_count !== undefined && (
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'var(--color-background-elevated)', border: '1px solid var(--color-border)', borderRadius: 20, padding: '2px 10px', flexShrink: 0 }}>
                    {dept.membres_count} membre{dept.membres_count > 1 ? 's' : ''}
                  </span>
                )}

                {/* Badge statut */}
                <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: dept.dept_actif ? '#dcfce7' : '#f1f5f9', color: dept.dept_actif ? '#16a34a' : '#94a3b8', border: `1px solid ${dept.dept_actif ? '#bbf7d0' : '#e2e8f0'}`, flexShrink: 0 }}>
                  {dept.dept_actif ? 'Actif' : 'Inactif'}
                </span>

                {/* Actions admin */}
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      title="Modifier"
                      onClick={() => openEdit(dept)}
                      style={{ background: 'var(--color-background-elevated)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '5px 9px', cursor: 'pointer', fontSize: 13, transition: 'all var(--transition-normal)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'inherit'; }}
                    >✏️</button>
                    <button
                      title="Désactiver"
                      onClick={() => setConfirmDelete(dept)}
                      style={{ background: 'var(--color-background-elevated)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '5px 9px', cursor: 'pointer', fontSize: 13, transition: 'all var(--transition-normal)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-background-elevated)'; }}
                    >🗑</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal confirmation désactivation */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '28px 32px', maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Désactiver ce département ?</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
              Le département <strong>{confirmDelete.dept_nom}</strong> sera désactivé. Les réunions et tâches associées ne seront pas supprimées.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Annuler</Button>
              <Button variant="danger" onClick={() => handleDelete(confirmDelete.dept_id)}>Désactiver</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   FORMULAIRE UTILISATEUR (create / edit)
   departements : chargé dynamiquement depuis l'API
   ───────────────────────────────────────────── */
function UserForm({ view, form, setForm, formErrors, saving, onBack, onSave, departements = [] }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{ background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← Retour
        </button>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600 }}>
          {view === 'create' ? 'Ajouter un membre' : 'Modifier le membre'}
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <Input label="PRÉNOM" value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} placeholder="Mamadou" />
          {formErrors.prenom && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{formErrors.prenom}</p>}
        </div>
        <div>
          <Input label="NOM" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="Sow" />
          {formErrors.nom && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{formErrors.nom}</p>}
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Input label="ADRESSE EMAIL" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="mamadou.sow@organisation.io" />
          {formErrors.email && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{formErrors.email}</p>}
        </div>
        <div>
          <Select label="RÔLE" value={form.role} onChange={v => setForm(p => ({ ...p, role: v }))} options={ROLES} />
          {formErrors.role && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{formErrors.role}</p>}
        </div>
        <div>
          <Select
            label="DÉPARTEMENT"
            value={form.dept}
            onChange={v => setForm(p => ({ ...p, dept: v }))}
            options={departements}
            placeholder={departements.length === 0 ? '— Aucun département —' : '— Choisir —'}
            disabled={departements.length === 0}
          />
          {departements.length === 0 && (
            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
              💡 Créez des départements dans l'onglet Départements.
            </p>
          )}
        </div>
      </div>

      <div style={{ padding: '16px', background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 10, marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', color: 'var(--color-text-muted)', marginBottom: 14 }}>
          {view === 'create' ? 'MOT DE PASSE INITIAL' : 'NOUVEAU MOT DE PASSE (optionnel)'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Input label="MOT DE PASSE" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
            {formErrors.password && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{formErrors.password}</p>}
          </div>
          <div>
            <Input label="CONFIRMER" type="password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="••••••••" />
            {formErrors.confirmPassword && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{formErrors.confirmPassword}</p>}
          </div>
        </div>
        {view === 'create' && (
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 10 }}>
            💡 L'utilisateur pourra modifier son mot de passe lors de sa première connexion.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="ghost" onClick={onBack}>Annuler</Button>
        <Button variant="primary" loading={saving} onClick={onSave}>
          {view === 'create' ? 'Ajouter le membre' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION ÉQUIPE
   ───────────────────────────────────────────── */
function TeamSection({ addToast, isAdmin }) {
  const [users,         setUsers]         = useState([]);
  const [departements,  setDepartements]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [view,          setView]          = useState('list');
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [editId,        setEditId]        = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [search,        setSearch]        = useState('');
  const [filterRole,    setFilterRole]    = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formErrors,    setFormErrors]    = useState({});
  const [page,          setPage]          = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/users`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) setUsers(data.data || []);
      else throw new Error(data.message || 'Erreur API');
    } catch {
      addToast('Erreur lors du chargement de l\'équipe.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchDepartements = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/departements`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) setDepartements((data.departements || []).map(d => d.dept_nom));
    } catch {}
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchDepartements();
  }, [fetchUsers, fetchDepartements]);

  useEffect(() => { setPage(1); }, [search, filterRole]);

  const validate = () => {
    const errs = {};
    if (!form.prenom.trim()) errs.prenom = 'Requis';
    if (!form.nom.trim())    errs.nom    = 'Requis';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email invalide';
    if (!form.role)          errs.role   = 'Requis';
    if (view === 'create') {
      if (!form.password || form.password.length < 8) errs.password = '8 caractères minimum';
      if (form.password !== form.confirmPassword)      errs.confirmPassword = 'Ne correspond pas';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openCreate = () => { setForm(EMPTY_FORM); setFormErrors({}); setView('create'); };
  const openEdit   = u  => {
    setForm({ prenom: u.prenom, nom: u.nom, email: u.email, role: u.role || '', dept: u.dept || '', password: '', confirmPassword: '' });
    setFormErrors({});
    setEditId(u.id);
    setView('edit');
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const isCreate = view === 'create';
      const url    = isCreate ? `${API_BASE}/users` : `${API_BASE}/users/${editId}`;
      const method = isCreate ? 'POST' : 'PUT';
      const body   = { prenom: form.prenom, nom: form.nom, email: form.email, role_id: ROLE_ID_MAP[form.role] ?? null };
      if (isCreate) body.password = form.password;

      const res  = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur');

      addToast(isCreate ? `${form.prenom} ${form.nom} ajouté à l'équipe.` : 'Membre mis à jour.', 'success');
      await fetchUsers();
      setView('list');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error('Erreur suppression');
      setConfirmDelete(null);
      addToast('Membre retiré de l\'organisation.', 'warning');
      await fetchUsers();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const toggleStatus = async u => {
    const newStatus = u.status === 'actif' ? 'inactif' : 'actif';
    try {
      const res = await fetch(`${API_BASE}/users/${u.id}/statut`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ app_statut: newStatus }),
      });
      if (!res.ok) throw new Error('Erreur statut');
      addToast(`${u.prenom} ${newStatus === 'actif' ? 'activé' : 'désactivé'}.`, 'info');
      await fetchUsers();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const filtered   = users.filter(u => {
    const q = search.toLowerCase();
    return (!q || `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(q))
        && (!filterRole || u.role === filterRole);
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if ((view === 'create' || view === 'edit') && isAdmin) {
    return (
      <UserForm
        view={view} form={form} setForm={setForm}
        formErrors={formErrors} saving={saving}
        departements={departements}
        onBack={() => setView('list')} onSave={handleSave}
      />
    );
  }

  if (!isAdmin) {
    const q       = search.toLowerCase();
    const visible = users.filter(u =>
      !q || `${u.prenom} ${u.nom} ${u.email} ${u.role}`.toLowerCase().includes(q)
    );
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600 }}>Équipe</h3>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {loading ? 'Chargement…' : `${users.length} membre${users.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un collègue…"
          style={{ width: '100%', marginBottom: 16, background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', color: 'var(--color-text-primary)', fontSize: 12, outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
        />
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>Chargement…</p>
        ) : visible.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>Aucun membre trouvé.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {visible.map(u => (
              <div key={u.id} style={{ padding: '16px', background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
                <Avatar u={u} size={44} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{u.prenom} {u.nom}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{u.dept || '—'}</p>
                </div>
                <RoleBadge role={u.role} />
                <a href={`mailto:${u.email}`} style={{ fontSize: 11, color: 'var(--color-accent)', textDecoration: 'none' }}>{u.email}</a>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600 }}>Équipe</h3>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {loading ? 'Chargement…' : `${users.length} membre${users.length > 1 ? 's' : ''} dans l'organisation`}
          </p>
        </div>
        <Button variant="primary" size="sm" icon="plus" onClick={openCreate}>
          Ajouter un membre
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher…"
          style={{ flex: 1, minWidth: 180, background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', color: 'var(--color-text-primary)', fontSize: 12, outline: 'none', fontFamily: 'var(--font-sans)' }}
        />
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          style={{ background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', color: 'var(--color-text-primary)', fontSize: 12, outline: 'none', fontFamily: 'var(--font-sans)', cursor: 'pointer' }}
        >
          <option value="">Tous les rôles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>Aucun membre trouvé.</p>
      ) : (
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', gap: 12, padding: '9px 16px', background: 'var(--color-background-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
            {['Membre', 'Email', 'Rôle', 'Statut', 'Actions'].map(h => (
              <p key={h} style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.08em', color: 'var(--color-text-muted)' }}>{h}</p>
            ))}
          </div>
          {paginated.map((u, i) => (
            <div
              key={u.id}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', gap: 12, padding: '12px 16px', borderBottom: i < paginated.length - 1 ? '1px solid var(--color-border)' : 'none', alignItems: 'center', transition: 'background var(--transition-normal)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <Avatar u={u} size={32} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.prenom} {u.nom}</p>
                  <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{u.dept || '—'}</p>
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
              <RoleBadge role={u.role} />
              <StatusDot status={u.status} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button title="Modifier" onClick={() => openEdit(u)}
                  style={{ background: 'var(--color-background-elevated)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '5px 9px', cursor: 'pointer', fontSize: 13 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'inherit'; }}
                >✏️</button>
                <button title={u.status === 'actif' ? 'Désactiver' : 'Activer'} onClick={() => toggleStatus(u)}
                  style={{ background: 'var(--color-background-elevated)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '5px 9px', cursor: 'pointer', fontSize: 13 }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                >{u.status === 'actif' ? '⏸' : '▶️'}</button>
                <button title="Retirer" onClick={() => setConfirmDelete(u)}
                  style={{ background: 'var(--color-background-elevated)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '5px 9px', cursor: 'pointer', fontSize: 13 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-background-elevated)'; }}
                >🗑</button>
              </div>
            </div>
          ))}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--color-border)', background: 'var(--color-background-tertiary)' }}>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} sur {filtered.length}
              </p>
              <div style={{ display: 'flex', gap: 4 }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ background: 'var(--color-background-elevated)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '5px 10px', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12, opacity: page === 1 ? 0.4 : 1, fontFamily: 'var(--font-sans)' }}>← Préc.</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setPage(n)} style={{ background: n === page ? 'var(--color-accent)' : 'var(--color-background-elevated)', border: `1px solid ${n === page ? 'var(--color-accent)' : 'var(--color-border)'}`, borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: n === page ? 'white' : 'var(--color-text-primary)', fontWeight: n === page ? 600 : 400, minWidth: 32, fontFamily: 'var(--font-sans)' }}>{n}</button>
                ))}
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ background: 'var(--color-background-elevated)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '5px 10px', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 12, opacity: page === totalPages ? 0.4 : 1, fontFamily: 'var(--font-sans)' }}>Suiv. →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '28px 32px', maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Retirer ce membre ?</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
              <strong>{confirmDelete.prenom} {confirmDelete.nom}</strong> sera retiré de l'organisation. Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Annuler</Button>
              <Button variant="danger" onClick={() => handleDelete(confirmDelete.id)}>Retirer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGE PRINCIPALE
   ───────────────────────────────────────────── */
export default function SettingsPage() {
  const { user }                         = useAuth();
  const { addToast }                     = useNotif();
  const { isAdmin, peutGererParametres } = usePermissions();

  const [activeSection, setActiveSection] = useState('profile');
  const [profile,       setProfile]       = useState({ name: user?.name || '', email: user?.email || '', role: user?.role || '', phone: '' });
  const [notifSettings, setNotifSettings] = useState({ email: true, sms: false, push: true, remind24h: true, remind1h: true, digest: false });
  const [security,      setSecurity]      = useState({ twofa: false, sessions: true });
  const [saving,        setSaving]        = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    addToast('Paramètres enregistrés.', 'success');
  };

  return (
    <div className="animate-enter">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 600, letterSpacing: '-.01em' }}>Paramètres</h2>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>Gérez votre compte et vos préférences</p>
      </div>

      <div className="resp-settings-grid" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Sidebar navigation */}
        <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 8, position: 'sticky', top: 80 }}>
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, transition: 'all var(--transition-normal)', textAlign: 'left', background: activeSection === s.key ? 'var(--color-accent-bg)' : 'transparent', color: activeSection === s.key ? 'var(--color-accent)' : 'var(--color-text-secondary)', fontWeight: activeSection === s.key ? 600 : 400, borderLeft: `2px solid ${activeSection === s.key ? 'var(--color-accent)' : 'transparent'}`, marginBottom: 2 }}
              onMouseEnter={e => { if (activeSection !== s.key) { e.currentTarget.style.background = 'var(--color-background-tertiary)'; e.currentTarget.style.color = 'var(--color-text-primary)'; } }}
              onMouseLeave={e => { if (activeSection !== s.key) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; } }}
            >
              <span style={{ fontSize: 14 }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Contenu principal */}
        <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '24px 28px' }}>

          {activeSection === 'team'         && <TeamSection         addToast={addToast} isAdmin={isAdmin} />}
          {activeSection === 'departements' && <DepartementsSection addToast={addToast} isAdmin={isAdmin} />}

          {activeSection === 'profile' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, marginBottom: 24 }}>Profil utilisateur</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--color-accent-bg)', border: '2px solid var(--color-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--font-sans)' }}>
                  {user?.initials}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{user?.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{user?.role} · Plan {user?.plan}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => addToast('Upload photo (démo)', 'info')} style={{ marginLeft: 'auto' }}>
                  Changer la photo
                </Button>
              </div>
              <div className="resp-form-2col" style={{ marginBottom: 20 }}>
                <Input label="NOM COMPLET"  value={profile.name}  onChange={e => setProfile(p => ({ ...p, name:  e.target.value }))} placeholder="Votre nom" />
                <Input label="EMAIL" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="vous@exemple.com" />
                <Input label="RÔLE" value={profile.role} onChange={e => setProfile(p => ({ ...p, role: e.target.value }))} placeholder="Admin, Manager…" />
                <Input label="TÉLÉPHONE" type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+221 XX XXX XX XX" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" loading={saving} onClick={save}>Enregistrer</Button>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, marginBottom: 24 }}>Préférences de notifications</h3>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '.08em', fontWeight: 600, marginBottom: 4 }}>CANAUX</p>
              <Row label="Notifications email"         sub="Invitations, résumés, alertes"          right={<Toggle value={notifSettings.email}    onChange={v => setNotifSettings(s => ({ ...s, email:    v }))} />} />
              <Row label="Notifications SMS"           sub="Rappels urgents via Twilio"             right={<Toggle value={notifSettings.sms}      onChange={v => setNotifSettings(s => ({ ...s, sms:      v }))} />} />
              <Row label="Notifications push (in-app)" sub="Alertes temps réel dans le navigateur" right={<Toggle value={notifSettings.push}     onChange={v => setNotifSettings(s => ({ ...s, push:     v }))} />} />
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '.08em', fontWeight: 600, marginTop: 20, marginBottom: 4 }}>RAPPELS</p>
              <Row label="Rappel 24h avant"  sub="Événements, réunions, rendez-vous" right={<Toggle value={notifSettings.remind24h} onChange={v => setNotifSettings(s => ({ ...s, remind24h: v }))} />} />
              <Row label="Rappel 1h avant"   sub="Événements, réunions, rendez-vous" right={<Toggle value={notifSettings.remind1h}  onChange={v => setNotifSettings(s => ({ ...s, remind1h:  v }))} />} />
              <Row label="Digest quotidien"  sub="Résumé de l'activité chaque matin" right={<Toggle value={notifSettings.digest}    onChange={v => setNotifSettings(s => ({ ...s, digest:    v }))} />} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <Button variant="primary" loading={saving} onClick={save}>Enregistrer</Button>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, marginBottom: 24 }}>Sécurité du compte</h3>
              <Row label="Double authentification (2FA)" sub="TOTP via application d'authentification"
                right={<Toggle value={security.twofa} onChange={v => { setSecurity(s => ({ ...s, twofa: v })); addToast(v ? '2FA activé.' : '2FA désactivé.', v ? 'success' : 'warning'); }} />} />
              <Row label="Déconnexion des autres sessions" sub="Invalider tous les tokens actifs"
                right={<Button variant="danger" size="sm" onClick={() => addToast('Toutes les sessions ont été fermées.', 'success')}>Déconnecter</Button>} />
              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '.08em', fontWeight: 600, marginBottom: 16 }}>CHANGER LE MOT DE PASSE</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Input label="MOT DE PASSE ACTUEL"  type="password" placeholder="••••••••" />
                  <Input label="NOUVEAU MOT DE PASSE" type="password" placeholder="••••••••" />
                  <Input label="CONFIRMER"             type="password" placeholder="••••••••" />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="primary" loading={saving} onClick={save}>Mettre à jour</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, marginBottom: 24 }}>Apparence</h3>
              <Row label="Thème de l'interface"      sub="Sombre ou clair selon vos préférences" right={<ThemePicker />} />
              <Row label="Langue de l'interface"     sub="Langue d'affichage de XAMIO" right={
                <select style={{ background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '6px 12px', color: 'var(--color-text-primary)', fontSize: 12, outline: 'none', fontFamily: 'var(--font-sans)' }}>
                  <option>Français</option><option>English</option><option>Wolof</option>
                </select>
              } />
              <Row label="Format de date" sub="DD/MM/YYYY ou MM/DD/YYYY" right={
                <select style={{ background: 'var(--color-background-tertiary)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '6px 12px', color: 'var(--color-text-primary)', fontSize: 12, outline: 'none', fontFamily: 'var(--font-sans)' }}>
                  <option>JJ/MM/AAAA</option><option>MM/JJ/AAAA</option>
                </select>
              } />
              <Row label="Sidebar réduite par défaut" sub="Démarrer avec le menu latéral compact"
                right={<Toggle value={false} onChange={() => addToast('Préférence sauvegardée.', 'success')} />} />
            </div>
          )}

          {activeSection === 'plan' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600 }}>Plan & facturation</h3>
                {!peutGererParametres && <ReadOnlyBadge />}
              </div>
              <div style={{ padding: '18px 20px', background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)', borderRadius: 12, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '.08em', marginBottom: 4 }}>PLAN ACTUEL</p>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 600, color: 'var(--color-accent)' }}>Pro</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>5 utilisateurs · 2 500 FCFA / user / mois</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '.06em', marginBottom: 4 }}>PROCHAIN RENOUVELLEMENT</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500 }}>01/04/2025</p>
                  </div>
                </div>
              </div>
              <div className="resp-grid-3" style={{ gap: 14 }}>
                {[
                  { name: 'Gratuit',    price: '0',     unit: 'FCFA/mois',      features: ['Réunions basiques', 'Tâches', '1 Go stockage'] },
                  { name: 'Pro',        price: '2 500', unit: 'FCFA/user/mois', features: ['Tout Gratuit', 'Ateliers & Docs', 'SMS & Push', 'Dashboard avancé'], current: true },
                  { name: 'Entreprise', price: 'Devis', unit: 'Illimité',       features: ['Tout Pro', 'Module IA complet', 'API publique', 'SLA garanti'] },
                ].map(p => (
                  <div key={p.name} style={{ padding: '16px', background: p.current ? 'var(--color-accent-bg)' : 'var(--color-background-tertiary)', border: `1px solid ${p.current ? 'var(--color-accent-border)' : 'var(--color-border)'}`, borderRadius: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: p.current ? 'var(--color-accent)' : 'var(--color-text-primary)', marginBottom: 6 }}>{p.name}</p>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 600, marginBottom: 2 }}>{p.price}</p>
                    <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 12 }}>{p.unit}</p>
                    {p.features.map(f => <p key={f} style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 3 }}>· {f}</p>)}
                    {!p.current && peutGererParametres && (
                      <Button variant={p.name === 'Entreprise' ? 'ghost' : 'primary'} size="sm" style={{ marginTop: 12, width: '100%' }} onClick={() => addToast(`Redirection vers ${p.name}…`, 'info')}>
                        {p.name === 'Entreprise' ? 'Nous contacter' : 'Passer à Pro'}
                      </Button>
                    )}
                    {p.current && <p style={{ fontSize: 10, color: 'var(--color-accent)', marginTop: 12, fontWeight: 600 }}>✓ Plan actuel</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'integrations' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600 }}>Intégrations</h3>
                {!peutGererParametres && <ReadOnlyBadge />}
              </div>
              {[
                { name: 'Google Calendar', desc: 'Synchroniser votre calendrier Google avec XAMIO',   icon: '📅', connected: true  },
                { name: 'Slack',           desc: 'Recevoir les notifications dans vos channels Slack', icon: '💬', connected: false },
                { name: 'Microsoft Teams', desc: 'Intégration Teams pour les réunions en ligne',       icon: '🤝', connected: false },
                { name: 'Twilio SMS',      desc: 'Envoi de rappels et alertes par SMS',                icon: '📱', connected: true  },
                { name: 'API Publique',    desc: "Accès développeur via l'API REST XAMIO",             icon: '🔌', connected: false, badge: 'Entreprise' },
              ].map(intg => (
                <div key={intg.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{intg.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>{intg.name}</p>
                      {intg.badge && <span style={{ fontSize: 9, background: 'var(--color-accent-bg)', color: 'var(--color-accent)', border: '1px solid var(--color-accent-border)', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>{intg.badge}</span>}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{intg.desc}</p>
                  </div>
                  {peutGererParametres ? (
                    <Button variant={intg.connected ? 'ghost' : 'secondary'} size="sm" onClick={() => addToast(intg.connected ? `${intg.name} déconnecté.` : `${intg.name} connecté !`, intg.connected ? 'warning' : 'success')}>
                      {intg.connected ? 'Déconnecter' : 'Connecter'}
                    </Button>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      {intg.connected ? '✓ Connecté' : '— Non connecté'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}