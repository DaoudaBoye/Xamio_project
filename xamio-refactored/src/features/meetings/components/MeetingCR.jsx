/**
 * MeetingCR.jsx — Xamio v6
 * Thème : bleu #1E6FE8 + orange #F05A28 (couleurs logo Xamio)
 *
 * Props :
 *   meeting          — objet réunion
 *   onSaved          — callback après enregistrement
 *   hasExistingFile  — true si un fichier a déjà été importé
 *                      → masque le champ de notes (textarea)
 *                      → seule l'analyse IA est proposée (pour extraire tâches/décisions)
 *                      → l'onglet "Résumé" est masqué dans les résultats
 *                      → la sauvegarde conserve has_file: true sans écraser le fichier source
 *
 * Deux chemins quand hasExistingFile = false (création) :
 *   Chemin 1 — Analyse IA   : texte extrait → Claude → résumé/décisions/tâches → enregistrer
 *   Chemin 2 — Import direct : fichier uploadé tel quel vers S3 → onSaved() immédiat
 *
 * Quand hasExistingFile = true (mise à jour d'un CR importé) :
 *   → Pas de textarea — l'utilisateur importe un document à analyser
 *   → Seules les tâches et décisions sont extraites (pas de résumé)
 *   → La sauvegarde envoie decisions/tasks mais préserve le fichier S3 existant
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as mammoth from 'mammoth';

const getToken = () => localStorage.getItem('xamio_token');

/* ═══════════════════════════════════════════
   STYLES GLOBAUX
═══════════════════════════════════════════ */
function useStyles() {
  useEffect(() => {
    const id = 'mcr4-styles';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      @keyframes mcr4-up   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
      @keyframes mcr4-spin { to{transform:rotate(360deg)} }
      @keyframes mcr4-pulse{ 0%,100%{opacity:1} 50%{opacity:.4} }

      .mcr4-up    { animation: mcr4-up .28s cubic-bezier(.22,1,.36,1) both }
      .mcr4-spin  { animation: mcr4-spin .75s linear infinite }
      .mcr4-skel  { animation: mcr4-pulse 1.4s ease-in-out infinite }

      .mcr4-textarea {
        width: 100%;
        border: 2px solid #CBD5E1;
        border-radius: 8px;
        padding: 13px 15px;
        font-size: 14px;
        color: #1A1F36;
        background: #fff;
        font-family: 'Segoe UI', Arial, sans-serif;
        resize: vertical;
        outline: none;
        line-height: 1.75;
        box-sizing: border-box;
        transition: border-color .18s, box-shadow .18s;
        min-height: 130px;
      }
      .mcr4-textarea:focus {
        border-color: #1E6FE8;
        box-shadow: 0 0 0 3px rgba(30,111,232,.12);
      }
      .mcr4-textarea::placeholder { color: #9CA3AF; }

      .mcr4-btn-primary {
        width: 100%;
        padding: 13px 18px;
        border-radius: 8px;
        border: none;
        background: #1E6FE8;
        color: #fff;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        font-family: 'Segoe UI', Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        transition: background .15s, transform .1s;
        letter-spacing: .01em;
      }
      .mcr4-btn-primary:hover:not(:disabled) { background: #1658C0; }
      .mcr4-btn-primary:active:not(:disabled) { transform: scale(.99); }
      .mcr4-btn-primary:disabled {
        background: #E5E7EB;
        color: #9CA3AF;
        cursor: not-allowed;
      }

      .mcr4-btn-import {
        width: 100%;
        padding: 13px 18px;
        border-radius: 8px;
        border: none;
        background: #0F6E56;
        color: #fff;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        font-family: 'Segoe UI', Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        transition: background .15s, transform .1s;
        letter-spacing: .01em;
      }
      .mcr4-btn-import:hover:not(:disabled) { background: #085041; }
      .mcr4-btn-import:active:not(:disabled) { transform: scale(.99); }
      .mcr4-btn-import:disabled {
        background: #E5E7EB;
        color: #9CA3AF;
        cursor: not-allowed;
      }

      .mcr4-btn-save {
        flex: 1;
        padding: 12px 18px;
        border-radius: 8px;
        border: none;
        background: #1E6FE8;
        color: #fff;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        font-family: 'Segoe UI', Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: background .15s;
      }
      .mcr4-btn-save:hover:not(:disabled) { background: #1658C0; }
      .mcr4-btn-save:disabled { background: #E5E7EB; color: #9CA3AF; cursor: not-allowed; }

      .mcr4-btn-ghost {
        width: 100%;
        padding: 12px 18px;
        border-radius: 8px;
        border: 2px solid #CBD5E1;
        background: #fff;
        color: #374151;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        font-family: 'Segoe UI', Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all .13s;
      }
      .mcr4-btn-ghost:hover:not(:disabled) { border-color: #9CA3AF; background: #F9FAFB; }
      .mcr4-btn-ghost:disabled { opacity: .5; cursor: not-allowed; }

      .mcr4-btn-ghost-sm {
        padding: 12px 18px;
        border-radius: 8px;
        border: 2px solid #CBD5E1;
        background: #fff;
        color: #374151;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        font-family: 'Segoe UI', Arial, sans-serif;
        transition: all .13s;
      }
      .mcr4-btn-ghost-sm:hover { border-color: #9CA3AF; background: #F9FAFB; }

      .mcr4-import-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 13px;
        color: #1E6FE8;
        font-family: 'Segoe UI', Arial, sans-serif;
        font-weight: 600;
        text-decoration: underline;
        text-underline-offset: 3px;
        padding: 0;
        transition: color .13s;
      }
      .mcr4-import-btn:hover { color: #1658C0; }

      .mcr4-tab {
        flex: 1;
        padding: 10px 12px;
        border: none;
        background: none;
        cursor: pointer;
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 13px;
        font-weight: 600;
        color: #6B7280;
        border-bottom: 3px solid transparent;
        transition: all .14s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        white-space: nowrap;
      }
      .mcr4-tab.active {
        color: #1E6FE8;
        border-bottom-color: #1E6FE8;
        background: #fff;
      }
      .mcr4-tab:hover:not(.active) { color: #374151; background: #F3F4F6; }

      .mcr4-decision-row {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        padding: 11px 0;
        border-bottom: 1.5px solid #F3F4F6;
      }
      .mcr4-decision-row:last-child { border-bottom: none; }

      .mcr4-task-card {
        background: #F9FAFB;
        border: 1.5px solid #E5E7EB;
        border-radius: 8px;
        padding: 12px 14px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: border-color .13s;
      }
      .mcr4-task-card:last-child { margin-bottom: 0; }
      .mcr4-task-card:hover { border-color: #CBD5E1; }

      .mcr4-file-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: 8px;
        background: #EFF6FF;
        border: 1.5px solid #BFDBFE;
      }

      .mcr4-separator {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #9CA3AF;
        font-size: 12px;
        margin: 4px 0;
      }
      .mcr4-separator::before,
      .mcr4-separator::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #E5E7EB;
      }

      /* Zone de drop pour fichier (hasExistingFile) */
      .mcr4-drop-zone {
        border: 2px dashed #BFDBFE;
        border-radius: 10px;
        padding: 24px 20px;
        text-align: center;
        background: #EFF6FF;
        cursor: pointer;
        transition: border-color .15s, background .15s;
      }
      .mcr4-drop-zone:hover {
        border-color: #1E6FE8;
        background: #DBEAFE;
      }
    `;
    document.head.appendChild(s);
  }, []);
}

/* ═══════════════════════════════════════════
   COULEURS XAMIO
═══════════════════════════════════════════ */
const X = {
  blue:     '#1E6FE8',
  blueDk:   '#1658C0',
  blueLt:   '#EFF6FF',
  blueBd:   '#BFDBFE',
  green:    '#0F6E56',
  greenDk:  '#085041',
  greenLt:  '#ECFDF5',
  greenBd:  '#6EE7B7',
  orange:   '#F05A28',
  orangeLt: '#FFF4EE',
  orangeBd: '#FDBA8C',
  red:      '#DC2626',
  redLt:    '#FEF2F2',
  redBd:    '#FECACA',
  t1:       '#1A1F36',
  t2:       '#374151',
  t3:       '#6B7280',
  t4:       '#9CA3AF',
  bg:       '#F0F2F5',
  bg2:      '#F9FAFB',
  bd:       '#E5E7EB',
  bdm:      '#CBD5E1',
  r6:       '6px',
  r8:       '8px',
  r10:      '10px',
};

/* ═══════════════════════════════════════════
   ICÔNES
═══════════════════════════════════════════ */
const Ic = {
  sparkle: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M9 1L3 9h5l-1 6 6-8H8l1-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  save: () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M3 14V4l3-2h5l2 2v10H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M6 14V9h4v5M6 2v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  check: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  upload: () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M3 11v2h10v-2M8 3v7M5.5 5.5L8 3l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  doc: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h6l3 3v9H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M10 2v3h3M6 8h5M6 11h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  close: () => (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  spin: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mcr4-spin">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.8" strokeDasharray="22 16" strokeLinecap="round"/>
    </svg>
  ),
  task: () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M5 8l2.5 2.5L11 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  user: () => (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  cal: () => (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

/* ═══════════════════════════════════════════
   APPEL API — GÉNÉRATION IA
═══════════════════════════════════════════ */
async function callClaude(notes, meetingId) {
  const response = await fetch(
    `/api/reunions/${meetingId}/compte-rendu/generer`,
    {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${getToken()}`,
        'Accept':        'application/json',
      },
      body: JSON.stringify({ notes }),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Erreur serveur');
  }
  const { data } = await response.json();
  return {
    summary:   data.summary,
    decisions: data.decisions ?? [],
    tasks:     data.tasks ?? data.actions ?? [],
  };
}

/* ═══════════════════════════════════════════
   APPEL API — IMPORT DIRECT (upload S3)
═══════════════════════════════════════════ */
async function uploadFileDirect(file, meetingId) {
  const formData = new FormData();
  formData.append('fichier', file);
  const response = await fetch(
    `/api/reunions/${meetingId}/compte-rendu/fichier`,
    {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body:    formData,
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Erreur lors de l'upload");
  }
  return response.json();
}

/* ═══════════════════════════════════════════
   LECTURE FICHIER (pour extraction texte → IA)
═══════════════════════════════════════════ */
async function readFileAsText(file) {
  if (file.name.endsWith('.docx') || file.type.includes('wordprocessingml')) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (!result.value?.trim()) throw new Error('Document vide ou non lisible.');
    return result.value;
  }
  if (file.type === 'application/pdf') {
    return `[PDF : ${file.name}]\n\nContenu à compléter manuellement.`;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Lecture impossible'));
    reader.readAsText(file);
  });
}

/* ═══════════════════════════════════════════
   SKELETON
═══════════════════════════════════════════ */
function Skel({ w = '100%', h = 14, mb = 9 }) {
  return (
    <div
      className="mcr4-skel"
      style={{ width: w, height: h, marginBottom: mb, borderRadius: 5, background: '#E5E7EB' }}
    />
  );
}

/* ═══════════════════════════════════════════
   ONGLETS RÉSULTATS
   - Résumé masqué quand hasExistingFile = true
═══════════════════════════════════════════ */
const ALL_TABS = [
  { k: 'summary',   label: 'Résumé',    Icon: Ic.doc   },
  { k: 'decisions', label: 'Décisions', Icon: Ic.check },
  { k: 'tasks',     label: 'Tâches',    Icon: Ic.task  },
];

function TabBar({ active, result, onSwitch, hideSummary }) {
  const tabs = hideSummary ? ALL_TABS.filter(t => t.k !== 'summary') : ALL_TABS;

  const count = k => {
    if (k === 'decisions') return result?.decisions?.length || 0;
    if (k === 'tasks')     return result?.tasks?.length     || 0;
    return null;
  };
  return (
    <div style={{ display: 'flex', background: X.bg, borderBottom: `1.5px solid ${X.bd}` }}>
      {tabs.map(({ k, label, Icon }) => {
        const n = count(k);
        return (
          <button
            key={k}
            className={`mcr4-tab${active === k ? ' active' : ''}`}
            onClick={() => onSwitch(k)}
          >
            <Icon />
            {label}
            {n > 0 && (
              <span style={{
                padding: '1px 7px', borderRadius: 20,
                background: active === k ? X.blueLt : X.bd,
                color:      active === k ? X.blue   : X.t3,
                fontSize: 11, fontWeight: 700,
                border: `1px solid ${active === k ? X.blueBd : X.bd}`,
              }}>{n}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   COMPOSANT RECHERCHE UTILISATEUR
   Remplace le <select> — autocomplétion avec
   recherche dans la liste des membres
═══════════════════════════════════════════ */
function UserSearch({ membres, value, onChange }) {
  const [query,   setQuery]   = useState('');
  const [open,    setOpen]    = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = React.useRef(null);

  // Membre sélectionné
  const selected = membres.find(m => m.id === value) ?? null;

  // Filtrage
  const filtered = query.trim()
    ? membres.filter(m =>
        m.name?.toLowerCase().includes(query.toLowerCase()) ||
        m.email?.toLowerCase().includes(query.toLowerCase())
      )
    : membres;

  // Fermer au clic extérieur
  React.useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (membre) => {
    onChange(membre ? membre.id : null);
    setOpen(false);
    setQuery('');
  };

  const displayValue = selected
    ? selected.name
    : focused ? query : '';

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      {/* Champ input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        border: `1.5px solid ${open ? X.blue : X.bdm}`,
        borderRadius: X.r6, background: '#fff',
        padding: '5px 10px',
        transition: 'border-color .15s',
        boxShadow: open ? `0 0 0 3px rgba(30,111,232,.1)` : 'none',
      }}>
        {/* Avatar si sélectionné */}
        {selected ? (
          <span style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            background: X.blue, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700,
          }}>
            {selected.name?.slice(0, 2).toUpperCase()}
          </span>
        ) : (
          <span style={{ color: X.t4, lineHeight: 0, flexShrink: 0 }}><Ic.user /></span>
        )}

        <input
          value={open ? query : (selected?.name ?? '')}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setFocused(true); setOpen(true); setQuery(''); }}
          onBlur={() => setFocused(false)}
          placeholder="Chercher un responsable…"
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: 12, color: selected && !open ? X.t1 : X.t2,
            fontFamily: 'inherit', background: 'transparent',
            fontWeight: selected && !open ? 600 : 400,
          }}
        />

        {/* Bouton clear */}
        {selected && (
          <button
            onMouseDown={e => { e.preventDefault(); select(null); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: X.t4, lineHeight: 0, padding: 0, flexShrink: 0,
            }}
          >
            <Ic.close />
          </button>
        )}
      </div>

      {/* Dropdown résultats */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: `1.5px solid ${X.blueBd}`,
          borderRadius: X.r8, zIndex: 200,
          boxShadow: '0 8px 24px rgba(0,0,0,.12)',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {/* Option "Aucun" */}
          <button
            onMouseDown={e => { e.preventDefault(); select(null); }}
            style={{
              width: '100%', padding: '8px 12px', border: 'none',
              background: !value ? X.blueLt : 'transparent',
              color: X.t3, fontSize: 12, fontStyle: 'italic',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              borderBottom: `1px solid ${X.bd}`,
            }}
          >
            — Aucun responsable —
          </button>

          {filtered.length === 0 ? (
            <p style={{ padding: '10px 12px', fontSize: 12, color: X.t4, margin: 0, fontStyle: 'italic' }}>
              Aucun résultat pour « {query} »
            </p>
          ) : (
            filtered.map(m => (
              <button
                key={m.id}
                onMouseDown={e => { e.preventDefault(); select(m); }}
                style={{
                  width: '100%', padding: '8px 12px', border: 'none',
                  background: m.id === value ? X.blueLt : 'transparent',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 9,
                  borderBottom: `1px solid ${X.bd}`,
                  transition: 'background .1s',
                }}
                onMouseEnter={e => { if (m.id !== value) e.currentTarget.style.background = X.bg; }}
                onMouseLeave={e => { if (m.id !== value) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Avatar */}
                <span style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: m.id === value ? X.blue : X.bdm,
                  color: m.id === value ? '#fff' : X.t2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                }}>
                  {m.name?.slice(0, 2).toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 12.5, fontWeight: 600,
                    color: m.id === value ? X.blue : X.t1,
                    margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{m.name}</p>
                  {m.email && (
                    <p style={{
                      fontSize: 10.5, color: X.t4, margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-mono)',
                    }}>{m.email}</p>
                  )}
                </div>
                {m.id === value && (
                  <span style={{ color: X.blue, lineHeight: 0, flexShrink: 0 }}>
                    <Ic.check />
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   CONTENU RÉSULTATS
═══════════════════════════════════════════ */
function ResultContent({ tab, result, membres, onAssigneeChange, onTaskChange, onTaskAdd, onTaskRemove }) {
  if (tab === 'summary') {
    return (
      <div style={{ padding: '16px 18px' }}>
        <div style={{
          background: X.blueLt, border: `1.5px solid ${X.blueBd}`,
          borderRadius: X.r10, padding: '14px 16px',
        }}>
          <p style={{ fontSize: 14, color: X.t1, lineHeight: 1.8, margin: 0 }}>
            {result.summary || <em style={{ color: X.t4 }}>Aucun résumé.</em>}
          </p>
        </div>
      </div>
    );
  }

  if (tab === 'decisions') {
    return (
      <div style={{ padding: '4px 18px 16px' }}>
        {!result.decisions?.length
          ? <p style={{ fontSize: 13, color: X.t4, fontStyle: 'italic', padding: '12px 0' }}>
              Aucune décision enregistrée.
            </p>
          : result.decisions.map((d, i) => (
              <div key={i} className="mcr4-decision-row">
                <span style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: X.blue, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, marginTop: 2,
                }}>{i + 1}</span>
                <p style={{ fontSize: 14, color: X.t2, lineHeight: 1.6, margin: 0, paddingTop: 3 }}>{d}</p>
              </div>
            ))
        }
      </div>
    );
  }

  if (tab === 'tasks') {
    return (
      <div style={{ padding: '12px 18px 4px' }}>
        {result.tasks?.map((t, i) => {
          const title = typeof t === 'string' ? t : t.title || '';
          return (
            <div key={i} className="mcr4-task-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>

              {/* Ligne titre + supprimer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: X.blue, flexShrink: 0 }} />
                <input
                  value={title}
                  onChange={e => onTaskChange(i, 'title', e.target.value)}
                  placeholder="Titre de la tâche…"
                  style={{
                    flex: 1, border: `1.5px solid ${X.bdm}`, borderRadius: X.r6,
                    padding: '6px 10px', fontSize: 13.5, fontWeight: 600,
                    color: X.t1, fontFamily: 'inherit', outline: 'none',
                    background: '#fff', transition: 'border-color .15s',
                  }}
                  onFocus={e => e.target.style.borderColor = X.blue}
                  onBlur={e => e.target.style.borderColor = X.bdm}
                />
                <button
                  onClick={() => onTaskRemove(i)}
                  title="Supprimer"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: X.t4, lineHeight: 0, padding: 4, flexShrink: 0,
                    borderRadius: X.r6, transition: 'color .13s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = X.red}
                  onMouseLeave={e => e.currentTarget.style.color = X.t4}
                >
                  <Ic.close />
                </button>
              </div>

              {/* Ligne assignée + date */}
              <div style={{ display: 'flex', gap: 8, paddingLeft: 16 }}>
                {/* Responsable — autocomplétion avec recherche */}
                <UserSearch
                  membres={membres}
                  value={t.user_id ?? null}
                  onChange={userId => onAssigneeChange(i, userId)}
                />

                {/* Échéance */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ color: X.t3, lineHeight: 0, flexShrink: 0 }}><Ic.cal /></span>
                  <input
                    type="date"
                    value={t.due || ''}
                    onChange={e => onTaskChange(i, 'due', e.target.value || null)}
                    style={{
                      padding: '5px 8px', borderRadius: X.r6,
                      border: `1.5px solid ${X.bdm}`, background: '#fff',
                      fontSize: 12, color: t.due ? X.orange : X.t4,
                      fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
                      fontWeight: t.due ? 700 : 400,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Bouton ajouter une tâche */}
        <button
          onClick={onTaskAdd}
          style={{
            width: '100%', margin: '8px 0 12px',
            padding: '9px 14px',
            border: `2px dashed ${X.blueBd}`,
            borderRadius: X.r8, background: 'transparent',
            color: X.blue, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            transition: 'background .13s, border-color .13s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = X.blueLt; e.currentTarget.style.borderColor = X.blue; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = X.blueBd; }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Ajouter une tâche
        </button>
      </div>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════
   ÉTAT CHARGEMENT IA
═══════════════════════════════════════════ */
const LOADING_MSGS = [
  'Lecture des notes en cours…',
  'Identification des décisions…',
  'Extraction des tâches…',
  'Finalisation du compte rendu…',
];

function LoadingState() {
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => {
      setMsgIdx(i => Math.min(i + 1, LOADING_MSGS.length - 1));
    }, 800);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ padding: '20px 18px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', marginBottom: 20,
        background: X.blueLt, border: `1.5px solid ${X.blueBd}`,
        borderRadius: X.r8,
      }}>
        <span style={{ color: X.blue, lineHeight: 0, flexShrink: 0 }}><Ic.spin /></span>
        <span style={{ fontSize: 14, fontWeight: 600, color: X.blue }}>
          {LOADING_MSGS[msgIdx]}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {LOADING_MSGS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 4,
            background: i <= msgIdx ? X.blue : X.bd,
            transition: 'background .4s',
          }} />
        ))}
      </div>
      <Skel w="55%" h={17} />
      <Skel w="90%" />
      <Skel w="78%" />
      <Skel w="62%" mb={22} />
      <Skel w="38%" h={14} />
      <Skel w="100%" h={52} />
      <Skel w="100%" h={52} mb={0} />
    </div>
  );
}

/* ═══════════════════════════════════════════
   ÉTAT CHARGEMENT IMPORT
═══════════════════════════════════════════ */
function UploadingState({ fileName }) {
  return (
    <div style={{ padding: '20px 18px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px',
        background: X.greenLt, border: `1.5px solid ${X.greenBd}`,
        borderRadius: X.r8,
      }}>
        <span style={{ color: X.green, lineHeight: 0, flexShrink: 0 }}><Ic.spin /></span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: X.green, margin: 0 }}>
            Import en cours…
          </p>
          {fileName && (
            <p style={{ fontSize: 12, color: X.t3, margin: '3px 0 0', fontFamily: 'monospace' }}>
              {fileName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ZONE DE DROP (hasExistingFile uniquement)
   Remplace le textarea — invite à importer
   un doc pour analyse
═══════════════════════════════════════════ */
function DropZone({ file, onFile, onRemove, fileRef }) {
  const handleDrop = useCallback(e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  if (file) {
    return (
      <div className="mcr4-file-chip" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: X.blue, lineHeight: 0 }}><Ic.doc /></span>
          <span style={{
            fontSize: 12.5, fontWeight: 600, color: X.blue,
            maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{file.name}</span>
        </div>
        <button onClick={onRemove} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: X.t3, lineHeight: 0, padding: 2,
        }}>
          <Ic.close />
        </button>
      </div>
    );
  }

  return (
    <div
      className="mcr4-drop-zone"
      onClick={() => fileRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      <span style={{ display: 'block', color: X.blue, lineHeight: 0, marginBottom: 10 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M12 4v12M8 8l4-4 4 4M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <p style={{ fontSize: 14, fontWeight: 600, color: X.blue, margin: '0 0 4px' }}>
        Importer un document à analyser
      </p>
      <p style={{ fontSize: 12, color: X.t3, margin: 0 }}>
        Word, PDF ou TXT — glissez-déposez ou cliquez
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════ */
export default function MeetingCR({ meeting, onSaved, hasExistingFile = false }) {
  useStyles();

  const { id } = meeting || {};

  const [notes,       setNotes]       = useState('');
  const [file,        setFile]        = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // step : 'input' | 'loading' | 'uploading' | 'result'
  const [step,      setStep]      = useState('input');
  const [result,    setResult]    = useState(null);
  // Quand hasExistingFile : démarrer sur 'decisions' (pas de résumé)
  const [tab,       setTab]       = useState('summary');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);
  const [membres,   setMembres]   = useState([]);

  const fileRef   = useRef(null);
  const resultRef = useRef(null);

  // Quand hasExistingFile : canGenerate requiert un fichier importé (texte extrait)
  // Quand !hasExistingFile : notes saisies manuellement ou via fichier
  const canGenerate = notes.trim().length > 5;

  /* ── Chargement des membres depuis l'API ── */
  useEffect(() => {
    fetch('/api/membres', {
      headers: { 'Authorization': `Bearer ${getToken()}`, 'Accept': 'application/json' },
    })
      .then(r => r.json())
      .then(({ data }) => {
        const normalized = (data || []).map(m => {
          const prenom = m.prenom || '';
          const nom    = m.nom    || '';
          const full   = (prenom + ' ' + nom).trim();
          const name   = m.name || full || m.user_name || m.email || '';
          const email  = m.email || m.user_email || null;
          const id     = m.id || m.user_id;
          return { id, name, email };
        });
        setMembres(normalized);
      })
      .catch(() => {});
  }, []);

  /* ── Mise à jour assignee d'une tâche ── */
  const updateTaskAssignee = useCallback((taskIndex, userId) => {
    setResult(prev => ({
      ...prev,
      tasks: prev.tasks.map((t, i) =>
        i === taskIndex ? { ...t, user_id: userId || null } : t
      ),
    }));
  }, []);

  /* ── Modification d'un champ d'une tâche ── */
  const updateTaskField = useCallback((taskIndex, field, value) => {
    setResult(prev => ({
      ...prev,
      tasks: prev.tasks.map((t, i) =>
        i === taskIndex ? { ...t, [field]: value } : t
      ),
    }));
  }, []);

  /* ── Ajouter une tâche vide ── */
  const addTask = useCallback(() => {
    setResult(prev => ({
      ...prev,
      tasks: [...(prev.tasks || []), { title: '', user_id: null, due: null }],
    }));
    setTab('tasks');
  }, []);

  /* ── Supprimer une tâche ── */
  const removeTask = useCallback((taskIndex) => {
    setResult(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== taskIndex),
    }));
  }, []);

  /* ── Import fichier ── */
  const handleFile = useCallback(async (f) => {
    if (!f) return;
    setError(null);
    setFile(f);

    // Prévisualisation (seulement si pas hasExistingFile)
    if (!hasExistingFile) {
      const url   = URL.createObjectURL(f);
      const isPDF = f.type === 'application/pdf';
      setFilePreview({ url, name: f.name, isPDF });
    }

    // Extraction texte pour l'IA
    try {
      const text = await readFileAsText(f);
      setNotes(text);
    } catch {
      setNotes('');
    }
  }, [hasExistingFile]);

  const removeFile = useCallback(() => {
    if (filePreview?.url) URL.revokeObjectURL(filePreview.url);
    setFile(null);
    setFilePreview(null);
    setNotes('');
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  }, [filePreview]);

  /* ── CHEMIN 2 : Import direct vers S3 ── */
  const handleImportDirect = useCallback(async () => {
    if (!file) return;
    setStep('uploading');
    setError(null);
    try {
      await uploadFileDirect(file, id);
      onSaved?.({
        summary:   '',
        decisions: [],
        tasks:     [],
        has_file:  true,
      });
    } catch (e) {
      setError(e.message || "Erreur lors de l'import du fichier.");
      setStep('input');
    }
  }, [file, id, onSaved]);

  /* ── CHEMIN 1 : Génération IA depuis notes ── */
  const generate = useCallback(async (notesOverride) => {
    const text = notesOverride ?? notes;
    if (!text || text.trim().length <= 5) return;
    setStep('loading');
    setError(null);
    try {
      const res = await callClaude(text, id);
      setResult(res);
      setTab('summary');
      setStep('result');
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } catch (e) {
      console.error(e);
      setError('Erreur lors de la génération. Vérifiez votre connexion et réessayez.');
      setStep('input');
    }
  }, [notes, id]);

  /* ── CHEMIN hasExistingFile : le backend extrait le texte depuis S3 ──
     La méthode /generer détecte le placeholder "[PDF :" et récupère
     automatiquement le contenu du fichier stocké en S3.
     Aucun download côté frontend nécessaire. */
  const handleAnalyzeExisting = useCallback(async () => {
    await generate('[PDF : analyse depuis fichier importé]');
  }, [generate]);

  /* ── Sauvegarde résultats IA ── */
  const handleSave = useCallback(async () => {
    if (!result || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/reunions/${id}/compte-rendu/sauvegarder`,
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${getToken()}`,
            'Accept':        'application/json',
          },
          body: JSON.stringify({
            summary:   result.summary,
            decisions: result.decisions ?? [],
            tasks:     result.tasks     ?? [],
            preserve_file: hasExistingFile ? true : undefined,
          }),
        }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur sauvegarde');
      }
      // ✅ Normaliser les tâches avant de passer à onSaved
      // L'éditeur stocke user_id mais handleCRSaved attend assignee/due
      const normalizedTasks = (result.tasks ?? []).map(t => ({
        title:    typeof t === 'string' ? t : (t.title ?? ''),
        assignee: typeof t === 'object' ? (t.assignee ?? null) : null,
        due:      typeof t === 'object' ? (t.due ?? null) : null,
        user_id:  typeof t === 'object' ? (t.user_id ?? null) : null,
      }));

      onSaved?.({ ...result, tasks: normalizedTasks, has_file: hasExistingFile ? true : false });
    } catch (e) {
      setError(e.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }, [result, saving, id, onSaved, hasExistingFile]);

  /* ── Reset ── */
  const restart = useCallback(() => {
    if (filePreview?.url) URL.revokeObjectURL(filePreview.url);
    setNotes('');
    setFile(null);
    setFilePreview(null);
    setResult(null);
    setError(null);
    setTab('summary');
    setStep('input');
    if (fileRef.current) fileRef.current.value = '';
  }, [filePreview]);

  /* ─────────────────────────────────────────
     RENDU
  ───────────────────────────────────────── */
  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", maxWidth: 640 }}>

      {/* ══════════════════════════
          SAISIE / IMPORT
      ══════════════════════════ */}
      {step === 'input' && (
        <div>

          {/* ─── CAS hasExistingFile : analyse directe du fichier S3, PAS de re-import ─── */}
          {hasExistingFile ? (
            <>
              {/* Bandeau informatif */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 14px', marginBottom: 16, borderRadius: X.r8,
                background: X.blueLt, border: `1.5px solid ${X.blueBd}`,
                fontSize: 13, color: X.blue, lineHeight: 1.55,
              }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>ℹ️</span>
                <span>
                  Le document déjà importé va être analysé automatiquement par l'IA
                  pour en extraire le <strong>résumé</strong>, les <strong>décisions</strong> et les <strong>tâches</strong>.
                  Aucune nouvelle importation n'est nécessaire.
                </span>
              </div>

              {/* Erreur */}
              {error && (
                <div style={{
                  marginBottom: 14, padding: '10px 14px', borderRadius: X.r8,
                  background: X.redLt, border: `1.5px solid ${X.redBd}`,
                  fontSize: 13, color: X.red, lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}

              <button
                className="mcr4-btn-primary"
                onClick={handleAnalyzeExisting}
              >
                <Ic.sparkle /> Analyser le compte rendu importé
              </button>
            </>
          ) : (
            /* ─── CAS normal : textarea si pas de fichier, sinon chip ─── */
            <>
              {/* Textarea uniquement quand aucun fichier n'est sélectionné */}
              {!file && (
                <>
                  <textarea
                    className="mcr4-textarea"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={`Tapez ou collez vos notes de réunion ici…\n\nExemple :\n« Budget Q3 validé à 12M FCFA. Fatou prépare l'audit avant le 30. Gel des recrutements décidé jusqu'en septembre. »`}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <button className="mcr4-import-btn" onClick={() => fileRef.current?.click()}>
                      <Ic.upload /> Importer un document (Word, PDF, TXT)
                    </button>
                    <span style={{ fontSize: 12, color: X.t4 }}>{notes.trim().length} car.</span>
                  </div>
                </>
              )}

              {/* Chip fichier quand un fichier est sélectionné */}
              {file && (
                <div className="mcr4-file-chip" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: X.blue, lineHeight: 0 }}><Ic.doc /></span>
                    <span style={{
                      fontSize: 12.5, fontWeight: 600, color: X.blue,
                      maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{file.name}</span>
                  </div>
                  <button onClick={removeFile} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: X.t3, lineHeight: 0, padding: 2,
                  }}>
                    <Ic.close />
                  </button>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,.md,.docx"
                style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])}
              />

              {/* Prévisualisation fichier */}
              {filePreview && (
                <div style={{
                  marginTop: 12, borderRadius: X.r10,
                  border: `1.5px solid ${X.blueBd}`,
                  overflow: 'hidden', background: X.bg2,
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', background: X.blueLt,
                    borderBottom: `1px solid ${X.blueBd}`,
                  }}>
                    <Ic.doc />
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: X.blue, flex: 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {filePreview.name}
                    </span>
                    <button
                      onClick={() => window.open(filePreview.url, '_blank')}
                      style={{
                        padding: '3px 10px', borderRadius: X.r6,
                        border: `1px solid ${X.blueBd}`, background: '#fff',
                        fontSize: 11.5, fontWeight: 600, color: X.blue,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      Ouvrir ↗
                    </button>
                  </div>
                  {filePreview.isPDF ? (
                    <iframe
                      src={filePreview.url}
                      title={filePreview.name}
                      style={{ width: '100%', height: 340, border: 'none', display: 'block' }}
                    />
                  ) : (
                    <div style={{
                      padding: '12px 14px', maxHeight: 260, overflowY: 'auto',
                      fontSize: 12.5, color: X.t2, lineHeight: 1.75,
                      whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono, monospace)',
                    }}>
                      {notes || <em style={{ color: X.t4 }}>Contenu vide.</em>}
                    </div>
                  )}
                </div>
              )}

              {/* Erreur */}
              {error && (
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: X.r8,
                  background: X.redLt, border: `1.5px solid ${X.redBd}`,
                  fontSize: 13, color: X.red, lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}

              {/* Boutons selon contexte */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                {file ? (
                  <>
                    {/* Seul l'import direct est disponible avant enregistrement */}
                    <button
                      className="mcr4-btn-import"
                      onClick={handleImportDirect}
                    >
                      <Ic.upload /> Importer le document tel quel
                    </button>
                  </>
                ) : (
                  /* Pas de fichier → saisie manuelle */
                  <button
                    className="mcr4-btn-primary"
                    onClick={() => generate()}
                    disabled={!canGenerate}
                  >
                    <Ic.sparkle /> Générer le compte rendu automatiquement
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════
          CHARGEMENT IA
      ══════════════════════════ */}
      {step === 'loading' && <LoadingState />}

      {/* ══════════════════════════
          CHARGEMENT IMPORT
      ══════════════════════════ */}
      {step === 'uploading' && <UploadingState fileName={file?.name} />}

      {/* ══════════════════════════
          RÉSULTATS IA
      ══════════════════════════ */}
      {step === 'result' && result && (
        <div className="mcr4-up" ref={resultRef}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px',
            background: X.bg,
            border: `1.5px solid ${X.bd}`,
            borderBottom: 'none',
            borderRadius: `${X.r10} ${X.r10} 0 0`,
          }}>
            <span style={{
              fontSize: 12.5, fontWeight: 700, color: X.t3,
              textTransform: 'uppercase', letterSpacing: '.07em',
            }}>
              {hasExistingFile ? 'Tâches et décisions extraites' : 'Résultats de l\'analyse'}
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {tab === 'tasks' && (
                <button
                  onClick={addTask}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: X.r6,
                    border: `1.5px solid ${X.blueBd}`,
                    background: X.blueLt, color: X.blue,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all .13s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#DBEAFE'; e.currentTarget.style.borderColor = X.blue; }}
                  onMouseLeave={e => { e.currentTarget.style.background = X.blueLt; e.currentTarget.style.borderColor = X.blueBd; }}
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                  Ajouter
                </button>
              )}
              <button
                onClick={restart}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12.5, color: X.t3, fontFamily: 'inherit',
                  textDecoration: 'underline', textUnderlineOffset: 2, padding: 0,
                }}
              >
                Recommencer
              </button>
            </div>
          </div>

          <div style={{ border: `1.5px solid ${X.bd}`, borderTop: 'none', borderBottom: 'none' }}>
            {/* Tous les onglets disponibles après analyse */}
            <TabBar
              active={tab}
              result={result}
              onSwitch={setTab}
              hideSummary={false}
            />
          </div>

          <div style={{
            border: `1.5px solid ${X.bd}`,
            borderTop: 'none',
            borderRadius: `0 0 ${X.r10} ${X.r10}`,
            background: '#fff',
          }}>
            <ResultContent
              tab={tab}
              result={result}
              membres={membres}
              onAssigneeChange={updateTaskAssignee}
              onTaskChange={updateTaskField}
              onTaskAdd={addTask}
              onTaskRemove={removeTask}
            />

            {error && (
              <div style={{
                margin: '0 18px 14px', padding: '10px 14px', borderRadius: X.r8,
                background: X.redLt, border: `1.5px solid ${X.redBd}`,
                fontSize: 13, color: X.red,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, padding: '0 18px 18px' }}>
              <button
                className="mcr4-btn-save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? <><Ic.spin /> Enregistrement…</>
                  : <><Ic.save /> {hasExistingFile ? 'Enregistrer le résumé, tâches et décisions' : 'Enregistrer le compte rendu'}</>
                }
              </button>
              <button className="mcr4-btn-ghost-sm" onClick={restart}>
                Recommencer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}