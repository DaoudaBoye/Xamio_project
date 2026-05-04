import React, { useState, useCallback, useEffect } from 'react';
import { Button, Input } from '../../../components/ui/index';

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

const EMPTY_DEPT_FORM = { dept_nom: '', dept_description: '', dept_manager: '' };

/* ─────────────────────────────────────────────
   FORMULAIRE DÉPARTEMENT (create / edit)
   ───────────────────────────────────────────── */
function DeptForm({ view, form, setForm, formErrors, saving, managers, onBack, onSave }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            background: 'var(--color-background-tertiary)',
            border: '1px solid var(--color-border)',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            fontSize: 12, color: 'var(--color-text-secondary)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ← Retour
        </button>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600 }}>
          {view === 'create' ? 'Créer un département' : 'Modifier le département'}
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        <div>
          <Input
            label="NOM DU DÉPARTEMENT"
            value={form.dept_nom}
            onChange={e => setForm(p => ({ ...p, dept_nom: e.target.value }))}
            placeholder="Ex : Ressources Humaines, Finance, Marketing…"
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
            placeholder="Décrivez les responsabilités de ce département…"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--color-background-tertiary)',
              border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '9px 12px',
              color: 'var(--color-text-primary)', fontSize: 13,
              outline: 'none', fontFamily: 'var(--font-sans)',
              resize: 'vertical', lineHeight: 1.5,
              transition: 'border-color var(--transition-normal)',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--color-accent)'; }}
            onBlur={e  => { e.target.style.borderColor = 'var(--color-border)'; }}
          />
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.08em', color: 'var(--color-text-muted)', display: 'block', marginBottom: 5 }}>
            MANAGER RESPONSABLE (optionnel)
          </label>
          <select
            value={form.dept_manager}
            onChange={e => setForm(p => ({ ...p, dept_manager: e.target.value }))}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--color-background-tertiary)',
              border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '9px 12px',
              color: form.dept_manager ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              fontSize: 13, outline: 'none',
              fontFamily: 'var(--font-sans)', cursor: 'pointer',
              transition: 'border-color var(--transition-normal)',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--color-accent)'; }}
            onBlur={e  => { e.target.style.borderColor = 'var(--color-border)'; }}
          >
            <option value="">— Aucun manager assigné —</option>
            {managers.map(m => (
              <option key={m.id} value={m.id}>
                {m.util_prenom} {m.util_nom} · {m.role}
              </option>
            ))}
          </select>
          <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
            💡 Seuls les Managers et Directeurs sont listés.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="ghost" onClick={onBack}>Annuler</Button>
        <Button variant="primary" loading={saving} onClick={onSave}>
          {view === 'create' ? 'Créer le département' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION DÉPARTEMENTS
   Admin    → CRUD complet
   Autres   → lecture seule
   ───────────────────────────────────────────── */
export function DepartementsSection({ addToast, isAdmin }) {
  const [departements,  setDepartements]  = useState([]);
  const [managers,      setManagers]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [view,          setView]          = useState('list'); // 'list' | 'create' | 'edit'
  const [form,          setForm]          = useState(EMPTY_DEPT_FORM);
  const [editId,        setEditId]        = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [formErrors,    setFormErrors]    = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search,        setSearch]        = useState('');

  /* ── Chargement des départements ── */
  const fetchDepartements = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/departements`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) setDepartements(data.departements || []);
      else throw new Error(data.message || 'Erreur API');
    } catch {
      addToast('Erreur lors du chargement des départements.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  /* ── Chargement des managers pour le select ── */
  const fetchManagers = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/users`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        const eligibles = (data.data || []).filter(u =>
          ['Manager', 'Directeur', 'Admin Entreprise'].includes(u.role)
        );
        setManagers(eligibles);
      }
    } catch {
      // Silencieux
    }
  }, []);

  useEffect(() => {
    fetchDepartements();
    if (isAdmin) fetchManagers();
  }, [fetchDepartements, fetchManagers, isAdmin]);

  /* ── Validation ── */
  const validate = () => {
    const errs = {};
    if (!form.dept_nom.trim()) errs.dept_nom = 'Le nom est requis';
    if (form.dept_nom.trim().length > 60) errs.dept_nom = '60 caractères maximum';
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
      dept_nom:         dept.dept_nom || '',
      dept_description: dept.dept_description || '',
      // L'API retourne manager comme objet imbriqué { id, util_prenom, util_nom }
      dept_manager:     dept.manager?.id ? String(dept.manager.id) : '',
    });
    setFormErrors({});
    setEditId(dept.dept_id);   // ← clé primaire du modèle Departement
    setView('edit');
  };

  /* ── Sauvegarde ── */
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const isCreate = view === 'create';
      const url    = isCreate ? `${API_BASE}/departements` : `${API_BASE}/departements/${editId}`;
      const method = isCreate ? 'POST' : 'PUT';
      const body   = {
        dept_nom:         form.dept_nom.trim(),
        dept_description: form.dept_description.trim(),
        // Le controller attend "user_id" pour le manager (cf. store/update validation)
        ...(form.dept_manager ? { user_id: Number(form.dept_manager) } : {}),
      };

      const res  = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur');

      addToast(
        isCreate ? `Département "${form.dept_nom}" créé.` : 'Département mis à jour.',
        'success'
      );
      await fetchDepartements();
      setView('list');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Suppression ── */
  const handleDelete = async id => {
    try {
      const res = await fetch(`${API_BASE}/departements/${id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Erreur suppression');
      setConfirmDelete(null);
      addToast('Département supprimé.', 'warning');
      await fetchDepartements();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  /* ── Filtrage ── */
  const filtered = departements.filter(d => {
    const q = search.toLowerCase();
    return !q || d.dept_nom?.toLowerCase().includes(q) || d.dept_description?.toLowerCase().includes(q);
  });

  /* ── Vue formulaire ── */
  if ((view === 'create' || view === 'edit') && isAdmin) {
    return (
      <DeptForm
        view={view}
        form={form}
        setForm={setForm}
        formErrors={formErrors}
        saving={saving}
        managers={managers}
        onBack={() => setView('list')}
        onSave={handleSave}
      />
    );
  }

  /* ── Vue lecture seule (non-admin) ── */
  if (!isAdmin) {
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600 }}>Départements</h3>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {loading ? 'Chargement…' : `${departements.length} département${departements.length > 1 ? 's' : ''} dans l'organisation`}
          </p>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>Chargement…</p>
        ) : departements.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {departements.map(d => <DeptCard key={d.dept_id} dept={d} />)}
          </div>
        )}
      </div>
    );
  }

  /* ── Vue admin (liste + actions) ── */
  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600 }}>Départements</h3>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {loading ? 'Chargement…' : `${departements.length} département${departements.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <Button variant="primary" size="sm" icon="plus" onClick={openCreate}>
          Nouveau département
        </Button>
      </div>

      {/* Recherche */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher un département…"
        style={{
          width: '100%', boxSizing: 'border-box', marginBottom: 16,
          background: 'var(--color-background-tertiary)',
          border: '1px solid var(--color-border)',
          borderRadius: 8, padding: '8px 12px',
          color: 'var(--color-text-primary)', fontSize: 12,
          outline: 'none', fontFamily: 'var(--font-sans)',
        }}
      />

      {/* Contenu */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>Chargement…</p>
      ) : filtered.length === 0 && search ? (
        <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>Aucun résultat pour « {search} ».</p>
      ) : departements.length === 0 ? (
        <EmptyState onAdd={openCreate} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(dept => (
            <DeptRow
              key={dept.dept_id}
              dept={dept}
              onEdit={() => openEdit(dept)}
              onDelete={() => setConfirmDelete(dept)}
            />
          ))}
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--color-background-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 14, padding: '28px 32px',
            maxWidth: 400, width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Supprimer ce département ?</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Le département <strong>« {confirmDelete.dept_nom} »</strong> sera définitivement supprimé.
            </p>
            <p style={{ fontSize: 12, color: '#f59e0b', marginBottom: 24, padding: '8px 12px', background: '#fef3c720', border: '1px solid #fde68a40', borderRadius: 8 }}>
              ⚠️ Les membres assignés à ce département ne seront pas supprimés, mais leur département sera réinitialisé.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Annuler</Button>
              <Button variant="danger" onClick={() => handleDelete(confirmDelete.dept_id)}>Supprimer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SOUS-COMPOSANTS
   ───────────────────────────────────────────── */

/** Ligne admin avec actions */
function DeptRow({ dept, onEdit, onDelete }) {
  const memberCount = dept.membres_count ?? dept.users_count ?? 0;

  return (
    <div
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
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: 'var(--color-accent-bg)',
        border: '1px solid var(--color-accent-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>
        🏢
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{dept.dept_nom}</p>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {dept.dept_description || 'Aucune description'}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        {dept.manager && (
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '.06em', marginBottom: 2 }}>MANAGER</p>
            <p style={{ fontSize: 11, fontWeight: 500 }}>{dept.manager.util_prenom} {dept.manager.util_nom}</p>
          </div>
        )}
        <div style={{
          padding: '4px 10px', borderRadius: 20,
          background: 'var(--color-background-elevated)',
          border: '1px solid var(--color-border)',
          fontSize: 11, fontWeight: 600,
          color: 'var(--color-text-secondary)',
          whiteSpace: 'nowrap',
        }}>
          {memberCount} membre{memberCount > 1 ? 's' : ''}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          title="Modifier"
          onClick={onEdit}
          style={{
            background: 'var(--color-background-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 7, padding: '5px 9px',
            cursor: 'pointer', fontSize: 13,
            transition: 'all var(--transition-normal)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'inherit'; }}
        >✏️</button>
        <button
          title="Supprimer"
          onClick={onDelete}
          style={{
            background: 'var(--color-background-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 7, padding: '5px 9px',
            cursor: 'pointer', fontSize: 13,
            transition: 'all var(--transition-normal)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-background-elevated)'; }}
        >🗑</button>
      </div>
    </div>
  );
}

/** Carte lecture seule */
function DeptCard({ dept }) {
  const memberCount = dept.membres_count ?? dept.users_count ?? 0;
  return (
    <div style={{
      padding: '16px', borderRadius: 10, textAlign: 'center',
      background: 'var(--color-background-tertiary)',
      border: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'var(--color-accent-bg)',
        border: '1px solid var(--color-accent-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>🏢</div>
      <p style={{ fontSize: 13, fontWeight: 600 }}>{dept.dept_nom}</p>
      {dept.dept_description && (
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{dept.dept_description}</p>
      )}
      {dept.manager && (
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>👤 {dept.manager.util_prenom} {dept.manager.util_nom}</p>
      )}
      <span style={{
        fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
        background: 'var(--color-background-elevated)', border: '1px solid var(--color-border)',
        color: 'var(--color-text-muted)',
      }}>
        {memberCount} membre{memberCount > 1 ? 's' : ''}
      </span>
    </div>
  );
}

/** État vide */
function EmptyState({ onAdd }) {
  return (
    <div style={{
      textAlign: 'center', padding: '48px 24px',
      border: '2px dashed var(--color-border)', borderRadius: 12,
    }}>
      <p style={{ fontSize: 32, marginBottom: 12 }}>🏢</p>
      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Aucun département créé</p>
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 20, maxWidth: 280, margin: '0 auto 20px' }}>
        Les départements permettent d'organiser vos équipes et d'assigner des membres à des entités spécifiques.
      </p>
      {onAdd && (
        <Button variant="primary" size="sm" onClick={onAdd}>
          Créer le premier département
        </Button>
      )}
    </div>
  );
}